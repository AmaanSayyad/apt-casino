import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { bulkUpdateKolUnlockDates } from '@/lib/server/kolAllocations';

export const dynamic = 'force-dynamic';

type BulkBody = {
  newUnlockAt?: string;
  matchUnlockDate?: string;
};

export async function POST(request: NextRequest) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  let body: BulkBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.newUnlockAt?.trim()) {
    return NextResponse.json({ error: 'newUnlockAt is required' }, { status: 400 });
  }

  try {
    const result = await bulkUpdateKolUnlockDates({
      newUnlockAt: body.newUnlockAt,
      matchUnlockDate: body.matchUnlockDate,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bulk update failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
