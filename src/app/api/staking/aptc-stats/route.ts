import { NextResponse } from 'next/server';
import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';
import { fetchAptcPumpAnalytics } from '@/lib/server/pumpAnalytics';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Public APTC market stats (price, market cap, TVL/liquidity, 24h volume + change).
 * TVL is reported as the sum of:
 *   - on-chain DEX liquidity (DexScreener) and
 *   - total APTC staked across active positions (Supabase).
 * When the APTC mint env is not set, on-chain values are null and only the staking
 * TVL is reported, so the UI still renders meaningful pre-TGE data.
 */
export async function GET() {
  const [dex, stakingTotals, pump] = await Promise.all([
    fetchAptcDexscreenerStats(),
    getStakingTotals(),
    fetchAptcPumpAnalytics(),
  ]);

  const stakingTvlUsd =
    dex.priceUsd !== null ? stakingTotals.activeAptc * dex.priceUsd : null;

  const tvlUsd =
    dex.liquidityUsd !== null || stakingTvlUsd !== null
      ? (dex.liquidityUsd ?? 0) + (stakingTvlUsd ?? 0)
      : null;

  return NextResponse.json(
    {
      ...dex,
      staking: {
        activeAptc: stakingTotals.activeAptc,
        activePositions: stakingTotals.activePositions,
        stakingTvlUsd,
      },
      pump,
      tvlUsd,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
  );
}

async function getStakingTotals(): Promise<{ activeAptc: number; activePositions: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { activeAptc: 0, activePositions: 0 };

  const { data, error } = await supabase
    .from('staking_positions')
    .select('amount')
    .eq('status', 'active')
    .not('tx_hash', 'is', null);

  if (error || !data) return { activeAptc: 0, activePositions: 0 };

  const activeAptc = data.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return { activeAptc, activePositions: data.length };
}
