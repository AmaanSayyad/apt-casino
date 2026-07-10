import { NextResponse } from 'next/server';
import {
  IPO_COPY,
  IPO_SALE,
  formatIpoCountdown,
  getIpoCountdownMs,
} from '@/lib/config/ipo';
import { getIpoPhaseAt, getIpoServerConfig } from '@/lib/server/ipo/config';
import { getSolUsdPrice } from '@/lib/server/ipo/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = getIpoServerConfig();
  const now = Date.now();
  const phase = getIpoPhaseAt(now, cfg.startAt, cfg.endAt);

  let solUsd: number | null = null;
  try {
    solUsd = await getSolUsdPrice();
  } catch {
    solUsd = null;
  }

  return NextResponse.json({
    enabled: cfg.enabled,
    phase,
    treasury: cfg.treasury,
    aptcDistributor: cfg.aptcDistributor,
    mint: cfg.mint,
    aptcPriceUsd: cfg.aptcPriceUsd,
    saleCapAptc: cfg.saleCapAptc,
    raiseTargetUsd: cfg.raiseTargetUsd,
    startAt: cfg.startAt,
    endAt: cfg.endAt,
    stakingLockDays: cfg.stakingLockDays,
    stakingApyPct: cfg.stakingApyBps / 100,
    affiliateLevels: cfg.affiliateLevels,
    affiliateWithdrawMinDays: cfg.affiliateWithdrawMinDays,
    countdownMs: phase === 'upcoming' || phase === 'live' ? getIpoCountdownMs(now) : 0,
    countdownLabel: formatIpoCountdown(getIpoCountdownMs(now)),
    solUsdPrice: solUsd,
    copy: IPO_COPY,
    sale: {
      saleTokensShort: IPO_SALE.saleTokensShort,
      saleSupplyPct: IPO_SALE.saleSupplyPct,
      launchLabel: IPO_SALE.launchLabel,
      endLabel: IPO_SALE.endLabel,
      timezoneLabel: IPO_SALE.timezoneLabel,
      postIpoDex: IPO_SALE.postIpoDex,
      poweredBy: IPO_SALE.poweredBy,
    },
  });
}
