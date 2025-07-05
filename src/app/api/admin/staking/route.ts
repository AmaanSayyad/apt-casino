import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const [{ data: pools }, { data: positions }, { data: ledger }] = await Promise.all([
    db.from('staking_pools').select('*'),
    db.from('staking_positions').select('*').order('created_at', { ascending: false }).limit(500),
    db.from('staking_ledger').select('*').order('created_at', { ascending: false }).limit(100),
  ]);

  const active = (positions ?? []).filter((p) => p.status === 'active');
  const claimed = (positions ?? []).filter((p) => p.status === 'claimed');

  const principalLocked = active.reduce((s, p) => s + Number(p.amount), 0);
  const estPayout = active.reduce((s, p) => s + Number(p.total_payout ?? p.amount), 0);
  const wallets = new Set(active.map((p) => p.user_address));

  const byPool: Record<string, { active: number; principal: number; wallets: Set<string> }> = {};
  for (const p of active) {
    const k = p.pool_key;
    if (!byPool[k]) byPool[k] = { active: 0, principal: 0, wallets: new Set() };
    byPool[k].active += 1;
    byPool[k].principal += Number(p.amount);
    byPool[k].wallets.add(p.user_address);
  }

  const poolStats = Object.entries(byPool).map(([poolKey, v]) => ({
    poolKey,
    activePositions: v.active,
    distinctWallets: v.wallets.size,
    principalLocked: v.principal,
  }));

  const now = Date.now();
  const msDay = 24 * 60 * 60 * 1000;
  const maturity = {
    within7d: { positions: 0, principal: 0, estPayout: 0 },
    within30d: { positions: 0, principal: 0, estPayout: 0 },
    later: { positions: 0, principal: 0, estPayout: 0 },
  };
  for (const p of active) {
    const unlockMs = new Date(p.unlock_at).getTime();
    const days = (unlockMs - now) / msDay;
    const principal = Number(p.amount);
    const payout = Number(p.total_payout ?? p.amount);
    const bucket =
      days <= 7 ? maturity.within7d : days <= 30 ? maturity.within30d : maturity.later;
    bucket.positions += 1;
    bucket.principal += principal;
    bucket.estPayout += payout;
  }

  const poolMeta = Object.fromEntries((pools ?? []).map((p) => [p.pool_key, p]));

  return NextResponse.json({
    pools: pools ?? [],
    summary: {
      activePositions: active.length,
      distinctWallets: wallets.size,
      principalLocked,
      estPayout,
      claimedPositions: claimed.length,
      cancelledPositions: (positions ?? []).filter((p) => p.status === 'cancelled').length,
    },
    poolStats,
    poolMeta,
    maturity,
    recentPositions: (positions ?? []).slice(0, 40),
    recentLedger: ledger ?? [],
  });
}
