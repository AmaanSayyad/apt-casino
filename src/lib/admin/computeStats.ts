/**
 * Platform stats for /api/admin/stats and public parity.
 * House P&L = Σ(bet − payout) per chain from game_play_events.
 */

import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getPlayChainConfig, PLAY_CHAINS } from '@/lib/chains/registry';
import { grossPayoutNative } from '@/lib/server/play/grossPayout';

const PAGE = 1000;

export type NetworkPnLRow = {
  volume: number;
  payout: number;
  platformPnL: number;
  currency: string;
  bets: number;
};

export type ModeStats = {
  totalBets: number;
  totalVolume: number;
  totalPayout: number;
  platformPnL: number;
  platformPnLByNetwork: Record<string, NetworkPnLRow>;
  totalUsers: number;
  totalReferrals: number;
  totalDeposits: number;
  totalWithdrawals: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  averageSessionSeconds: number;
  sessionSampleCount: number;
};

const SESSION_IDLE_TAIL_MS = 90_000;
const SESSION_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_MAX_SECONDS = 4 * 60 * 60;

export type CurrencyStat = {
  totalBalance: number;
  userCount: number;
};

export type TreasuryFlowRow = {
  currency: string;
  depositsGross: number;
  withdrawalsGross: number;
  netFlow: number;
  depositCount: number;
  withdrawalCount: number;
};

export type PlatformStats = {
  real: ModeStats;
  currencyStats: Record<string, CurrencyStat>;
  treasuryByChain: Record<string, TreasuryFlowRow>;
  ggrEstimateUsd30d: number | null;
  totalWageredUsd30d: number | null;
};

function rawToNative(chain: string, raw: string | number): number {
  const cfg = getPlayChainConfig(chain);
  const units = cfg?.units ?? 1e9;
  return Number(raw) / units;
}

