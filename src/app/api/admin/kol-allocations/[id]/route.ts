import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import {
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
