import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { TOURNAMENT_STATUSES, mapTournamentRow } from '@/lib/admin/tournaments';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

const SELECT =
  'id, name, game, prize_pool_apt, entry_fee_apt, max_participants, starts_at, ends_at, included_games, competition_mode, status, notes, created_at';

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing tournament id' }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const status = String(body.status).toLowerCase();
    if (!TOURNAMENT_STATUSES.includes(status as (typeof TOURNAMENT_STATUSES)[number])) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = status;
  }

  if (body.endsAt !== undefined || body.ends_at !== undefined) {
    const raw = body.endsAt ?? body.ends_at;
    if (raw === null || raw === '') {
      patch.ends_at = null;
    } else if (typeof raw === 'string' && !Number.isNaN(Date.parse(raw))) {
      patch.ends_at = new Date(raw).toISOString();
    } else {
      return NextResponse.json({ error: 'Invalid endsAt' }, { status: 400 });
    }
  }

  if (body.notes !== undefined) {
    patch.notes =
      typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update (status, endsAt, notes)' }, { status: 400 });
  }

  const { data, error } = await db.from('tournaments').update(patch).eq('id', id).select(SELECT).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  const { count } = await db
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id);

  return NextResponse.json({
    success: true,
    tournament: mapTournamentRow(data, count ?? 0),
  });
}