async function fetchAllPlayEvents() {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const rows: {
    chain: string;
    game: string;
    wallet: string;
    bet_raw: string;
    payout_raw: string;
    currency: string;
    result: string | null;
  }[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from('game_play_events')
      .select('chain, game, wallet, bet_raw, payout_raw, currency, result')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`game_play_events: ${error.message}`);
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

async function fetchAllSessions() {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const rows: {
    wallet_address: string;
    started_at: string;
    last_ping_at: string;
    ended_at: string | null;
  }[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from('user_sessions')
      .select('wallet_address, started_at, last_ping_at, ended_at')
      .order('started_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      if (error.message?.includes('user_sessions')) return [];
      throw new Error(`user_sessions: ${error.message}`);
    }
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

function sessionDurationSeconds(
  row: { started_at: string; last_ping_at: string; ended_at: string | null },
  nowMs: number,
): number {
  const end = row.ended_at
    ? new Date(row.ended_at).getTime()
    : Math.min(new Date(row.last_ping_at).getTime() + SESSION_IDLE_TAIL_MS, nowMs);
  return Math.max(0, Math.floor((end - new Date(row.started_at).getTime()) / 1000));
}

function aggregateSessionDwell(sessions: Awaited<ReturnType<typeof fetchAllSessions>>) {
  const nowMs = Date.now();
  const lookbackCutoffMs = nowMs - SESSION_LOOKBACK_MS;
  let sum = 0;
  let count = 0;
  for (const s of sessions) {
    const startedAtMs = new Date(s.started_at).getTime();
    if (!Number.isFinite(startedAtMs) || startedAtMs < lookbackCutoffMs) continue;
    const secRaw = sessionDurationSeconds(s, nowMs);
    if (secRaw <= 0) continue;
    sum += Math.min(secRaw, SESSION_MAX_SECONDS);
    count += 1;
  }
  return {
    averageSessionSeconds: count > 0 ? sum / count : 0,
    sessionSampleCount: count,
  };
}

function aggregateEvents(rows: ReturnType<typeof fetchAllPlayEvents> extends Promise<infer T> ? T : never) {
  const byNet: Record<string, NetworkPnLRow> = {};
  const wallets = new Set<string>();
  let wins = 0;
  let losses = 0;
  let pushes = 0;

  for (const r of rows) {
    const chain = String(r.chain || 'unknown');
    const sym = String(r.currency || getPlayChainConfig(chain)?.dbCurrency || chain.toUpperCase());
    if (!byNet[chain]) {
      byNet[chain] = { volume: 0, payout: 0, platformPnL: 0, currency: sym, bets: 0 };
    }
    const bet = rawToNative(chain, r.bet_raw);
    const payoutLogged = rawToNative(chain, r.payout_raw);
    const payout = grossPayoutNative(bet, payoutLogged, r.game);
    byNet[chain].volume += bet;
    byNet[chain].payout += payout;
    byNet[chain].platformPnL += bet - payout;
    byNet[chain].bets += 1;
    wallets.add(String(r.wallet));
    if (payout > bet) wins += 1;
    else if (payout < bet) losses += 1;
    else pushes += 1;
  }

  let totalVolume = 0;
  let totalPayout = 0;
  for (const row of Object.values(byNet)) {
    totalVolume += row.volume;
    totalPayout += row.payout;
  }

  const settled = wins + losses;
  return {
    totalBets: rows.length,
    totalVolume,
    totalPayout,
    platformPnL: totalVolume - totalPayout,
    platformPnLByNetwork: byNet,
    totalUsers: wallets.size,
    wins,
    losses,
    pushes,
    winRate: settled > 0 ? (wins / settled) * 100 : 0,
  };
}

async function aggregateTreasuryFlows(): Promise<Record<string, TreasuryFlowRow>> {
  const db = getSupabaseAdmin();
  if (!db) return {};

  const WITHDRAWAL_OUT_STATUSES = new Set(['completed', 'auto', 'sent', 'approved']);

  const [{ data: deposits }, { data: withdrawals }] = await Promise.all([
    db.from('deposits_log').select('chain, amount_native'),
    db.from('withdrawal_requests').select('chain, gross_apt, status'),
  ]);

  const byChain: Record<string, TreasuryFlowRow> = {};

  for (const d of deposits ?? []) {
    const chain = String(d.chain || 'unknown');
    const sym = getPlayChainConfig(chain)?.nativeSymbol ?? chain.toUpperCase();
    if (!byChain[chain]) {
      byChain[chain] = {
        currency: sym,
        depositsGross: 0,
        withdrawalsGross: 0,
        netFlow: 0,
        depositCount: 0,
        withdrawalCount: 0,
      };
    }
    byChain[chain].depositsGross += Number(d.amount_native) || 0;
    byChain[chain].depositCount += 1;
  }

  for (const w of withdrawals ?? []) {
    if (!WITHDRAWAL_OUT_STATUSES.has(String(w.status || ''))) continue;
    const chain = String(w.chain || 'unknown');
    const sym = getPlayChainConfig(chain)?.nativeSymbol ?? chain.toUpperCase();
    if (!byChain[chain]) {
      byChain[chain] = {
        currency: sym,
        depositsGross: 0,
        withdrawalsGross: 0,
        netFlow: 0,
        depositCount: 0,
        withdrawalCount: 0,
      };
    }
    byChain[chain].withdrawalsGross += Number(w.gross_apt) || 0;
    byChain[chain].withdrawalCount += 1;
  }

  for (const row of Object.values(byChain)) {
    row.netFlow = row.depositsGross - row.withdrawalsGross;
  }

  return byChain;
}

export async function computePlatformStats(): Promise<PlatformStats> {
  const db = getSupabaseAdmin();
  const emptyMode: ModeStats = {
    totalBets: 0,
    totalVolume: 0,
    totalPayout: 0,
    platformPnL: 0,
    platformPnLByNetwork: {},
    totalUsers: 0,
    totalReferrals: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    winRate: 0,
    averageSessionSeconds: 0,
    sessionSampleCount: 0,
  };

  if (!db) {
    return {
      real: emptyMode,
      currencyStats: {},
      treasuryByChain: {},
      ggrEstimateUsd30d: null,
      totalWageredUsd30d: null,
    };
  }

  const [events, sessions, treasuryByChain] = await Promise.all([
    fetchAllPlayEvents(),
    fetchAllSessions(),
    aggregateTreasuryFlows(),
  ]);
  const agg = aggregateEvents(events);
  const sessionAgg = aggregateSessionDwell(sessions);

  const walletSet = new Set<string>();
  for (const w of events.map((e) => e.wallet)) walletSet.add(w);

  const [
    { count: depositCount },
    { count: withdrawCount },
    { data: tracked },
    { count: refCount },
    { data: balances },
    { data: bannedRows },
  ] = await Promise.all([
      db.from('deposits_log').select('*', { count: 'exact', head: true }),
      db.from('withdrawal_requests').select('*', { count: 'exact', head: true }),
      db.from('tracked_wallets').select('wallet'),
      db.from('referrals').select('*', { count: 'exact', head: true }).eq('is_valid', true),
      db.from('user_house_balances').select('user_address, chain, currency, balance_raw'),
      db.from('banned_wallets').select('wallet_address'),
    ]);

  for (const t of tracked ?? []) walletSet.add(String(t.wallet));
  for (const b of balances ?? []) walletSet.add(String(b.user_address));
  for (const b of bannedRows ?? []) walletSet.add(String(b.wallet_address));

  const currencyStats: Record<string, CurrencyStat> = {};
  for (const b of balances ?? []) {
    const key = `${b.chain}:${b.currency}`;
    const native = rawToNative(String(b.chain), b.balance_raw);
    if (!currencyStats[key]) currencyStats[key] = { totalBalance: 0, userCount: 0 };
    currencyStats[key].totalBalance += native;
    currencyStats[key].userCount += 1;
  }

  let ggrEstimateUsd30d: number | null = null;
  let totalWageredUsd30d: number | null = null;
  try {
    const { computeGgrEstimates } = await import('@/lib/server/ggrBuyback');
    const est = await computeGgrEstimates(Date.now() - 30 * 24 * 60 * 60 * 1000);
    ggrEstimateUsd30d = est.ggrUsd;
    totalWageredUsd30d = est.totalWageredUsd;
  } catch {
    /* optional */
  }

  const real: ModeStats = {
    ...agg,
    totalUsers: walletSet.size,
    totalReferrals: refCount ?? 0,
    totalDeposits: depositCount ?? 0,
    totalWithdrawals: withdrawCount ?? 0,
    averageSessionSeconds: sessionAgg.averageSessionSeconds,
    sessionSampleCount: sessionAgg.sessionSampleCount,
  };

  return { real, currencyStats, treasuryByChain, ggrEstimateUsd30d, totalWageredUsd30d };
}

export function getLiveChainLabels(): string[] {
  return PLAY_CHAINS.filter((c) => c.status === 'live').map((c) => c.label);
}
