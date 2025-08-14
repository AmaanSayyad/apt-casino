import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  buildLiveEstimate,
  computeUnlockAt,
  getOtcLotteryConfig,
  isValidSolanaAddress,
  normalizeSolWallet,
  formatOtcEntry,
} from '@/lib/server/otcLottery';
import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';
import { fetchSolUsdPrice } from '@/lib/server/otcLottery';
import {
  getRecentSignaturesForAddress,
  getTransaction,
  lamportsToSol,
  parseSolTransferToTreasury,
} from '@/lib/server/solanaRpc';

export const dynamic = 'force-dynamic';

/**
 * Scan recent treasury deposits from a wallet and register the newest unregistered transfer.
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

  let body: { solSenderWallet?: string; aptcReceiveWallet?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sender = normalizeSolWallet(body.solSenderWallet || '');
  const aptcReceive = normalizeSolWallet(body.aptcReceiveWallet || sender);

  if (!isValidSolanaAddress(sender)) {
    return NextResponse.json({ error: 'Invalid Solana wallet' }, { status: 400 });
  }
  if (!isValidSolanaAddress(aptcReceive)) {
    return NextResponse.json({ error: 'Invalid APTC receive wallet' }, { status: 400 });
  }

  const treasury = cfg.treasuryWallet;
  const sigs = await getRecentSignaturesForAddress(treasury, 60);

  for (const info of sigs) {
    if (info.err) continue;

    const { data: used } = await supabase
      .from('otc_lottery_entries')
      .select('id')
      .eq('sol_tx_signature', info.signature)
      .maybeSingle();

    if (used) continue;

    const tx = await getTransaction(info.signature);
    if (!tx) continue;

    const parsed = parseSolTransferToTreasury(tx, treasury, sender);
    if (!parsed || parsed.sender !== sender) continue;

    const solAmount = lamportsToSol(parsed.lamports);
    if (solAmount < cfg.minSol || solAmount > cfg.maxSol) continue;

    const estimate = await buildLiveEstimate(solAmount);
    const [solPriceUsd, aptcStats] = await Promise.all([
      fetchSolUsdPrice(),
      fetchAptcDexscreenerStats(),
    ]);

    const unlockAt = computeUnlockAt(parsed.blockTime);

    const row = {
      sol_sender_wallet: sender,
      sol_tx_signature: info.signature,
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
      if (error.code === '23505') continue;
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      entry: formatOtcEntry(data),
      message: 'Deposit detected and registered.',
    });
  }

  return NextResponse.json(
    {
      error:
        'No new SOL transfer found from your wallet to our treasury. Send SOL first, then try again in a few seconds.',
    },
    { status: 404 },
  );
}
