/**
 * Canonical APTC staking pool parameters (1B max supply).
 * APY is stored in basis points (3000 = 30.00%).
 */

export const APTC_MAX_SUPPLY = 1_000_000_000;

/** User-facing fixed-term pools on /stake */
export const STAKING_POOL_DEFINITIONS = [
  { pool_key: 'APTC_30D', lock_days: 30, apy_bps: 3000, min_supply_pct: 1 },
  { pool_key: 'APTC_60D', lock_days: 60, apy_bps: 6000, min_supply_pct: 2 },
  { pool_key: 'APTC_90D', lock_days: 90, apy_bps: 18000, min_supply_pct: 3 },
  { pool_key: 'APTC_180D', lock_days: 180, apy_bps: 36000, min_supply_pct: 4 },
] as const;

/** IPO auto-stake only — not shown as a selectable pool on /stake */
export const IPO_STAKING_POOL_KEY = 'IPO_30D';

export const USER_STAKING_POOL_KEYS = new Set(
  STAKING_POOL_DEFINITIONS.map((d) => d.pool_key),
);

export function isUserFacingStakingPool(poolKey: string): boolean {
  return USER_STAKING_POOL_KEYS.has(poolKey as StakingPoolKey);
}

export type StakingPoolKey = (typeof STAKING_POOL_DEFINITIONS)[number]['pool_key'];

const DEF_BY_KEY = Object.fromEntries(
  STAKING_POOL_DEFINITIONS.map((d) => [d.pool_key, d]),
) as Record<StakingPoolKey, (typeof STAKING_POOL_DEFINITIONS)[number]>;

export function minStakeFromSupplyPct(pct: number): number {
  return (APTC_MAX_SUPPLY * pct) / 100;
}

export function getPoolDefinition(poolKey: string) {
  return DEF_BY_KEY[poolKey as StakingPoolKey] ?? null;
}

export function getMinStakeForPool(poolKey: string): number | null {
  const def = getPoolDefinition(poolKey);
  if (!def) return null;
  return minStakeFromSupplyPct(def.min_supply_pct);
}

export function formatApyFromBps(apyBps: number): string {
  return `${(apyBps / 100).toFixed(2)}%`;
}

export function formatMinStakeLabel(minSupplyPct: number): string {
  return `Min ${minSupplyPct}% APTC supply`;
}

/** Merge DB row with canonical APY / min-stake rules. */
export function enrichStakingPool<T extends { pool_key: string; min_stake?: number | string }>(
  row: T,
): T & {
  min_supply_pct: number | null;
  min_stake: number;
  min_stake_label: string;
  apy_display: string | null;
} {
  const def = getPoolDefinition(row.pool_key);
  const min_supply_pct = def?.min_supply_pct ?? null;
  const min_stake =
    min_supply_pct != null ? minStakeFromSupplyPct(min_supply_pct) : Number(row.min_stake);
  const apy_bps = def?.apy_bps ?? (row as { apy_bps?: number }).apy_bps;
  return {
    ...row,
    ...(def ? { lock_days: def.lock_days, apy_bps: def.apy_bps } : {}),
    min_supply_pct,
    min_stake,
    min_stake_label:
      min_supply_pct != null
        ? formatMinStakeLabel(min_supply_pct)
        : `Min ${min_stake.toLocaleString()} APTC`,
    apy_display: apy_bps != null ? formatApyFromBps(apy_bps) : null,
  };
}
