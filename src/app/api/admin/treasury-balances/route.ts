import { NextRequest, NextResponse } from 'next/server';
import { buildTreasuryBalanceSnapshot } from '@/lib/admin/treasuryBalances';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;
  try {
    const snapshot = await buildTreasuryBalanceSnapshot();
    return NextResponse.json(snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Treasury snapshot failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
