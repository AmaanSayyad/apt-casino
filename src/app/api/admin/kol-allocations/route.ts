import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import {
  createKolAllocation,
  formatKolAllocationAdmin,
  listKolAllocations,
  KOL_DEFAULT_AMOUNT_APTC,
  KOL_DEFAULT_CLIFF_DAYS,
  KOL_DEFAULT_LOCK_DAYS,
} from '@/lib/server/kolAllocations';
import { generatePortalPassword } from '@/lib/server/kolPortalAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  try {
    const status = new URL(request.url).searchParams.get('status') || 'all';
    const rows = await listKolAllocations(status);
    const origin = request.nextUrl.origin;
    return NextResponse.json({
      allocations: rows.map((r) => formatKolAllocationAdmin(r, origin)),
      defaults: {
        amountAptc: KOL_DEFAULT_AMOUNT_APTC,
        lockDays: KOL_DEFAULT_LOCK_DAYS,
        cliffDays: KOL_DEFAULT_CLIFF_DAYS,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load allocations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type CreateBody = {
  slug?: string;
  displayName?: string;
  walletAddress?: string;
  portalPassword?: string;
  autoGeneratePassword?: boolean;
  adminNotes?: string;
  amountAptc?: number;
  lockDays?: number;
  cliffDays?: number;
  lockedAt?: string;
  xHandle?: string;
  country?: string;
  telegram?: string;
  avgPostViews?: number | string;
  promotionCondition?: string;
  broughtBy?: string;
  broughtOn?: string;
};

export async function POST(request: NextRequest) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const portalPassword =
    body.autoGeneratePassword || !body.portalPassword?.trim()
      ? generatePortalPassword(14)
      : body.portalPassword.trim();

  try {
    const row = await createKolAllocation({
      slug: body.slug || '',
      displayName: body.displayName || '',
      walletAddress: body.walletAddress || '',
      portalPassword,
      adminNotes: body.adminNotes,
      createdBy: 'dashboard',
      amountAptc: body.amountAptc,
      lockDays: body.lockDays,
      cliffDays: body.cliffDays,
      lockedAt: body.lockedAt,
      xHandle: body.xHandle,
      country: body.country,
      telegram: body.telegram,
      avgPostViews: body.avgPostViews,
      promotionCondition: body.promotionCondition,
      broughtBy: body.broughtBy,
      broughtOn: body.broughtOn,
    });

    const origin = request.nextUrl.origin;
    return NextResponse.json({
      success: true,
      allocation: formatKolAllocationAdmin(row, origin),
      portalPassword,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Create failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
