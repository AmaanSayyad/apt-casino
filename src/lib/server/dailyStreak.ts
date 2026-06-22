import type { ChainId } from '@/lib/chains/registry';
import { APTC_SPL_MINT, transferTokenFromTreasury } from '@/lib/solana/backend-client';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { inferChainFromWallet, normalizeWalletForChain } from '@/lib/server/referrals';
const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const DEFAULT_REWARDS = [2, 3, 5, 8, 12, 18, 30];

export type DailyStreakDayState = 'claimed' | 'today' | 'upcoming' | 'missed';

export type DailyStreakDayPreview = {
  day: number;
  rewardAptc: number;
  state: DailyStreakDayState;
};

export type DailyStreakStatus = {
  enabled: boolean;
  currentStreak: number;
  longestStreak: number;
  canClaimToday: boolean;
  claimedToday: boolean;
  todayRewardAptc: number;
  nextStreakDay: number;
  lastCheckInDate: string | null;
  totalAptcClaimed: number;
  weekPreview: DailyStreakDayPreview[];
  maxStreakDay: number;
};

function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function previousUtcDateKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDateKey(d);
}

export function isDailyStreakEnabled(): boolean {
  const raw = process.env.DAILY_STREAK_ENABLED;
  if (raw === '0' || raw === 'false') return false;
  return true;
}

export function getDailyStreakRewards(): number[] {
  const raw = process.env.DAILY_STREAK_REWARDS_APTC?.trim();
  if (!raw) return DEFAULT_REWARDS;
  const parsed = raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parsed.length ? parsed : DEFAULT_REWARDS;
}

export function getMaxStreakDay(): number {
  return getDailyStreakRewards().length;
}

function rewardForStreakDay(streakDay: number): number {
  const rewards = getDailyStreakRewards();
  const idx = Math.min(Math.max(streakDay, 1), rewards.length) - 1;
  return rewards[idx] ?? rewards[rewards.length - 1] ?? 0;
}

function buildWeekPreview(
  currentStreak: number,
  lastDate: string | null,
  claimedToday: boolean,
): DailyStreakDayPreview[] {
  const rewards = getDailyStreakRewards();
  const continued = lastDate === previousUtcDateKey();
  const completedDays = claimedToday ? currentStreak : continued ? currentStreak : 0;
  const todayIndex = claimedToday ? completedDays : completedDays + 1;

  return rewards.map((rewardAptc, i) => {
    const day = i + 1;
    let state: DailyStreakDayState = 'upcoming';
    if (claimedToday && day <= completedDays) {
      state = 'claimed';
    } else if (!claimedToday && day < todayIndex) {
      state = 'claimed';
    } else if (!claimedToday && day === todayIndex) {
      state = 'today';
    }
    return { day, rewardAptc, state };
  });
}

export async function getDailyStreakStatus(
  walletInput: string,
  chain: ChainId,
): Promise<DailyStreakStatus | null> {
  if (!isDailyStreakEnabled()) return null;

  const db = getSupabaseAdmin();
  if (!db) return null;

  const wallet = normalizeWalletForChain(walletInput, chain);
  if (!wallet) return null;

  const today = utcDateKey();
  const maxDay = getMaxStreakDay();

  const { data, error } = await db
    .from('wallet_daily_streaks')
    .select('current_streak, longest_streak, last_check_in_date, total_aptc_claimed')
    .eq('wallet', wallet)
    .eq('chain', chain)
    .maybeSingle();

  if (error) {
    if (/wallet_daily_streaks|does not exist/i.test(error.message)) {
      return emptyStatus(today, maxDay);
    }
    console.warn('[dailyStreak] status:', error.message);
    return emptyStatus(today, maxDay);
  }

  const storedStreak = Number(data?.current_streak ?? 0);
  const longestStreak = Number(data?.longest_streak ?? 0);
  const lastDate = data?.last_check_in_date ? String(data.last_check_in_date) : null;
  const claimedToday = lastDate === today;
  const continued = lastDate === previousUtcDateKey();
  const displayStreak = claimedToday ? storedStreak : continued ? storedStreak : 0;
  const nextStreakDay = claimedToday
    ? Math.min(storedStreak, maxDay)
    : continued
      ? Math.min(storedStreak + 1, maxDay)
      : 1;
  const todayRewardAptc = claimedToday ? 0 : rewardForStreakDay(nextStreakDay);

  return {
    enabled: true,
    currentStreak: displayStreak,
    longestStreak,
    canClaimToday: !claimedToday,
    claimedToday,
    todayRewardAptc,
    nextStreakDay,
    lastCheckInDate: lastDate,
    totalAptcClaimed: Number(data?.total_aptc_claimed ?? 0),
    weekPreview: buildWeekPreview(storedStreak, lastDate, claimedToday),
    maxStreakDay: maxDay,
  };
}

