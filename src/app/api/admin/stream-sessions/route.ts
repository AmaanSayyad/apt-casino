import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  formatStreamAdmin,
  isMissingRewardUnlockColumn,
  type StreamRow,
} from '@/lib/server/streamSessions';
import { getPlayChainConfig } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

const SELECT =
  'id, playback_id, source, wallet, chain, title, description, is_approved, session_status, started_at, ended_at, last_heartbeat_at, duration_seconds, reward_tier_pct, thumbnail_url, x_handle, telegram_username, solana_payout_wallet, reward_status, reward_unlock_at, admin_reward_notes, reward_paid_at, created_at, updated_at';

const SELECT_LEGACY = SELECT.replace(', reward_unlock_at', '');

/** Rough house edge (USD) from game_play_events for reward estimates. */
async function platformRevenueUsdEstimate(): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { data, error } = await db.from('game_play_events').select('chain, bet_raw, payout_raw');
  if (error || !data?.length) return 0;

  let edge = 0;
  for (const row of data) {
    const cfg = getPlayChainConfig(String(row.chain));
    const units = cfg?.units ?? 1e9;
    const bet = Number(row.bet_raw) / units;
    const payout = Number(row.payout_raw) / units;
    const profit = bet - payout;
    if (profit > 0) edge += profit;
  }

  const solUsd = Number(process.env.SOL_USD_PRICE_OVERRIDE) || 150;
  return edge * solUsd;
}

export async function GET(request: NextRequest) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured', sessions: [] }, { status: 500 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const rewardStatus = url.searchParams.get('rewardStatus') || 'all';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10) || 200, 500);

  let q = supabase.from('streams').select(SELECT).order('started_at', { ascending: false }).limit(limit);

  if (status === 'live' || status === 'ended') {
    q = q.eq('session_status', status);
  }
  if (rewardStatus !== 'all') {
    q = q.eq('reward_status', rewardStatus);
  }

  let { data, error } = await q;
  if (error && isMissingRewardUnlockColumn(error.message)) {
    let qLegacy = supabase.from('streams').select(SELECT_LEGACY).order('started_at', { ascending: false }).limit(limit);
    if (status === 'live' || status === 'ended') {
      qLegacy = qLegacy.eq('session_status', status);
    }
    if (rewardStatus !== 'all') {
      qLegacy = qLegacy.eq('reward_status', rewardStatus);
    }
    ({ data, error } = await qLegacy);
  }
  if (error) {
    return NextResponse.json({ error: error.message, sessions: [] }, { status: 500 });
  }

  const platformRevenueUsd = await platformRevenueUsdEstimate();

  const sessions = (data ?? []).map((row) =>
    formatStreamAdmin(row as StreamRow, platformRevenueUsd),
  );

  const pendingRewards = sessions.filter(
    (s) => s.rewardStatus === 'pending' && s.rewardTierPct > 0,
  ).length;

  return NextResponse.json({
    sessions,
    platformRevenueUsdEstimate: platformRevenueUsd,
    pendingRewards,
    rewardTiers: [
      { minMinutes: 5, pct: 0.1, label: '5+ minutes → 0.1% of platform revenue' },
      { minMinutes: 15, pct: 0.2, label: '15+ minutes → 0.2%' },
      { minMinutes: 30, pct: 0.3, label: '30+ minutes → 0.3%' },
    ],
  });
}
