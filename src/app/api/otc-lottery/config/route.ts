import { NextResponse } from 'next/server';
import { buildLiveEstimate, fetchSolUsdPrice, getOtcLotteryConfig } from '@/lib/server/otcLottery';
import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cfg = getOtcLotteryConfig();
  const { searchParams } = new URL(request.url);
  const solParam = searchParams.get('sol');
  const solAmount = solParam ? parseFloat(solParam) : null;

  const [solPriceUsd, aptcStats] = await Promise.all([
    fetchSolUsdPrice(),
    fetchAptcDexscreenerStats(),
  ]);

  let estimate = null;
  if (solAmount && Number.isFinite(solAmount) && solAmount > 0) {
    estimate = await buildLiveEstimate(solAmount);
  }

  return NextResponse.json({
    ...cfg,
    prices: {
      solUsd: solPriceUsd,
      aptcUsd: aptcStats.priceUsd,
      aptcLiquidityUsd: aptcStats.liquidityUsd,
      aptcPairUrl: aptcStats.pairUrl,
      fetchedAt: aptcStats.fetchedAt,
    },
    estimate,
    feeExplanation: {
      tokenTradeTax:
        'Estimated Uniswap-style pool fee on Robinhood after Virtuals TGE. See DexScreener for the live pair.',
      swapPlatformFee:
        'Wallet-specific: Phantom 0.85% on select pairs; Solflare/Glow/Backpack/Jupiter manual often 0% platform fee — network + price impact still apply.',
    },
  });
}