function emptyStatus(_today: string, maxDay: number): DailyStreakStatus {
  return {
    enabled: true,
    currentStreak: 0,
    longestStreak: 0,
    canClaimToday: true,
    claimedToday: false,
    todayRewardAptc: rewardForStreakDay(1),
    nextStreakDay: 1,
    lastCheckInDate: null,
    totalAptcClaimed: 0,
    weekPreview: buildWeekPreview(0, null, false),
    maxStreakDay: maxDay,
  };
}

function resolveAptcPayoutWallet(
  wallet: string,
  chain: ChainId,
  _solanaPayoutWallet?: string | null,
): string | null {
  if (chain === 'solana' && SOLANA_RE.test(wallet)) return wallet;
  if (inferChainFromWallet(wallet) === 'solana' && SOLANA_RE.test(wallet)) return wallet;
  return null;
}

export async function claimDailyStreak(
  walletInput: string,
  chain: ChainId,
  solanaPayoutWallet?: string | null,
): Promise<
  | {
      ok: true;
      rewardAptc: number;
      streakDay: number;
      currentStreak: number;
      claimTxHash: string | null;
      payoutWallet: string;
    }
  | { ok: false; error: string }
> {
  if (!isDailyStreakEnabled()) {
    return { ok: false, error: 'Daily streak rewards are not enabled.' };
  }

  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: 'Database not configured' };

  const wallet = normalizeWalletForChain(walletInput, chain);
  if (!wallet) return { ok: false, error: 'Invalid wallet' };

  const payoutWallet = resolveAptcPayoutWallet(wallet, chain, solanaPayoutWallet);
  if (!payoutWallet) {
    return {
      ok: false,
      error: 'Provide a Solana wallet address to receive APTC (SPL token).',
    };
  }

  const today = utcDateKey();
  const maxDay = getMaxStreakDay();

  const { data: existing, error: readErr } = await db
    .from('wallet_daily_streaks')
    .select('current_streak, longest_streak, last_check_in_date, total_aptc_claimed')
    .eq('wallet', wallet)
    .eq('chain', chain)
    .maybeSingle();

  if (readErr && !/wallet_daily_streaks|does not exist/i.test(readErr.message)) {
    return { ok: false, error: readErr.message };
  }
  if (readErr) {
    return { ok: false, error: 'Daily streak is not available yet. Run database migrations.' };
  }

  const lastDate = existing?.last_check_in_date ? String(existing.last_check_in_date) : null;
  if (lastDate === today) {
    return { ok: false, error: 'You already claimed today’s reward. Come back tomorrow.' };
  }

  let newStreak = 1;
  if (lastDate === previousUtcDateKey()) {
    const prev = Number(existing?.current_streak ?? 0);
    newStreak = prev >= maxDay ? 1 : prev + 1;
  }

  const streakDay = newStreak;
  const rewardAptc = rewardForStreakDay(streakDay);
  if (rewardAptc <= 0) {
    return { ok: false, error: 'No reward configured for this streak day.' };
  }

  const longestStreak = Math.max(Number(existing?.longest_streak ?? 0), newStreak);
  const totalClaimed = Number(existing?.total_aptc_claimed ?? 0) + rewardAptc;
  const nowIso = new Date().toISOString();

  let claimTxHash: string | null = null;
  if (APTC_SPL_MINT) {
    try {
      claimTxHash = await transferTokenFromTreasury(payoutWallet, rewardAptc, APTC_SPL_MINT);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'APTC transfer failed';
      return { ok: false, error: msg };
    }
  } else {
    console.warn('[dailyStreak] APTC_SPL_MINT not set — recording claim without on-chain tx');
  }

  const { error: upsertErr } = await db.from('wallet_daily_streaks').upsert(
    {
      wallet,
      chain,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_check_in_date: today,
      total_aptc_claimed: totalClaimed,
      updated_at: nowIso,
    },
    { onConflict: 'wallet,chain' },
  );

  if (upsertErr) return { ok: false, error: upsertErr.message };

  const { error: logErr } = await db.from('daily_streak_claims').insert({
    wallet,
    chain,
    streak_day: streakDay,
    reward_aptc: rewardAptc,
    payout_wallet: payoutWallet,
    claim_tx_hash: claimTxHash,
  });

  if (logErr) {
    console.warn('[dailyStreak] claim log:', logErr.message);
  }

  return {
    ok: true,
    rewardAptc,
    streakDay,
    currentStreak: newStreak,
    claimTxHash,
    payoutWallet,
  };
}
