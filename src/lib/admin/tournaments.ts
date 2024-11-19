export const TOURNAMENT_GAMES = ['plinko', 'mines', 'roulette', 'wheel', 'all'] as const;
export const TOURNAMENT_MODES = ['volume', 'registration'] as const;
export const TOURNAMENT_STATUSES = [
  'open',
  'live',
  'upcoming',
  'completed',
  'cancelled',
  'ended',
] as const;

export type TournamentGame = (typeof TOURNAMENT_GAMES)[number];
export type TournamentMode = (typeof TOURNAMENT_MODES)[number];
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export type TournamentCreateInput = {
  name: string;
  game: TournamentGame;
  prizePoolApt: number;
  entryFeeApt: number;
  maxParticipants: number;
  startsAt: string;
  endsAt: string | null;
  includedGames: string[] | null;
  competitionMode: TournamentMode;
  status: TournamentStatus;
  notes?: string | null;
};

export function parseTournamentCreate(body: Record<string, unknown>): {
  ok: true;
  data: TournamentCreateInput;
} | { ok: false; error: string } {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 200) {
    return { ok: false, error: 'name is required (max 200 chars).' };
  }

  const game = String(body.game || 'all').toLowerCase() as TournamentGame;
  if (!TOURNAMENT_GAMES.includes(game)) {
    return { ok: false, error: `game must be one of: ${TOURNAMENT_GAMES.join(', ')}` };
  }

  const competitionMode = String(body.competitionMode || body.competition_mode || 'volume').toLowerCase() as TournamentMode;
  if (!TOURNAMENT_MODES.includes(competitionMode)) {
    return { ok: false, error: 'competitionMode must be volume or registration.' };
  }

  const status = String(body.status || 'open').toLowerCase() as TournamentStatus;
  if (!TOURNAMENT_STATUSES.includes(status)) {
    return { ok: false, error: `status must be one of: ${TOURNAMENT_STATUSES.join(', ')}` };
  }

  const prizePoolApt = Number(body.prizePoolApt ?? body.prize_pool_apt ?? 0);
  const entryFeeApt = Number(body.entryFeeApt ?? body.entry_fee_apt ?? 0);
  const maxParticipants = parseInt(String(body.maxParticipants ?? body.max_participants ?? 100), 10);

  if (!Number.isFinite(prizePoolApt) || prizePoolApt < 0) {
    return { ok: false, error: 'prizePoolApt must be a non-negative number.' };
  }
  if (!Number.isFinite(entryFeeApt) || entryFeeApt < 0) {
    return { ok: false, error: 'entryFeeApt must be a non-negative number.' };
  }
  if (!Number.isFinite(maxParticipants) || maxParticipants < 1 || maxParticipants > 100_000) {
    return { ok: false, error: 'maxParticipants must be between 1 and 100000.' };
  }

  const startsAt = typeof body.startsAt === 'string' ? body.startsAt : typeof body.starts_at === 'string' ? body.starts_at : '';
  if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
    return { ok: false, error: 'startsAt must be a valid ISO datetime.' };
  }

  const endsRaw =
    body.endsAt ?? body.ends_at ?? null;
  const endsAt =
    endsRaw === null || endsRaw === ''
      ? null
      : typeof endsRaw === 'string'
        ? endsRaw
        : null;
  if (endsAt !== null && Number.isNaN(Date.parse(endsAt))) {
    return { ok: false, error: 'endsAt must be a valid ISO datetime or empty.' };
  }
  if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { ok: false, error: 'endsAt must be after startsAt.' };
  }

  let includedGames: string[] | null = null;
  const rawIncluded = body.includedGames ?? body.included_games;
  if (Array.isArray(rawIncluded) && rawIncluded.length > 0) {
    const valid = ['plinko', 'mines', 'roulette', 'wheel'];
    includedGames = rawIncluded
      .map((g) => String(g).toLowerCase())
      .filter((g) => valid.includes(g));
    if (includedGames.length === 0) {
      return { ok: false, error: 'includedGames must list at least one valid game.' };
    }
  }

  const notes =
    typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;

  return {
    ok: true,
    data: {
      name,
      game,
      prizePoolApt,
      entryFeeApt,
      maxParticipants,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      includedGames,
      competitionMode,
      status,
      notes,
    },
  };
}

export function mapTournamentRow(row: Record<string, unknown>, participants = 0) {
  return {
    id: row.id,
    name: row.name,
    game: row.game,
    prizePoolApt: Number(row.prize_pool_apt) || 0,
    entryFeeApt: Number(row.entry_fee_apt) || 0,
    maxParticipants: row.max_participants,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    includedGames: row.included_games,
    competitionMode: row.competition_mode,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    participants,
  };
}
