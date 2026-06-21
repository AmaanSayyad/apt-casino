import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { mapTournamentRow, parseTournamentCreate } from '@/lib/admin/tournaments';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

const SELECT =
  'id, name, game, prize_pool_apt, entry_fee_apt, max_participants, starts_at, ends_at, included_games, competition_mode, status, notes, rewards_distributed_at, created_at';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10) || 50, 200);

  const { data: rows, error } = await db
    .from('tournaments')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (rows ?? []).map((r) => r.id);
  let counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: regs } = await db.from('tournament_registrations').select('tournament_id').in('tournament_id', ids);
    counts = (regs ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.tournament_id] = (acc[r.tournament_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return NextResponse.json({
    tournaments: (rows ?? []).map((r) => mapTournamentRow(r, counts[r.id] ?? 0)),
  });
}

export async function POST(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseTournamentCreate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const d = parsed.data;
  const { data, error } = await db
    .from('tournaments')
    .insert({
      name: d.name,
      game: d.game,
      prize_pool_apt: d.prizePoolApt,
      entry_fee_apt: d.entryFeeApt,
      max_participants: d.maxParticipants,
      starts_at: d.startsAt,
      ends_at: d.endsAt,
      included_games: d.includedGames,
      competition_mode: d.competitionMode,
      status: d.status,
      notes: d.notes,
    })
    .select(SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    tournament: mapTournamentRow(data, 0),
    links: {
      competition: d.competitionMode === 'volume' ? '/competition' : null,
      homepage: '/',
    },
  });
}
