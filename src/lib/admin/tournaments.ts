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
    prizePoolAptc: Number(row.prize_pool_apt) || 0,
    entryFeeApt: Number(row.entry_fee_apt) || 0,
    entryFeeAptc: Number(row.entry_fee_apt) || 0,
    maxParticipants: row.max_participants,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    includedGames: row.included_games,
    competitionMode: row.competition_mode,
    status: row.status,
    notes: row.notes,
    rewardsDistributedAt: row.rewards_distributed_at ?? null,
    createdAt: row.created_at,
    participants,
  };
}

export function parseTournamentUpdate(body: Record<string, unknown>): {
  ok: true;
  patch: Record<string, unknown>;
} | { ok: false; error: string } {
  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 200) return { ok: false, error: 'name is required (max 200 chars).' };
    patch.name = name;
  }

  if (body.game !== undefined) {
    const game = String(body.game).toLowerCase() as TournamentGame;
    if (!TOURNAMENT_GAMES.includes(game)) {
      return { ok: false, error: `game must be one of: ${TOURNAMENT_GAMES.join(', ')}` };
    }
    patch.game = game;
  }

  if (body.competitionMode !== undefined || body.competition_mode !== undefined) {
    const mode = String(body.competitionMode ?? body.competition_mode).toLowerCase() as TournamentMode;
    if (!TOURNAMENT_MODES.includes(mode)) {
      return { ok: false, error: 'competitionMode must be volume or registration.' };
    }
    patch.competition_mode = mode;
  }

  if (body.status !== undefined) {
    const status = String(body.status).toLowerCase() as TournamentStatus;
    if (!TOURNAMENT_STATUSES.includes(status)) {
      return { ok: false, error: `status must be one of: ${TOURNAMENT_STATUSES.join(', ')}` };
    }
    patch.status = status;
  }

  if (body.prizePoolApt !== undefined || body.prize_pool_apt !== undefined) {
    const v = Number(body.prizePoolApt ?? body.prize_pool_apt);
    if (!Number.isFinite(v) || v < 0) return { ok: false, error: 'prizePoolAptc must be non-negative.' };
    patch.prize_pool_apt = v;
  }

  if (body.entryFeeApt !== undefined || body.entry_fee_apt !== undefined) {
    const v = Number(body.entryFeeApt ?? body.entry_fee_apt);
    if (!Number.isFinite(v) || v < 0) return { ok: false, error: 'entryFeeAptc must be non-negative.' };
    patch.entry_fee_apt = v;
  }

  if (body.maxParticipants !== undefined || body.max_participants !== undefined) {
    const v = parseInt(String(body.maxParticipants ?? body.max_participants), 10);
    if (!Number.isFinite(v) || v < 1 || v > 100_000) {
      return { ok: false, error: 'maxParticipants must be between 1 and 100000.' };
    }
    patch.max_participants = v;
  }

  if (body.startsAt !== undefined || body.starts_at !== undefined) {
    const raw = body.startsAt ?? body.starts_at;
    if (typeof raw !== 'string' || Number.isNaN(Date.parse(raw))) {
      return { ok: false, error: 'startsAt must be a valid ISO datetime.' };
    }
    patch.starts_at = new Date(raw).toISOString();
  }

  if (body.endsAt !== undefined || body.ends_at !== undefined) {
    const raw = body.endsAt ?? body.ends_at;
    if (raw === null || raw === '') {
      patch.ends_at = null;
    } else if (typeof raw === 'string' && !Number.isNaN(Date.parse(raw))) {
      patch.ends_at = new Date(raw).toISOString();
    } else {
      return { ok: false, error: 'endsAt must be a valid ISO datetime or empty.' };
    }
  }

  if (body.includedGames !== undefined || body.included_games !== undefined) {
    const raw = body.includedGames ?? body.included_games;
    if (raw === null) {
      patch.included_games = null;
    } else if (Array.isArray(raw)) {
      const valid = ['plinko', 'mines', 'roulette', 'wheel'];
      const games = raw.map((g) => String(g).toLowerCase()).filter((g) => valid.includes(g));
      if (games.length === 0) return { ok: false, error: 'includedGames must list at least one valid game.' };
      patch.included_games = games;
    }
  }

  if (body.notes !== undefined) {
    patch.notes =
      typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;
  }

  if (body.rewardsDistributedAt !== undefined || body.rewards_distributed_at !== undefined) {
    const raw = body.rewardsDistributedAt ?? body.rewards_distributed_at;
    if (raw === null || raw === '') {
      patch.rewards_distributed_at = null;
    } else if (typeof raw === 'string' && !Number.isNaN(Date.parse(raw))) {
      patch.rewards_distributed_at = new Date(raw).toISOString();
    } else {
      return { ok: false, error: 'rewardsDistributedAt must be a valid ISO datetime or null.' };
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No fields to update.' };
  }

  return { ok: true, patch };
}
