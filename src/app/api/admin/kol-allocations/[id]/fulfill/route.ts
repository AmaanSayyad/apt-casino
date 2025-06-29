import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import {
  formatKolAllocationAdmin,
  fulfillKolAllocation,
} from '@/lib/server/kolAllocations';

export const dynamic = 'force-dynamic';

type FulfillBody = {
  fulfillmentTxHash?: string;
  adminNotes?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  const { id } = await context.params;
  let body: FulfillBody = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }

  try {
    const row = await fulfillKolAllocation({
      id,
      fulfillmentTxHash: body.fulfillmentTxHash,
      adminNotes: body.adminNotes,
    });
    return NextResponse.json({
      success: true,
      allocation: formatKolAllocationAdmin(row, request.nextUrl.origin),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Fulfill failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
