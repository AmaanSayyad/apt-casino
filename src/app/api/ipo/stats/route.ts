import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getIpoPhaseAt, getIpoServerConfig } from '@/lib/server/ipo/config';
import { getSolUsdPrice } from '@/lib/server/ipo/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = getIpoServerConfig();
  const db = getSupabaseAdmin();
  const phase = getIpoPhaseAt(Date.now(), cfg.startAt, cfg.endAt);

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

  if (db) {
    const { data: rows } = await db
      .from('ipo_purchases')
      .select('buyer_wallet, sol_amount, usd_value, aptc_amount, status')
      .in('status', ['fulfilled', 'pending_supply']);

    if (rows?.length) {
      const wallets = new Set<string>();
      for (const r of rows) {
        totalSol += Number(r.sol_amount);
        totalUsd += Number(r.usd_value);
        aptcCommitted += Number(r.aptc_amount);
        wallets.add(r.buyer_wallet);
        if (r.status === 'fulfilled') {
          purchaseCount += 1;
          aptcSold += Number(r.aptc_amount);
        }
        if (r.status === 'pending_supply') {
          pendingSupplyCount += 1;
          pendingSupplyAptc += Number(r.aptc_amount);
        }
      }
      uniqueBuyers = wallets.size;
    }
  }

  const pctOfCap = cfg.saleCapAptc > 0 ? (aptcCommitted / cfg.saleCapAptc) * 100 : 0;
  const pctOfRaise = cfg.raiseTargetUsd > 0 ? (totalUsd / cfg.raiseTargetUsd) * 100 : 0;
  const oversubscribed = pctOfCap > 100.0001;

  return NextResponse.json({
    phase,
    enabled: cfg.enabled,
    totalSolRaised: totalSol,
    totalUsdRaised: totalUsd,
    aptcSold,
    aptcCommitted,
    aptcCap: cfg.saleCapAptc,
    pctOfCap,
    oversubscribed,
    raiseTargetUsd: cfg.raiseTargetUsd,
    pctOfRaise,
    uniqueBuyers,
    purchaseCount,
    pendingSupplyCount,
    pendingSupplyAptc,
    oversubscriptionAllowed: cfg.oversubscriptionAllowed,
    aptcPriceUsd: cfg.aptcPriceUsd,
    solUsdPrice: solUsd,
    startAt: cfg.startAt,
    endAt: cfg.endAt,
  });
}
