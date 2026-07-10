import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  getIpoServerConfig,
  resolveIpoPurchasePricing,
} from '@/lib/server/ipo/config';
import { getSolUsdPrice } from '@/lib/server/ipo/pricing';
import { formatIpoPriceUsd } from '@/lib/config/ipo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = getIpoServerConfig();
  const db = getSupabaseAdmin();

  let solUsd: number | null = null;
  try {
    solUsd = await getSolUsdPrice();
  } catch {
    solUsd = null;
  }

  let totalSol = 0;
  let totalUsd = 0;
  let aptcSold = 0;
  let aptcCommitted = 0;
  let uniqueBuyers = 0;
  let purchaseCount = 0;
  let pendingSupplyCount = 0;
  let pendingSupplyAptc = 0;

  const byRound = new Map<
    number,
    { usd: number; aptc: number; buyers: Set<string>; count: number }
  >();
  for (const r of cfg.rounds) {
    byRound.set(r.id, { usd: 0, aptc: 0, buyers: new Set(), count: 0 });
  }

  if (db) {
    const { data: rows } = await db
      .from('ipo_purchases')
      .select('buyer_wallet, sol_amount, usd_value, aptc_amount, status, round_id, tranche')
      .in('status', ['fulfilled', 'pending_supply']);

    if (rows?.length) {
      const wallets = new Set<string>();
      for (const row of rows) {
        const sol = Number(row.sol_amount) || 0;
        const usd = Number(row.usd_value) || 0;
        const aptc = Number(row.aptc_amount) || 0;
        totalSol += sol;
        totalUsd += usd;
        aptcCommitted += aptc;
        wallets.add(row.buyer_wallet);
        if (row.status === 'fulfilled') {
          purchaseCount += 1;
          aptcSold += aptc;
        }
        if (row.status === 'pending_supply') {
          pendingSupplyCount += 1;
          pendingSupplyAptc += aptc;
        }

        const rid = Number(row.round_id);
        if (Number.isFinite(rid) && byRound.has(rid)) {
          const bucket = byRound.get(rid)!;
          bucket.usd += usd;
          bucket.aptc += aptc;
          bucket.buyers.add(row.buyer_wallet);
          bucket.count += 1;
        }
      }
      uniqueBuyers = wallets.size;
    }
  }

  const rounds = cfg.rounds.map((r) => {
    const bucket = byRound.get(r.id) || {
      usd: 0,
      aptc: 0,
      buyers: new Set<string>(),
      count: 0,
    };
    const pricing = resolveIpoPurchasePricing(r, bucket.usd);
    const pctOfSoftCap =
      r.softCapUsd > 0 ? Math.min(999, (bucket.usd / r.softCapUsd) * 100) : 0;
    const status =
      cfg.activeRound?.id === r.id
        ? 'live'
        : Date.now() < Date.parse(r.startAtIso)
          ? 'upcoming'
          : Date.now() > Date.parse(r.endAtIso)
            ? 'ended'
            : 'upcoming';

    return {
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
      status,
      committedUsd: bucket.usd,
      committedAptc: bucket.aptc,
      uniqueBuyers: bucket.buyers.size,
      purchaseCount: bucket.count,
      pctOfSoftCap,
      oversubscribed: pricing.oversubscribed,
      livePriceUsd: pricing.priceUsd,
      liveTranche: pricing.tranche,
      liveMultiple: pricing.multiple,
      priceLabel: formatIpoPriceUsd(pricing.priceUsd),
    };
  });

  const activeRoundStats = cfg.activeRound
    ? rounds.find((r) => r.id === cfg.activeRound!.id) || null
    : null;

  const pctOfRaise =
    cfg.raiseTargetUsd > 0 ? (totalUsd / cfg.raiseTargetUsd) * 100 : 0;
  const activeSoftCap = activeRoundStats?.softCapUsd ?? cfg.raisePerRoundUsd;
  const activeCommitted = activeRoundStats?.committedUsd ?? 0;
  const pctOfCap =
    activeSoftCap > 0 ? (activeCommitted / activeSoftCap) * 100 : 0;
  const oversubscribed = Boolean(activeRoundStats?.oversubscribed);

  const aptcPriceUsd =
    activeRoundStats?.livePriceUsd ??
    cfg.activeRound?.priceUsd ??
    cfg.basePriceUsd;

  const inventoryCapAptc = cfg.inventoryCapAptc;
  const remainingAptc = Math.max(0, inventoryCapAptc - aptcCommitted);
  const pctOfInventory = inventoryCapAptc > 0 ? (aptcCommitted / inventoryCapAptc) * 100 : 0;
  const soldOut = remainingAptc <= 1e-8;

  return NextResponse.json({
    phase: cfg.phase,
    enabled: cfg.enabled,
    totalSolRaised: totalSol,
    totalUsdRaised: totalUsd,
    aptcSold,
    aptcCommitted,
    aptcCap: inventoryCapAptc,
    inventoryCapAptc,
    remainingAptc,
    pctOfInventory,
    soldOut,
    pctOfCap,
    oversubscribed,
    raiseTargetUsd: cfg.raiseTargetUsd,
    raisePerRoundUsd: cfg.raisePerRoundUsd,
    pctOfRaise,
    uniqueBuyers,
    purchaseCount,
    pendingSupplyCount,
    pendingSupplyAptc,
    oversubscriptionAllowed: cfg.oversubscriptionAllowed,
    aptcPriceUsd,
    basePriceUsd: cfg.basePriceUsd,
    solUsdPrice: solUsd,
    startAt: cfg.startAt,
    endAt: cfg.endAt,
    activeRound: activeRoundStats,
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
    rounds,
    listingPriceUsd: cfg.listingPriceUsd,
    cexPriceUsd: cfg.cexPriceUsd,
  });
}
