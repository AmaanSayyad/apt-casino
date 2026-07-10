import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit') || 10)));

  const { data: rows, error } = await db
    .from('ipo_purchases')
    .select('buyer_wallet, sol_amount, usd_value, aptc_amount, created_at')
    .eq('status', 'fulfilled')
    .order('usd_value', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const agg = new Map<
    string,
    { wallet: string; totalSol: number; totalUsd: number; totalAptc: number; purchases: number; lastAt: string }
  >();

  for (const r of rows || []) {
    const w = r.buyer_wallet;
    const cur = agg.get(w) || {
      wallet: w,
      totalSol: 0,
      totalUsd: 0,
      totalAptc: 0,
      purchases: 0,
      lastAt: r.created_at,
    };
    cur.totalSol += Number(r.sol_amount);
    cur.totalUsd += Number(r.usd_value);
    cur.totalAptc += Number(r.aptc_amount);
    cur.purchases += 1;
    if (r.created_at > cur.lastAt) cur.lastAt = r.created_at;
    agg.set(w, cur);
  }

  const leaderboard = [...agg.values()]
    .sort((a, b) => b.totalUsd - a.totalUsd)
    .slice(0, limit)
    .map((e, i) => ({ rank: i + 1, ...e }));

  return NextResponse.json({ leaderboard });
}
