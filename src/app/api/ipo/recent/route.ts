import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const limit = Math.min(40, Math.max(1, Number(req.nextUrl.searchParams.get('limit') || 20)));

  const { data: rows, error } = await db
    .from('ipo_purchases')
    .select('id, buyer_wallet, sol_amount, usd_value, aptc_amount, sol_tx_hash, status, created_at')
    .in('status', ['fulfilled', 'pending_supply'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activity = (rows || []).map((r) => ({
    id: r.id,
    wallet: r.buyer_wallet,
    solAmount: Number(r.sol_amount),
    usdValue: Number(r.usd_value),
    aptcAmount: Number(r.aptc_amount),
    solTxHash: r.sol_tx_hash,
    status: r.status,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ activity });
}
