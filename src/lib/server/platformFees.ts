import { getDepositFeeBpsForUsd, getTierWithdrawFeeBps } from '@/lib/server/feeTiers';

/** Basis points: 10000 = 100%. Default 10% = 1000 bps (standard tier, deposits under $50 USD). */

export function getDepositFeeBps(): number {
  const raw = process.env.PLATFORM_FEE_BPS_DEPOSIT ?? process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS_DEPOSIT;
  const n = raw != null ? Number(raw) : 1000;
  if (!Number.isFinite(n) || n < 0 || n > 10000) return 1000;
  return Math.floor(n);
}

/** Tiered deposit fee from USD value of this deposit (50–499 → 8%, 500+ → 7%). */
export { getDepositFeeBpsForUsd } from '@/lib/server/feeTiers';

export function getWithdrawFeeBps(): number {
  const tiered = getTierWithdrawFeeBps();
  const raw = process.env.PLATFORM_FEE_BPS_WITHDRAW ?? process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS_WITHDRAW;
  const n = raw != null ? Number(raw) : tiered;
  if (!Number.isFinite(n) || n < 0 || n > 10000) return tiered;
  return Math.floor(n);
}

export function feeFromGrossOctas(grossOctas: number, feeBps: number): number {
  return Math.floor((grossOctas * feeBps) / 10000);
}

export function getManualWithdrawUsdThreshold(): number {
  const raw = process.env.MANUAL_WITHDRAW_USD_THRESHOLD ?? '50';
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 50;
  return n;
}

/**
 * Slice of the *gross deposit* (basis points) routed to the referrer on the
 * referee's first deposit.
 * Default 2000 bps = 20% of deposit value (paid in APTC).
 */
export function getReferrerFeeShareBpsOfDeposit(_depositFeeBps?: number): number {
  const raw =
    process.env.REFERRER_FEE_SHARE_BPS_OF_DEPOSIT ??
    process.env.NEXT_PUBLIC_REFERRER_FEE_SHARE_BPS_OF_DEPOSIT;
  const n = raw != null ? Number(raw) : 2000;
  if (!Number.isFinite(n) || n < 0 || n > 10000) return 2000;
  return Math.floor(n);
}
