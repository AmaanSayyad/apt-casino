import { NextRequest, NextResponse } from 'next/server';
import { computePlatformStats } from '@/lib/admin/computeStats';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;
  try {
    const stats = await computePlatformStats();
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stats failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
