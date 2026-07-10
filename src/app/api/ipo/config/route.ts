import { NextResponse } from 'next/server';
import {
  IPO_COPY,
  IPO_SALE,
  formatIpoCountdown,
  getIpoCountdownMs,
  getIpoPriceLadder,
  resolveIpoSaleState,
  resolveIpoPurchasePricing,
} from '@/lib/config/ipo';
import { getIpoServerConfig } from '@/lib/server/ipo/config';
import { getSolUsdPrice } from '@/lib/server/ipo/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = getIpoServerConfig();
  const now = Date.now();
  const saleState = resolveIpoSaleState(now, cfg.basePriceUsd);
  const phase = saleState.phase;

  let solUsd: number | null = null;
  try {
    solUsd = await getSolUsdPrice();
  } catch {
    solUsd = null;
  }

  const livePricing = cfg.activeRound
    ? resolveIpoPurchasePricing(cfg.activeRound, 0)
    : null;

  return NextResponse.json({
    enabled: cfg.enabled,
    phase,
    treasury: cfg.treasury,
    aptcDistributor: cfg.aptcDistributor,
    stakingVault: cfg.stakingVault,
    mint: cfg.mint,
    basePriceUsd: cfg.basePriceUsd,
    aptcPriceUsd: livePricing?.priceUsd ?? cfg.aptcPriceUsd,
    saleCapAptc: cfg.saleCapAptc,
    inventoryCapAptc: cfg.inventoryCapAptc,
    raiseTargetUsd: cfg.raiseTargetUsd,
    raisePerRoundUsd: cfg.raisePerRoundUsd,
    startAt: cfg.activeRound?.startAtIso ?? cfg.nextRound?.startAtIso ?? cfg.startAt,
    endAt: cfg.activeRound?.endAtIso ?? cfg.endAt,
    overallStartAt: cfg.startAt,
    overallEndAt: cfg.endAt,
    stakingLockDays: cfg.stakingLockDays,
    stakingApyPct: cfg.stakingApyBps / 100,
    affiliateLevels: cfg.affiliateLevels,
    affiliateWithdrawMinDays: cfg.affiliateWithdrawMinDays,
    countdownMs:
      phase === 'upcoming' || phase === 'live' || phase === 'between_rounds'
        ? getIpoCountdownMs(now)
        : 0,
    countdownLabel: formatIpoCountdown(getIpoCountdownMs(now)),
    solUsdPrice: solUsd,
    copy: IPO_COPY,
    activeRound: cfg.activeRound
      ? {
          id: cfg.activeRound.id,
          key: cfg.activeRound.key,
          label: cfg.activeRound.label,
          shortLabel: cfg.activeRound.shortLabel,
          multiple: cfg.activeRound.multiple,
          oversubMultiple: cfg.activeRound.oversubMultiple,
          priceUsd: cfg.activeRound.priceUsd,
          oversubPriceUsd: cfg.activeRound.oversubPriceUsd,
          softCapUsd: cfg.activeRound.softCapUsd,
          startAt: cfg.activeRound.startAtIso,
          endAt: cfg.activeRound.endAtIso,
          windowLabel: cfg.activeRound.windowLabel,
          blurb: cfg.activeRound.blurb,
        }
      : null,
    nextRound: cfg.nextRound
      ? {
          id: cfg.nextRound.id,
          label: cfg.nextRound.label,
          shortLabel: cfg.nextRound.shortLabel,
          startAt: cfg.nextRound.startAtIso,
          endAt: cfg.nextRound.endAtIso,
          priceUsd: cfg.nextRound.priceUsd,
          multiple: cfg.nextRound.multiple,
          windowLabel: cfg.nextRound.windowLabel,
        }
      : null,
    rounds: cfg.rounds.map((r) => ({
      id: r.id,
      key: r.key,
      label: r.label,
      shortLabel: r.shortLabel,
      multiple: r.multiple,
      oversubMultiple: r.oversubMultiple,
      priceUsd: r.priceUsd,
      oversubPriceUsd: r.oversubPriceUsd,
      softCapUsd: r.softCapUsd,
      startAt: r.startAtIso,
      endAt: r.endAtIso,
      windowLabel: r.windowLabel,
      blurb: r.blurb,
    })),
    priceLadder: getIpoPriceLadder(now),
    listingPriceUsd: cfg.listingPriceUsd,
    listingMultiple: cfg.listingMultiple,
    cexPriceUsd: cfg.cexPriceUsd,
    cexMultiple: cfg.cexMultiple,
    sale: {
      saleTokensShort: IPO_SALE.saleTokensShort,
      saleSupplyPct: IPO_SALE.saleSupplyPct,
      launchLabel: IPO_SALE.launchLabel,
      endLabel: IPO_SALE.endLabel,
      timezoneLabel: IPO_SALE.timezoneLabel,
      postIpoDex: IPO_SALE.postIpoDex,
      poweredBy: IPO_SALE.poweredBy,
      roundCount: IPO_SALE.roundCount,
      raisePerRoundUsd: IPO_SALE.raisePerRoundUsd,
    },
  });
}
