/**
 * OTC lottery: config, fee model, and APTC estimate from SOL.
 */

import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';

export const OTC_LOCK_DAYS = 10;

export function getOtcLotteryConfig() {
  const enabled =
    (process.env.OTC_LOTTERY_ENABLED || 'false').toLowerCase() === 'true' ||
    (process.env.NEXT_PUBLIC_OTC_LOTTERY_ENABLED || 'false').toLowerCase() === 'true';

  const treasuryWallet =
    process.env.NEXT_PUBLIC_OTC_LOTTERY_SOL_WALLET ||
    process.env.NEXT_PUBLIC_SOL_TREASURY_ADDRESS ||
    '';

  const minSol = parseFloat(process.env.OTC_LOTTERY_MIN_SOL || '2');
  const maxSol = parseFloat(process.env.OTC_LOTTERY_MAX_SOL || '500');

  const swapPlatformFeeBps = parseInt(process.env.OTC_LOTTERY_SWAP_FEE_BPS || '25', 10);
  const tokenTradeTaxBps = parseInt(process.env.OTC_LOTTERY_TOKEN_TAX_BPS || '200', 10);

  const solUsdOverride = process.env.SOL_USD_PRICE_OVERRIDE
    ? parseFloat(process.env.SOL_USD_PRICE_OVERRIDE)
    : null;

  return {
    enabled,
    treasuryWallet,
    minSol: Number.isFinite(minSol) ? minSol : 2,
    maxSol: Number.isFinite(maxSol) ? maxSol : 500,
    lockDays: OTC_LOCK_DAYS,
    swapPlatformFeeBps: Number.isFinite(swapPlatformFeeBps) ? swapPlatformFeeBps : 25,
    tokenTradeTaxBps: Number.isFinite(tokenTradeTaxBps) ? tokenTradeTaxBps : 200,
    solUsdOverride: Number.isFinite(solUsdOverride) ? solUsdOverride : null,
  };
}

export async function fetchSolUsdPrice(): Promise<number | null> {
  const override = process.env.SOL_USD_PRICE_OVERRIDE;
  if (override) {
    const n = parseFloat(override);
    if (Number.isFinite(n) && n > 0) return n;
  }
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const p = json?.solana?.usd;
    return typeof p === 'number' && p > 0 ? p : null;
  } catch {
    return null;
  }
}

export type OtcEstimateInput = {
  solAmount: number;
  solPriceUsd: number;
  aptcPriceUsd: number;
  swapPlatformFeeBps: number;
  tokenTradeTaxBps: number;
};

export type OtcEstimateResult = {
  solAmount: number;
  solUsd: number;
  grossUsd: number;
  afterSwapFeeUsd: number;
  afterTokenTaxUsd: number;
  aptcPriceUsd: number;
  estimatedAptc: number;
  breakdown: {
    swapPlatformFeeBps: number;
    tokenTradeTaxBps: number;
    swapFeeUsd: number;
    tokenTaxUsd: number;
  };
};

/** Estimate APTC received after swap platform fee + Raydium pool fee (~0.25%). */
export function estimateAptcFromSol(input: OtcEstimateInput): OtcEstimateResult {
  const { solAmount, solPriceUsd, aptcPriceUsd, swapPlatformFeeBps, tokenTradeTaxBps } = input;
  const solUsd = solAmount * solPriceUsd;
  const swapFeeUsd = solUsd * (swapPlatformFeeBps / 10_000);
  const afterSwapFeeUsd = solUsd - swapFeeUsd;
  const tokenTaxUsd = afterSwapFeeUsd * (tokenTradeTaxBps / 10_000);
  const afterTokenTaxUsd = afterSwapFeeUsd - tokenTaxUsd;
  const estimatedAptc = aptcPriceUsd > 0 ? afterTokenTaxUsd / aptcPriceUsd : 0;

  return {
    solAmount,
    solUsd,
    grossUsd: solUsd,
    afterSwapFeeUsd,
    afterTokenTaxUsd,
    aptcPriceUsd,
    estimatedAptc: Math.round(estimatedAptc * 1e6) / 1e6,
    breakdown: {
      swapPlatformFeeBps,
      tokenTradeTaxBps,
      swapFeeUsd: Math.round(swapFeeUsd * 100) / 100,
      tokenTaxUsd: Math.round(tokenTaxUsd * 100) / 100,
    },
  };
}

export async function buildLiveEstimate(solAmount: number): Promise<OtcEstimateResult | null> {
  const cfg = getOtcLotteryConfig();
  const [solPriceUsd, aptcStats] = await Promise.all([
    fetchSolUsdPrice(),
    fetchAptcDexscreenerStats(),
  ]);
  const aptcPriceUsd = aptcStats.priceUsd;
  if (!solPriceUsd || !aptcPriceUsd || solAmount <= 0) return null;

  return estimateAptcFromSol({
    solAmount,
    solPriceUsd,
    aptcPriceUsd,
    swapPlatformFeeBps: cfg.swapPlatformFeeBps,
    tokenTradeTaxBps: cfg.tokenTradeTaxBps,
  });
}

export function computeUnlockAt(solSentAt: Date): Date {
  const d = new Date(solSentAt);
  d.setUTCDate(d.getUTCDate() + OTC_LOCK_DAYS);
  return d;
}

export function normalizeSolWallet(addr: string): string {
  return String(addr).trim();
}

export function isValidSolanaAddress(addr: string): boolean {
  const s = String(addr).trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

export function isValidSolTxSignature(sig: string): boolean {
  const s = String(sig).trim();
  return /^[1-9A-HJ-NP-Za-km-z]{64,128}$/.test(s);
}

export function formatOtcEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    solSenderWallet: row.sol_sender_wallet,
    solTxSignature: row.sol_tx_signature,
    solAmount: Number(row.sol_amount),
    solSentAt: row.sol_sent_at,
    aptcReceiveWallet: row.aptc_receive_wallet,
    email: row.optional_email,
    telegram: row.optional_telegram,
    userNotes: row.user_notes,
    solPriceUsd: row.sol_price_usd != null ? Number(row.sol_price_usd) : null,
    aptcPriceUsd: row.aptc_price_usd != null ? Number(row.aptc_price_usd) : null,
    estimatedAptc: row.estimated_aptc != null ? Number(row.estimated_aptc) : null,
    unlockAt: row.unlock_at,
    status: row.status,
    reviewedAt: row.reviewed_at,
    rejectReason: row.reject_reason,
    fulfilledAt: row.fulfilled_at,
    fulfillmentTxHash: row.fulfillment_tx_hash,
    actualAptcSent: row.actual_aptc_sent != null ? Number(row.actual_aptc_sent) : null,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
  };
}
