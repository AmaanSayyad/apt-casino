import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  buildLiveEstimate,
  computeUnlockAt,
  getOtcLotteryConfig,
  isValidSolanaAddress,
  isValidSolTxSignature,
  normalizeSolWallet,
  formatOtcEntry,
} from '@/lib/server/otcLottery';
import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';
import { fetchSolUsdPrice } from '@/lib/server/otcLottery';
import {
  fetchTransactionWithRetries,
  getRecentSignaturesForAddress,
  lamportsToSol,
  parseSolTransferToTreasury,
} from '@/lib/server/solanaRpc';

export const dynamic = 'force-dynamic';

type SyncBody = {
  solSenderWallet?: string;
  aptcReceiveWallet?: string;
  solTxSignature?: string;
};

async function registerDepositFromSignature(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  cfg: ReturnType<typeof getOtcLotteryConfig>,
  sender: string,
  aptcReceive: string,
  signature: string,
) {
  const { data: used } = await supabase
    .from('otc_lottery_entries')
    .select('id')
    .eq('sol_tx_signature', signature)
    .maybeSingle();

  if (used) return { kind: 'skip' as const };

  const tx = await fetchTransactionWithRetries(signature, 12_000);
  if (!tx) return { kind: 'miss' as const };

  const parsed = parseSolTransferToTreasury(tx, cfg.treasuryWallet, sender);
  if (!parsed || parsed.sender !== sender) return { kind: 'miss' as const };

  const solAmount = lamportsToSol(parsed.lamports);
  if (solAmount < cfg.minSol || solAmount > cfg.maxSol) return { kind: 'miss' as const };

  const estimate = await buildLiveEstimate(solAmount);
  const [solPriceUsd, aptcStats] = await Promise.all([
    fetchSolUsdPrice(),
    fetchAptcDexscreenerStats(),
  ]);

  const unlockAt = computeUnlockAt(parsed.blockTime);

  const row = {
    sol_sender_wallet: sender,
    sol_tx_signature: signature,
    sol_amount: solAmount,
    sol_sent_at: parsed.blockTime.toISOString(),
    aptc_receive_wallet: aptcReceive,
    optional_email: null,
    optional_telegram: null,
    user_notes: null,
    sol_price_usd: solPriceUsd,
    aptc_price_usd: aptcStats.priceUsd,
    estimated_aptc: estimate?.estimatedAptc ?? null,
    swap_platform_fee_bps: cfg.swapPlatformFeeBps,
    token_trade_tax_bps: cfg.tokenTradeTaxBps,
    unlock_at: unlockAt.toISOString(),
    status: 'pending_review',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('otc_lottery_entries').insert(row).select().single();

  if (error) {
    if (error.code === '23505') return { kind: 'skip' as const };
    throw new Error(error.message);
  }

  return { kind: 'ok' as const, entry: formatOtcEntry(data) };
}

/**
 * Scan recent deposits from a wallet and register the newest unregistered transfer.
 * Optionally targets a specific tx signature (fast path after wallet send).
 */
export async function POST(request: NextRequest) {
  const cfg = getOtcLotteryConfig();
  if (!cfg.enabled) {
    return NextResponse.json({ error: 'OTC lottery is not open yet.' }, { status: 403 });
  }
  if (!cfg.treasuryWallet) {
    return NextResponse.json({ error: 'OTC treasury wallet not configured.' }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  let body: SyncBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sender = normalizeSolWallet(body.solSenderWallet || '');
  const aptcReceive = sender;
  const explicitSig = String(body.solTxSignature || '').trim();

  if (!isValidSolanaAddress(sender)) {
    return NextResponse.json({ error: 'Invalid Solana wallet' }, { status: 400 });
  }
  if (!isValidSolanaAddress(aptcReceive)) {
    return NextResponse.json({ error: 'Invalid APTC receive wallet' }, { status: 400 });
  }
  if (explicitSig && !isValidSolTxSignature(explicitSig)) {
    return NextResponse.json({ error: 'Invalid transaction signature' }, { status: 400 });
  }

  try {
    if (explicitSig) {
      const direct = await registerDepositFromSignature(supabase, cfg, sender, aptcReceive, explicitSig);
      if (direct.kind === 'ok') {
        return NextResponse.json({
          success: true,
          entry: direct.entry,
          message: 'Deposit detected and registered.',
        });
      }
    }

    const treasury = cfg.treasuryWallet;
    const [senderSigs, treasurySigs] = await Promise.all([
      getRecentSignaturesForAddress(sender, 25),
      getRecentSignaturesForAddress(treasury, 40),
    ]);

    const seen = new Set<string>();
    const candidates = [...senderSigs, ...treasurySigs].filter((info) => {
      if (info.err || seen.has(info.signature)) return false;
      seen.add(info.signature);
      return true;
    });

    candidates.sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0));

    for (const info of candidates) {
      const result = await registerDepositFromSignature(
        supabase,
        cfg,
        sender,
        aptcReceive,
        info.signature,
      );
      if (result.kind === 'ok') {
        return NextResponse.json({
          success: true,
          entry: result.entry,
          message: 'Deposit detected and registered.',
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json(
    {
      error:
        'No new SOL transfer found from your wallet to our treasury. Send SOL first, then try again in a few seconds.',
    },
    { status: 404 },
  );
}
