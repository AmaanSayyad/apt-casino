import {
  IPO_APTC_MINT_DEFAULT,
  IPO_SALE,
  getIpoAptcDistributor,
  getIpoSolTreasury,
} from '@/lib/config/ipo';

export function getIpoServerConfig() {
  const mint =
    process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim() || IPO_APTC_MINT_DEFAULT;
  const treasury = getIpoSolTreasury();
  const aptcDistributor = getIpoAptcDistributor();
  const aptcPriceUsd =
    Number(process.env.IPO_APTC_PRICE_USD) > 0
      ? Number(process.env.IPO_APTC_PRICE_USD)
      : IPO_SALE.tokenPriceUsd;
  const saleCapAptc =
    Number(process.env.IPO_SALE_CAP_APTC) > 0
      ? Number(process.env.IPO_SALE_CAP_APTC)
      : IPO_SALE.saleTokens;
  const raiseTargetUsd =
    Number(process.env.IPO_RAISE_TARGET_USD) > 0
      ? Number(process.env.IPO_RAISE_TARGET_USD)
      : IPO_SALE.raiseTargetUsd;

  const startAt = process.env.IPO_START_AT_ISO?.trim() || IPO_SALE.startAtIso;
  const endAt = process.env.IPO_END_AT_ISO?.trim() || IPO_SALE.endAtIso;

  const enabled =
    (process.env.IPO_ENABLED || process.env.NEXT_PUBLIC_IPO_ENABLED || 'true').toLowerCase() ===
    'true';

  return {
    enabled,
    mint,
    treasury,
    aptcDistributor,
    aptcPriceUsd,
    saleCapAptc,
    raiseTargetUsd,
    startAt,
    endAt,
    stakingLockDays: IPO_SALE.stakingLockDays,
    stakingApyBps: IPO_SALE.stakingApyBps,
    affiliateLevels: IPO_SALE.affiliateLevels,
    affiliateWithdrawMinDays: IPO_SALE.affiliateWithdrawMinDays,
    oversubscriptionAllowed: IPO_SALE.oversubscriptionAllowed,
    phase: getIpoPhaseAt(Date.now(), startAt, endAt),
  };
}

/** Phase helper that accepts optional override timestamps */
export function getIpoPhaseAt(
  now = Date.now(),
  startAt = IPO_SALE.startAtIso,
  endAt = IPO_SALE.endAtIso,
): 'upcoming' | 'live' | 'ended' | 'unknown' {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'unknown';
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}
