import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

type TournamentRow = {
  id: string;
  name: string;
  game: 'plinko' | 'mines' | 'roulette' | 'wheel' | 'all';
  prize_pool_apt: string | number;
  entry_fee_apt: string | number;
  max_participants: number;
  starts_at: string;
  ends_at?: string | null;
  included_games?: string[] | null;
  competition_mode?: 'volume' | 'registration';
  status: string;
};

const GAME_IMAGE: Record<string, string> = {
  plinko: '/images/games/plinko.png',
  mines: '/images/games/mines.png',
  roulette: '/images/games/roulette.png',
  wheel: '/images/games/spin_the_wheel.png',
  all: '/images/games/plinko.png',
};

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapRow(
  r: TournamentRow,
  countsByTournament: Record<string, number>,
  opts: { phase: 'live_volume' | 'upcoming' },
) {
  const mode = r.competition_mode ?? 'registration';
  const gameLabel =
    r.game === 'all' ? 'All games' : titleCase(r.game);
  return {
    id: r.id,
    name: r.name,
    game: r.game,
    gameLabel,
    prizePoolApt: Number(r.prize_pool_apt) || 0,
    entryFeeApt: Number(r.entry_fee_apt) || 0,
    maxParticipants: r.max_participants,
    participants: countsByTournament[r.id] ?? 0,
    startsAt: r.starts_at,
    endsAt: r.ends_at ?? null,
    includedGames: r.included_games ?? null,
    competitionMode: mode,
    status: r.status,
    image: GAME_IMAGE[r.game] || null,
    phase: opts.phase,
    /** Volume cups: register then play; public standings on /competition */
    requiresRegistration: mode === 'registration',
  };
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      tournaments: [],
      liveVolumeCompetitions: [],
      upcomingTournaments: [],
      supabaseConfigured: false,
    });
  }

  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  const { data: liveRows, error: liveErr } = await supabase
    .from('tournaments')
    .select(
      'id, name, game, prize_pool_apt, entry_fee_apt, max_participants, starts_at, ends_at, included_games, competition_mode, status',
    )
    .eq('competition_mode', 'volume')
    .in('status', ['live', 'open'])
    .lte('starts_at', nowIso)
    .order('starts_at', { ascending: false })
    .limit(6);

  if (liveErr) {
    return NextResponse.json(
      { tournaments: [], liveVolumeCompetitions: [], upcomingTournaments: [], error: liveErr.message },
      { status: 500 },
    );
  }

  const liveVolumeRaw = (liveRows as TournamentRow[] | null)?.filter(
    (r) => r.ends_at && new Date(r.ends_at).getTime() >= nowMs,
  ) ?? [];

  const { data: upcomingRows, error } = await supabase
    .from('tournaments')
    .select(
      'id, name, game, prize_pool_apt, entry_fee_apt, max_participants, starts_at, ends_at, included_games, competition_mode, status',
    )
    .eq('status', 'open')
    .gt('starts_at', nowIso)
    .order('starts_at', { ascending: true })
    .limit(12);

  if (error) {
    return NextResponse.json(
      { tournaments: [], liveVolumeCompetitions: [], upcomingTournaments: [], error: error.message },
      { status: 500 },
    );
  }

  const upcoming = (upcomingRows ?? []) as TournamentRow[];
  const ids = upcoming.map((r) => r.id);
  let countsByTournament: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: regs } = await supabase
      .from('tournament_registrations')
      .select('tournament_id')
      .in('tournament_id', ids);
    countsByTournament = (regs ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.tournament_id] = (acc[r.tournament_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const liveVolumeCompetitions = liveVolumeRaw.map((r) => mapRow(r, {}, { phase: 'live_volume' }));
  const upcomingTournaments = upcoming.map((r) => mapRow(r, countsByTournament, { phase: 'upcoming' }));
  const tournaments = [...liveVolumeCompetitions, ...upcomingTournaments];

  return NextResponse.json({
    tournaments,
    liveVolumeCompetitions,
    upcomingTournaments,
    supabaseConfigured: true,
  });
}
