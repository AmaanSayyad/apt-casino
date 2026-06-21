import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { id: tournamentId } = await ctx.params;

  let body: { wallet?: string; prizeTxHash?: string; prizeAmount?: number; markAllDistributed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { data: tournament, error: tErr } = await db
    .from('tournaments')
    .select('id, status, prize_pool_apt')
    .eq('id', tournamentId)
    .single();

  if (tErr || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  if (body.markAllDistributed) {
    const { error } = await db
      .from('tournaments')
      .update({ rewards_distributed_at: new Date().toISOString() })
      .eq('id', tournamentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, rewardsDistributedAt: new Date().toISOString() });
  }

  const wallet = body.wallet?.trim();
  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  const prizeTxHash = body.prizeTxHash?.trim() || null;
  const prizeAmount =
    body.prizeAmount != null && Number.isFinite(Number(body.prizeAmount))
      ? Number(body.prizeAmount)
      : null;

  const { data: reg, error: regErr } = await db
    .from('tournament_registrations')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('wallet', wallet)
    .maybeSingle();

  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 });
  if (!reg) {
    return NextResponse.json({ error: 'Wallet is not registered for this contest.' }, { status: 404 });
  }

  const { error: updErr } = await db
    .from('tournament_registrations')
    .update({
      prize_approved_at: new Date().toISOString(),
      prize_tx_hash: prizeTxHash,
      prize_amount: prizeAmount,
    })
    .eq('id', reg.id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    wallet,
    prizeTxHash,
    prizeAmount,
    prizeApprovedAt: new Date().toISOString(),
  });
}
