import {
  IPO_APTC_MINT_DEFAULT,
  IPO_SALE,
  getIpoAptcDistributor,
  getIpoSolTreasury,
  getIpoStakingVault,
  resolveIpoSaleState,
  resolveIpoPurchasePricing,
  getIpoRounds,
} from '@/lib/config/ipo';
import type { IpoRound, IpoSalePhase, IpoSaleState } from './types';

export type { IpoRound, IpoSalePhase, IpoSaleState };

export function getIpoBasePriceUsd() {
  return Number(process.env.IPO_APTC_PRICE_USD) > 0
    ? Number(process.env.IPO_APTC_PRICE_USD)
    : IPO_SALE.basePriceUsd;
}

export function getIpoServerConfig(now = Date.now()) {
  const mint =
    process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim() || IPO_APTC_MINT_DEFAULT;
  const treasury = getIpoSolTreasury();
  const aptcDistributor = getIpoAptcDistributor();
  const stakingVault = getIpoStakingVault();
  const basePriceUsd = getIpoBasePriceUsd();
  const saleState = resolveIpoSaleState(now, basePriceUsd) as IpoSaleState;
  const rounds = saleState.rounds as IpoRound[];
  const activeRound = saleState.activeRound as IpoRound | null;

  // Soft raise = sum of round soft caps ($25k × 3). Do not let a stale env override diverge from rounds.
  const raiseTargetUsd = IPO_SALE.raiseTargetUsd;
  const inventoryCapAptc =
    Number(process.env.IPO_SALE_CAP_APTC) > 0
      ? Number(process.env.IPO_SALE_CAP_APTC)
      : IPO_SALE.saleTokens;

  const enabled =
    (process.env.IPO_ENABLED || process.env.NEXT_PUBLIC_IPO_ENABLED || 'true').toLowerCase() ===
    'true';

  const livePricing = activeRound
    ? resolveIpoPurchasePricing(activeRound, 0)
    : { priceUsd: basePriceUsd, tranche: 'primary' as const, oversubscribed: false };

  return {
    enabled,
    mint,
    treasury,
    aptcDistributor,
    stakingVault,
    basePriceUsd,
    aptcPriceUsd: livePricing.priceUsd,
    /** @deprecated soft-cap APTC estimate — prefer inventoryCapAptc for hard ceiling */
    saleCapAptc: inventoryCapAptc,
    inventoryCapAptc,
    raiseTargetUsd,
    raisePerRoundUsd: IPO_SALE.raisePerRoundUsd,
    startAt: IPO_SALE.startAtIso,
    endAt: IPO_SALE.endAtIso,
    stakingLockDays: IPO_SALE.stakingLockDays,
    stakingApyBps: IPO_SALE.stakingApyBps,
    affiliateLevels: IPO_SALE.affiliateLevels,
    affiliateWithdrawMinDays: IPO_SALE.affiliateWithdrawMinDays,
    oversubscriptionAllowed: IPO_SALE.oversubscriptionAllowed,
    listingMultiple: IPO_SALE.listingMultiple,
    listingPriceUsd: IPO_SALE.listingPriceUsd,
    cexMultiple: IPO_SALE.cexMultiple,
    cexPriceUsd: IPO_SALE.cexPriceUsd,
    phase: saleState.phase as IpoSalePhase,
    activeRound,
    nextRound: saleState.nextRound as IpoRound | null,
    previousRound: saleState.previousRound as IpoRound | null,
    rounds,
  };
}

/** @deprecated Prefer resolveIpoSaleState — kept for callers that pass explicit start/end. */
export function getIpoPhaseAt(
  now = Date.now(),
  startAt = IPO_SALE.startAtIso,
  endAt = IPO_SALE.endAtIso,
): IpoSalePhase {
  const state = resolveIpoSaleState(now) as IpoSaleState;
  if (state.phase !== 'unknown') return state.phase;
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'unknown';
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

export { resolveIpoSaleState, resolveIpoPurchasePricing, getIpoRounds };
