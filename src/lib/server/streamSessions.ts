import type { SupabaseClient } from '@supabase/supabase-js';

export type StreamSessionStatus = 'live' | 'ended';
export type StreamRewardStatus = 'pending' | 'approved' | 'paid' | 'ineligible';

/** Days after a session ends before streamer reward can be paid out. */
export const STREAMER_REWARD_LOCK_DAYS = 14;

export function computeStreamerRewardUnlockAt(fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  d.setUTCDate(d.getUTCDate() + STREAMER_REWARD_LOCK_DAYS);
  return d.toISOString();
}

export function isMissingRewardUnlockColumn(message?: string | null): boolean {
  return !!message && /reward_unlock_at/.test(message);
}

/** Public list/detail columns (includes reward_unlock_at when migration applied). */
export const STREAM_SELECT_PUBLIC =
  'id, playback_id, source, wallet, chain, title, description, is_approved, session_status, started_at, ended_at, last_heartbeat_at, duration_seconds, reward_tier_pct, thumbnail_url, x_handle, telegram_username, solana_payout_wallet, reward_status, reward_unlock_at, created_at';

export const STREAM_SELECT_PUBLIC_LEGACY = STREAM_SELECT_PUBLIC.replace(
  ', reward_unlock_at',
  '',
);

export function resolveRewardUnlockAt(row: {
  reward_unlock_at?: string | null;
  ended_at?: string | null;
  reward_tier_pct?: number | string;
}): string | null {
  if (row.reward_unlock_at) return row.reward_unlock_at;
  const tier = Number(row.reward_tier_pct) || 0;
  if (tier > 0 && row.ended_at) {
    return computeStreamerRewardUnlockAt(new Date(row.ended_at));
  }
  return null;
}

export async function selectStreamsPublic(
  db: SupabaseClient,
  builder: (select: string) => ReturnType<SupabaseClient['from']>,
) {
  const full = await builder(STREAM_SELECT_PUBLIC);
  if (!full.error || !isMissingRewardUnlockColumn(full.error.message)) {
    return full;
  }
  return builder(STREAM_SELECT_PUBLIC_LEGACY);
}

export async function updateStreamRow(
  db: SupabaseClient,
  id: string,
  payload: Record<string, unknown>,
): Promise<{ data: StreamRow | null; error: { message: string } | null }> {
  let result = await db.from('streams').update(payload).eq('id', id).select('*').single();
  if (result.error && isMissingRewardUnlockColumn(result.error.message) && 'reward_unlock_at' in payload) {
    const { reward_unlock_at: _drop, ...rest } = payload;
    result = await db.from('streams').update(rest).eq('id', id).select('*').single();
  }
  if (result.error) {
    return { data: null, error: { message: result.error.message } };
  }
  return { data: result.data as StreamRow, error: null };
}

export type StreamSocialInput = {
  xHandle?: string | null;
  telegramUsername?: string | null;
  discordHandle?: string | null;
  solanaPayoutWallet?: string | null;
};

export type StreamRow = {
  id: string;
  playback_id: string;
  source: string;
  wallet: string;
  chain: string | null;
  title: string | null;
  description: string | null;
  is_approved: boolean;
  session_status: StreamSessionStatus;
  started_at: string;
  ended_at: string | null;
  last_heartbeat_at: string;
  duration_seconds: number;
  reward_tier_pct: number | string;
  thumbnail_url: string | null;
  x_handle: string | null;
  telegram_username: string | null;
  discord_handle: string | null;
  solana_payout_wallet: string | null;
  reward_status: StreamRewardStatus;
  reward_unlock_at: string | null;
  admin_reward_notes: string | null;
  reward_paid_at: string | null;
  created_at: string;
  updated_at: string;
};

const HANDLE_MAX = 64;
const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function sanitizeHandle(raw: string | null | undefined, max = HANDLE_MAX): string | null {
  if (!raw) return null;
  const t = String(raw).trim().replace(/^@/, '').slice(0, max);
  return t || null;
}

export function sanitizeSolanaAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = String(raw).trim();
  if (!SOLANA_RE.test(t)) return null;
  return t;
}

/** Reward tier as % of platform revenue (5+ → 0.1%, 15+ → 0.2%, 30+ → 0.3%). */
export function rewardTierPercent(durationSeconds: number): number {
  const mins = durationSeconds / 60;
  if (mins >= 30) return 0.3;
  if (mins >= 15) return 0.2;
  if (mins >= 5) return 0.1;
  return 0;
}

export function rewardTierLabel(pct: number): string {
  if (pct >= 0.3) return '30+ min (0.3%)';
  if (pct >= 0.2) return '15+ min (0.2%)';
  if (pct >= 0.1) return '5+ min (0.1%)';
  return 'Under 5 min (ineligible)';
}

