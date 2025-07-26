import { NextResponse } from 'next/server';
import {
  computeGgrEstimates,
  getGgrBuybackConfig,
  listBuybackSnapshots,
} from '@/lib/server/ggrBuyback';

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const config = getGgrBuybackConfig();
  const [est30, estAll, snapshots] = await Promise.all([
    computeGgrEstimates(Date.now() - 30 * DAY_MS),
    computeGgrEstimates(null),
    listBuybackSnapshots(10),
  ]);

  return NextResponse.json(
    {
      config,
      estimates: {
        totalWageredUsd30d: est30.totalWageredUsd,
        ggrUsd30d: est30.ggrUsd,
        projectedBuybackUsd30d: est30.projectedBuybackUsd,
        projectedBurnUsd30d: est30.projectedBurnUsd,
        projectedBurnAptc30d: est30.projectedBurnAptc,
        aptcPriceUsd: est30.aptcPriceUsd,
        totalWageredUsdAllTime: estAll.totalWageredUsd,
        ggrUsdAllTime: estAll.ggrUsd,
      },
      recentSnapshots: snapshots,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
  );
}
