import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import {
  deleteKolAllocation,
  formatKolAllocationAdmin,
  updateKolAllocation,
} from '@/lib/server/kolAllocations';

export const dynamic = 'force-dynamic';

type PatchBody = {
  walletAddress?: string;
  displayName?: string;
  portalPassword?: string;
  adminNotes?: string;
  status?: 'locked' | 'ready' | 'fulfilled' | 'revoked';
  amountAptc?: number;
  lockDays?: number;
  cliffDays?: number;
  lockedAt?: string;
  unlockAt?: string;
  xHandle?: string;
  country?: string;
  telegram?: string;
  avgPostViews?: number | string | null;
  promotionCondition?: string;
  broughtBy?: string;
  broughtOn?: string | null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  const { id } = await context.params;
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const row = await updateKolAllocation(id, body);
    return NextResponse.json({
      success: true,
      allocation: formatKolAllocationAdmin(row, request.nextUrl.origin),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  const { id } = await context.params;

  try {
    await deleteKolAllocation(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
