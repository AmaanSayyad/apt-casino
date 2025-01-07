import type { ChainId } from '@/lib/chains/registry';
import { fetchNativeUsdPrice } from '@/lib/server/depositAptcBonus';

/** Withdrawal platform fee for all deposit tiers (10%). */
export const TIER_WITHDRAW_FEE_BPS = 1000;

export type FeeTierId = 'standard' | 'preferred' | 'vip';

export type FeeTierDefinition = {
  id: FeeTierId;
  label: string;
  minUsd: number;
  maxUsd: number | null;
  depositBps: number;
  withdrawBps: number;
  depositPct: number;
  withdrawPct: number;
};

const STANDARD_DEPOSIT_BPS = 1000;

/** USD thresholds — deposit fee applies to the current deposit's USD value. */
export const FEE_TIER_DEFINITIONS: FeeTierDefinition[] = [
  {
    id: 'standard',
    label: 'Standard',
    minUsd: 0,
    maxUsd: 49.99,
    depositBps: STANDARD_DEPOSIT_BPS,
    withdrawBps: TIER_WITHDRAW_FEE_BPS,
    depositPct: 10,
    withdrawPct: 10,
  },
  {
    id: 'preferred',
    label: 'Preferred',
    minUsd: 50,
    maxUsd: 499.99,
    depositBps: 800,
    withdrawBps: TIER_WITHDRAW_FEE_BPS,
    depositPct: 8,
    withdrawPct: 10,
  },
  {
    id: 'vip',
    label: 'VIP',
    minUsd: 500,
    maxUsd: null,
    depositBps: 700,
    withdrawBps: TIER_WITHDRAW_FEE_BPS,
    depositPct: 7,
    withdrawPct: 10,
  },
];

export function getDepositTierForUsd(depositUsd: number): FeeTierDefinition {
  const usd = Number.isFinite(depositUsd) && depositUsd > 0 ? depositUsd : 0;
  if (usd >= 500) return FEE_TIER_DEFINITIONS[2];
  if (usd >= 50) return FEE_TIER_DEFINITIONS[1];
  return FEE_TIER_DEFINITIONS[0];
}

export function getDepositFeeBpsForUsd(depositUsd: number): number {
  return getDepositTierForUsd(depositUsd).depositBps;
}

export function getTierWithdrawFeeBps(): number {
  return TIER_WITHDRAW_FEE_BPS;
}

export async function quoteDepositFees(
  chain: ChainId,
  amountNative: number,
): Promise<{
  tier: FeeTierDefinition;
  depositUsd: number;
  nativeUsd: number;
  depositFeeBps: number;
  withdrawFeeBps: number;
  feeNative: number;
  netNative: number;
}> {
  const nativeUsd = await fetchNativeUsdPrice(chain);
  const depositUsd = Math.max(0, amountNative * nativeUsd);
  const tier = getDepositTierForUsd(depositUsd);
  const feeNative = (amountNative * tier.depositBps) / 10_000;
  const netNative = Math.max(0, amountNative - feeNative);
  return {
    tier,
    depositUsd,
    nativeUsd,
    depositFeeBps: tier.depositBps,
    withdrawFeeBps: tier.withdrawBps,
    feeNative,
    netNative,
  };
}

export function getFeeTiersPublicPayload() {
  return {
    tiers: FEE_TIER_DEFINITIONS.map((t) => ({
      id: t.id,
      label: t.label,
      minUsd: t.minUsd,
      maxUsd: t.maxUsd,
      depositPct: t.depositPct,
      withdrawPct: t.withdrawPct,
      depositBps: t.depositBps,
      withdrawBps: t.withdrawBps,
    })),
    note: 'Deposit fee tier is based on this deposit’s USD value. Withdrawals use a 10% platform fee.',
  };
}
