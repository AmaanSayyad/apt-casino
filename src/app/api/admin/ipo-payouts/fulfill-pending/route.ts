import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { fulfillPendingSupplyPurchases } from '@/lib/server/ipo/fulfillment';

export const dynamic = 'force-dynamic';

/** Admin trigger: send APTC for queued oversubscribed purchases when treasury inventory is available. */
export async function POST(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const result = await fulfillPendingSupplyPurchases(db);
  return NextResponse.json({ success: true, ...result });
}
