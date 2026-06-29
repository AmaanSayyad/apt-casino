import { APTC_LAUNCH_METRICS, pumpTokenUrl } from '@/lib/config/tokenomics';
import { getAptcMint, isAptcLaunched } from '@/lib/config/launchStatus';
import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';

export type PumpPoolPhase = 'pre_launch' | 'bonding_curve' | 'graduated' | 'unknown';

export type PumpLaunchAnalytics = {
  launched: boolean;
  mint: string | null;
  pumpTokenUrl: string | null;
  poolPhase: PumpPoolPhase;
  isGraduated: boolean;
  graduationSolTarget: number;
  curveTotalFeePct: number;
  creatorFeePct: number;
  devHoldPct: number;
  source: 'static' | 'live';
};

export async function fetchAptcPumpAnalytics(): Promise<PumpLaunchAnalytics> {
  const mint = getAptcMint();
  const launched = isAptcLaunched();
  const graduationSolTarget = APTC_LAUNCH_METRICS.graduationSol;

  if (!launched || !mint) {
    return {
      launched: false,
      mint: null,
      pumpTokenUrl: pumpTokenUrl(),
      poolPhase: 'pre_launch',
      isGraduated: false,
      graduationSolTarget,
      curveTotalFeePct: APTC_LAUNCH_METRICS.tradeFeePreMigrationPct,
      creatorFeePct: APTC_LAUNCH_METRICS.curveCreatorFeePct,
      devHoldPct: APTC_LAUNCH_METRICS.devHoldPct,
      source: 'static',
    };
  }

  const dex = await fetchAptcDexscreenerStats();
  const hasDexLiquidity = (dex.liquidityUsd ?? 0) > 0;
  const isGraduated = hasDexLiquidity || dex.pairAddress != null;

  return {
    launched: true,
    mint,
    pumpTokenUrl: pumpTokenUrl(mint),
    poolPhase: isGraduated ? 'graduated' : 'bonding_curve',
    isGraduated,
    graduationSolTarget,
    curveTotalFeePct: APTC_LAUNCH_METRICS.tradeFeePreMigrationPct,
    creatorFeePct: APTC_LAUNCH_METRICS.curveCreatorFeePct,
    devHoldPct: APTC_LAUNCH_METRICS.devHoldPct,
    source: dex.priceUsd != null ? 'live' : 'static',
  };
}