export function computeDurationSeconds(row: {
  started_at: string;
  ended_at?: string | null;
  last_heartbeat_at?: string | null;
}): number {
  const start = new Date(row.started_at).getTime();
  const endMs = row.ended_at
    ? new Date(row.ended_at).getTime()
    : row.last_heartbeat_at
      ? new Date(row.last_heartbeat_at).getTime()
      : Date.now();
  return Math.max(0, Math.floor((endMs - start) / 1000));
}

export function formatStreamPublic(row: StreamRow) {
  const durationSeconds =
    row.duration_seconds > 0 ? row.duration_seconds : computeDurationSeconds(row);
  const tier = Number(row.reward_tier_pct) || rewardTierPercent(durationSeconds);
  return {
    id: row.id,
    playbackId: row.playback_id,
    source: row.source,
    wallet: row.wallet,
    chain: row.chain,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    sessionStatus: row.session_status,
    isLive: row.session_status === 'live',
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds,
    durationMinutes: Math.floor(durationSeconds / 60),
    rewardTierPct: tier,
    rewardTierLabel: rewardTierLabel(tier),
    xHandle: row.x_handle,
    telegramUsername: row.telegram_username,
    discordHandle: row.discord_handle,
    solanaPayoutWallet: row.solana_payout_wallet,
    rewardUnlockAt: resolveRewardUnlockAt(row),
    createdAt: row.created_at,
  };
}

export function formatStreamAdmin(row: StreamRow, platformRevenueUsd?: number) {
  const pub = formatStreamPublic(row);
  const tier = pub.rewardTierPct;
  const estimatedUsd =
    platformRevenueUsd != null && tier > 0
      ? (platformRevenueUsd * tier) / 100
      : null;
  return {
    ...pub,
    isApproved: row.is_approved,
    rewardStatus: row.reward_status,
    adminRewardNotes: row.admin_reward_notes,
    rewardPaidAt: row.reward_paid_at,
    lastHeartbeatAt: row.last_heartbeat_at,
    estimatedRewardUsd: estimatedUsd,
  };
}

/** End any other live sessions for this wallet before starting a new one. */
export async function endOtherLiveSessions(
  db: SupabaseClient,
  wallet: string,
  exceptId?: string,
): Promise<void> {
  const now = new Date().toISOString();
  let q = db.from('streams').select('id, started_at, last_heartbeat_at').eq('wallet', wallet).eq('session_status', 'live');
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q;
  if (!data?.length) return;

  const unlockAt = computeStreamerRewardUnlockAt(new Date(now));

  for (const row of data) {
    const durationSeconds = computeDurationSeconds(row);
    const tier = rewardTierPercent(durationSeconds);
    await updateStreamRow(db, row.id, {
      session_status: 'ended',
      ended_at: now,
      duration_seconds: durationSeconds,
      reward_tier_pct: tier,
      reward_status: tier > 0 ? 'pending' : 'ineligible',
      reward_unlock_at: tier > 0 ? unlockAt : null,
      updated_at: now,
    });
  }
}

export async function applyHeartbeat(
  db: SupabaseClient,
  id: string,
): Promise<StreamRow | null> {
  const { data: row, error } = await db.from('streams').select('*').eq('id', id).maybeSingle();
  if (error || !row) return null;
  if (row.session_status !== 'live') return row as StreamRow;

  const now = new Date().toISOString();
  const durationSeconds = computeDurationSeconds({ ...row, last_heartbeat_at: now });
  const tier = rewardTierPercent(durationSeconds);

  const { data: updated, error: upErr } = await db
    .from('streams')
    .update({
      last_heartbeat_at: now,
      duration_seconds: durationSeconds,
      reward_tier_pct: tier,
      updated_at: now,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (upErr) return null;
  return updated as StreamRow;
}

export async function endStreamSession(
  db: SupabaseClient,
  id: string,
): Promise<StreamRow | null> {
  const { data: row, error } = await db.from('streams').select('*').eq('id', id).maybeSingle();
  if (error || !row) return null;

  const now = new Date().toISOString();
  const durationSeconds = computeDurationSeconds({ ...row, ended_at: now });
  const tier = rewardTierPercent(durationSeconds);
  const unlockAt = tier > 0 ? computeStreamerRewardUnlockAt(new Date(now)) : null;

  const { data: updated, error: upErr } = await updateStreamRow(db, id, {
    session_status: 'ended',
    ended_at: now,
    last_heartbeat_at: now,
    duration_seconds: durationSeconds,
    reward_tier_pct: tier,
    reward_status: tier > 0 ? 'pending' : 'ineligible',
    reward_unlock_at: unlockAt,
    updated_at: now,
  });

  if (upErr) return null;
  return updated;
}
