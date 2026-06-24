import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  buildLiveEstimate,
  computeUnlockAt,
  getOtcLotteryConfig,
  isValidSolanaAddress,
  isValidSolTxSignature,
  normalizeSolWallet,
} from '@/lib/server/otcLottery';
import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';
import { fetchSolUsdPrice, formatOtcEntry } from '@/lib/server/otcLottery';
import { rateLimitRequest } from '@/lib/server/requestRateLimit';
import {
  fetchTransactionWithRetries,
  lamportsToSol,
  parseSolTransferToTreasury,
} from '@/lib/server/solanaRpc';

export const dynamic = 'force-dynamic';

type EnterBody = {
  solSenderWallet?: string;
  solTxSignature?: string;
  solAmount?: number;
  solSentAt?: string;
  aptcReceiveWallet?: string;
  email?: string;
  telegram?: string;
  userNotes?: string;
};

export async function POST(request: NextRequest) {
  if (rateLimitRequest(request, { key: 'otc-lottery-enter', limit: 15, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

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

  let body: EnterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const solSenderWallet = normalizeSolWallet(body.solSenderWallet || '');
  const solTxSignature = String(body.solTxSignature || '').trim();
  const aptcReceiveWallet = solSenderWallet;
  let solAmount = Number(body.solAmount);
  let sentAtRaw = body.solSentAt ? new Date(body.solSentAt) : new Date();

  // Prefer on-chain values — poll RPCs until the tx is indexed after wallet confirmation
  try {
    const tx = await fetchTransactionWithRetries(solTxSignature, 35_000);
    if (tx) {
      const parsed = parseSolTransferToTreasury(tx, cfg.treasuryWallet, solSenderWallet);
      if (parsed) {
        solAmount = lamportsToSol(parsed.lamports);
        sentAtRaw = parsed.blockTime;
      } else {
        return NextResponse.json(
          {
            error:
              'SOL transfer not verified on-chain yet. Wait a few seconds and tap “Detect my deposit”, or try again.',
          },
          { status: 422 },
        );
      }
    }
  } catch {
    /* fall back to client-provided values when RPC is temporarily unavailable */
  }

  if (!isValidSolanaAddress(solSenderWallet)) {
    return NextResponse.json({ error: 'Invalid Solana sender wallet' }, { status: 400 });
  }
  if (!isValidSolTxSignature(solTxSignature)) {
    return NextResponse.json({ error: 'Invalid Solana transaction signature' }, { status: 400 });
  }
  if (!Number.isFinite(solAmount) || solAmount < cfg.minSol || solAmount > cfg.maxSol) {
    return NextResponse.json(
      { error: `SOL amount must be between ${cfg.minSol} and ${cfg.maxSol}` },
      { status: 400 },
    );
  }

  if (Number.isNaN(sentAtRaw.getTime())) {
    return NextResponse.json({ error: 'Invalid solSentAt' }, { status: 400 });
  }
  if (sentAtRaw.getTime() > Date.now() + 5 * 60_000) {
    return NextResponse.json({ error: 'Send time cannot be in the future' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('otc_lottery_entries')
    .select('id')
    .eq('sol_tx_signature', solTxSignature)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'This transaction is already registered' }, { status: 409 });
  }

  const estimate = await buildLiveEstimate(solAmount);
  const [solPriceUsd, aptcStats] = await Promise.all([fetchSolUsdPrice(), fetchAptcDexscreenerStats()]);

  const unlockAt = computeUnlockAt(sentAtRaw);

  const row = {
    sol_sender_wallet: solSenderWallet,
    sol_tx_signature: solTxSignature,
    sol_amount: solAmount,
    sol_sent_at: sentAtRaw.toISOString(),
    aptc_receive_wallet: aptcReceiveWallet,
    optional_email: body.email?.trim() || null,
    optional_telegram: body.telegram?.trim() || null,
    user_notes: body.userNotes?.trim() || null,
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
    console.error('otc lottery insert:', error);
    return NextResponse.json({ error: error.message || 'Failed to save entry' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    entry: formatOtcEntry(data),
    message: 'Entry recorded. An admin will review your deal.',
  });
}
