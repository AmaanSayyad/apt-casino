import { APTC_LAUNCH_METRICS, bagsTokenUrl } from '@/lib/config/tokenomics';
import { APTC_SOLANA_MINT } from '@/lib/server/dexscreener';
import {
  fetchBagsClaimStats,
  fetchBagsLifetimeFeesLamports,
  fetchBagsPoolByMint,
  isBagsApiConfigured,
  lamportsToSol,
} from '@/lib/server/bagsApi';
import { fetchMeteoraCurveByMint, fetchMeteoraCurveByPoolKey } from '@/lib/server/meteoraCurve';

export type BagsPoolPhase = 'pre_launch' | 'bonding_curve' | 'graduated' | 'unknown';

export type BagsAnalyticsStats = {
  mint: string | null;
  bagsTokenUrl: string | null;
  poolPhase: BagsPoolPhase;
  isGraduated: boolean;
  graduationSolTarget: number;
  quoteReserveSol: number | null;
  curveProgressPct: number | null;
  lifetimeFeesSol: number | null;
  totalFeesClaimedSol: number | null;
  pools: {
    dbcPoolKey: string | null;
    dammV2PoolKey: string | null;
    dbcConfigKey: string | null;
  };
  bagsApiConfigured: boolean;
  source: 'live' | 'static';
  fetchedAt: string;
};

function sumClaimedLamports(
  rows: Array<{ totalClaimed: string }> | null,
): number | null {
  if (!rows?.length) return null;
  let total = 0n;
  for (const row of rows) {
    try {
      total += BigInt(row.totalClaimed || '0');
    } catch {
      /* skip malformed */
    }
  }
  return lamportsToSol(total.toString());
}

export async function fetchAptcBagsAnalytics(): Promise<BagsAnalyticsStats> {
  const mint = APTC_SOLANA_MINT || null;
  const fetchedAt = new Date().toISOString();
  const bagsApiConfigured = isBagsApiConfigured();
  const graduationSolTarget = APTC_LAUNCH_METRICS.graduationSol;

  if (!mint) {
    return {
      mint: null,
      bagsTokenUrl: bagsTokenUrl(),
      poolPhase: 'pre_launch',
      isGraduated: false,
      graduationSolTarget,
      quoteReserveSol: null,
      curveProgressPct: null,
      lifetimeFeesSol: null,
      totalFeesClaimedSol: null,
      pools: { dbcPoolKey: null, dammV2PoolKey: null, dbcConfigKey: null },
      bagsApiConfigured,
      source: 'static',
      fetchedAt,
    };
  }

  const [bagsPool, meteoraByMint, lifetimeFeesLamports, claimStats] = await Promise.all([
    bagsApiConfigured ? fetchBagsPoolByMint(mint) : Promise.resolve(null),
    fetchMeteoraCurveByMint(mint),
    bagsApiConfigured ? fetchBagsLifetimeFeesLamports(mint) : Promise.resolve(null),
    bagsApiConfigured ? fetchBagsClaimStats(mint) : Promise.resolve(null),
  ]);

  const meteora =
    meteoraByMint ??
    (bagsPool?.dbcPoolKey ? await fetchMeteoraCurveByPoolKey(bagsPool.dbcPoolKey) : null);

  const isGraduated = Boolean(
    bagsPool?.dammV2PoolKey || meteora?.isMigrated,
  );

  const poolPhase: BagsPoolPhase = isGraduated
    ? 'graduated'
    : meteora || bagsPool
      ? 'bonding_curve'
      : 'unknown';

  const graduationSolTargetLive =
    meteora?.graduationThresholdSol ?? graduationSolTarget;

  return {
    mint,
    bagsTokenUrl: bagsTokenUrl(mint),
    poolPhase,
    isGraduated,
    graduationSolTarget: graduationSolTargetLive,
    quoteReserveSol: meteora?.quoteReserveSol ?? null,
    curveProgressPct: isGraduated ? 100 : meteora?.curveProgressPct ?? null,
    lifetimeFeesSol: lamportsToSol(lifetimeFeesLamports),
    totalFeesClaimedSol: sumClaimedLamports(claimStats),
    pools: {
      dbcPoolKey: bagsPool?.dbcPoolKey ?? meteora?.dbcPoolKey ?? null,
      dammV2PoolKey: bagsPool?.dammV2PoolKey ?? null,
      dbcConfigKey: bagsPool?.dbcConfigKey ?? meteora?.dbcConfigKey ?? null,
    },
    bagsApiConfigured,
    source: meteora || bagsPool || lifetimeFeesLamports ? 'live' : 'static',
    fetchedAt,
  };
}
