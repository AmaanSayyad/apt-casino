/** Client-safe deposit fee helpers (mirrors server platformFees.ts). */

export function getPublicDepositFeeBps() {
  const raw = process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS_DEPOSIT;
  const n = raw != null ? Number(raw) : 1000;
  if (!Number.isFinite(n) || n < 0 || n > 10000) return 1000;
  return Math.floor(n);
}

export function depositFeeFromGross(grossNative, feeBps = getPublicDepositFeeBps()) {
  if (!Number.isFinite(grossNative) || grossNative <= 0) return 0;
  return (grossNative * feeBps) / 10000;
}

export function depositNetFromGross(grossNative, feeBps = getPublicDepositFeeBps()) {
  if (!Number.isFinite(grossNative) || grossNative <= 0) return 0;
  return grossNative - depositFeeFromGross(grossNative, feeBps);
}

/** Smallest gross deposit that yields at least `minNetNative` after fees (rounded up). */
export function recommendedMinDepositGross(minNetNative = 0.01, feeBps = getPublicDepositFeeBps()) {
  if (feeBps >= 10000) return minNetNative;
  const gross = minNetNative / (1 - feeBps / 10000);
  return Math.ceil(gross * 1e6) / 1e6;
}

export function formatFeePercent(feeBps = getPublicDepositFeeBps()) {
  const pct = feeBps / 100;
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(2).replace(/\.?0+$/, '');
}
