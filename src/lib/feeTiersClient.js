/** Client-safe fee tier display (must match server feeTiers.ts). */

export const FEE_TIERS = [
  {
    id: 'standard',
    label: 'Standard',
    minUsd: 0,
    maxUsd: 49.99,
    depositPct: 10,
    withdrawPct: 10,
    rangeLabel: 'Under $50',
  },
  {
    id: 'preferred',
    label: 'Preferred',
    minUsd: 50,
    maxUsd: 499.99,
    depositPct: 8,
    withdrawPct: 10,
    rangeLabel: '$50 – $499',
  },
  {
    id: 'vip',
    label: 'VIP',
    minUsd: 500,
    maxUsd: null,
    depositPct: 7,
    withdrawPct: 10,
    rangeLabel: '$500+',
  },
];

export function getPublicWithdrawFeeBps() {
  const raw = process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS_WITHDRAW;
  const n = raw != null ? Number(raw) : 1000;
  if (!Number.isFinite(n) || n < 0 || n > 10000) return 1000;
  return Math.floor(n);
}

export function withdrawFeeFromGross(grossNative, feeBps = getPublicWithdrawFeeBps()) {
  if (!Number.isFinite(grossNative) || grossNative <= 0) return 0;
  return (grossNative * feeBps) / 10000;
}

export function withdrawNetFromGross(grossNative, feeBps = getPublicWithdrawFeeBps()) {
  if (!Number.isFinite(grossNative) || grossNative <= 0) return 0;
  return grossNative - withdrawFeeFromGross(grossNative, feeBps);
}
