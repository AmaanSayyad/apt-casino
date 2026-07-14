import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { ChainId, getPlayChainConfig } from '@/lib/chains/registry';
import { nativeToRaw } from '@/lib/server/play/amounts';
import {
  inferChainFromWallet,
  normalizeWallet,
  normalizeWalletForChain,
} from '@/lib/server/referrals';
import { accrueCashbackOnBet } from '@/lib/server/cashback';
import { isDemoPlayWallet } from '@/lib/play/demoPlay';

export type GamePlayEventInput = {
  chain: ChainId;
  game: string;
  wallet: string;
  betNative: number;
  payoutNative: number;
  result?: string;
  fairnessProof?: Record<string, unknown> | null;
  proofReference?: string | null;
  /** When false, skips cashback accrual (client-authored logs). */
  trusted?: boolean;
};

export async function recordGamePlayEvent(input: GamePlayEventInput): Promise<void> {
  if (isDemoPlayWallet(input.wallet)) return;
  if (!Number.isFinite(input.betNative) || input.betNative < 0) return;
  if (!Number.isFinite(input.payoutNative) || input.payoutNative < 0) return;

  const db = getSupabaseAdmin();
  if (!db) return;

  const cfg = getPlayChainConfig(input.chain);
  if (!cfg) return;

  const betRaw = nativeToRaw(input.chain, input.betNative);
  const payoutRaw = nativeToRaw(input.chain, input.payoutNative);

  await db.from('game_play_events').insert({
    chain: input.chain,
    game: input.game,
    wallet: normalizeWalletForChain(input.wallet, input.chain) ?? input.wallet,
    bet_raw: betRaw.toString(),
    payout_raw: payoutRaw.toString(),
    currency: cfg.dbCurrency,
    result: input.result ?? null,
    fairness_proof: input.fairnessProof ?? null,
    proof_reference: input.proofReference ?? null,
  });

  if (input.chain === 'solana' && betRaw > 0n && input.trusted !== false) {
    const wallet = normalizeWalletForChain(input.wallet, input.chain) ?? input.wallet;
    await accrueCashbackOnBet({
      wallet,
      chain: input.chain,
      game: input.game,
      betRaw,
    }).catch((e) => console.warn('[cashback] accrue', e));
  }
}

export type ChainVolume = { chain: ChainId; native: number; symbol: string };

const LIVE_GAME_SLUGS = ['plinko', 'mines', 'roulette', 'wheel'] as const;

export type GameActivitySnapshot = Record<
  string,
  { totalBets: number; playersOnline: number }
>;

/** Per-game bet totals and recent active wallets from Supabase (non-Aptos chains). */
export async function aggregateGameActivityFromPlayEvents(opts?: {
  onlineSinceMs?: number;
}): Promise<GameActivitySnapshot> {
  const db = getSupabaseAdmin();
  const activity: GameActivitySnapshot = {};
  for (const slug of LIVE_GAME_SLUGS) {
    activity[slug] = { totalBets: 0, playersOnline: 0 };
  }
  if (!db) return activity;

  await Promise.all(
    LIVE_GAME_SLUGS.map(async (slug) => {
      const { count, error } = await db
        .from('game_play_events')
        .select('*', { count: 'exact', head: true })
        .eq('game', slug)
        .neq('chain', 'aptos');
      if (!error) activity[slug].totalBets = count ?? 0;
    }),
  );

  const onlineCutoff = opts?.onlineSinceMs ?? Date.now() - 60 * 60 * 1000;
  const { data, error } = await db
    .from('game_play_events')
    .select('game, wallet')
    .neq('chain', 'aptos')
    .gte('created_at', new Date(onlineCutoff).toISOString())
    .limit(5000);

  if (error || !data?.length) return activity;

  const onlineByGame = new Map<string, Set<string>>();
  for (const row of data) {
    const game = String(row.game || '').toLowerCase();
    if (!LIVE_GAME_SLUGS.includes(game as (typeof LIVE_GAME_SLUGS)[number])) continue;

    const wallet = String(row.wallet || '').trim();
    if (!wallet) continue;

    let set = onlineByGame.get(game);
    if (!set) {
      set = new Set<string>();
      onlineByGame.set(game, set);
    }
    set.add(wallet);
  }

  for (const [game, wallets] of onlineByGame) {
    if (activity[game]) activity[game].playersOnline = wallets.size;
  }

  return activity;
}

const ALL_TIME_AGGREGATE_TTL_MS = 5 * 60_000;
/** Page size for PostgREST — many Supabase projects cap responses at 1000 even if limit is higher. */
const AGGREGATE_PAGE_SIZE = 1000;
const MAX_AGGREGATE_PAGES = 200;

type PlayEventsAggregate = {
  totalBets: number;
  totalBetsByChain: Record<string, number>;
  totalWageredByChain: Record<string, number>;
  maxWinByChain: Record<string, number>;
  playerWins: number;
  playerWinsByChain: Record<string, number>;
  activePlayers: number;
  uniqueWallets: number;
};

let allTimeAggregateCache: { at: number; data: PlayEventsAggregate } | null = null;
let allTimeAggregateInflight: Promise<PlayEventsAggregate> | null = null;

async function aggregatePlayEventsSinceUncached(sinceMs: number | null): Promise<PlayEventsAggregate> {
  const db = getSupabaseAdmin();
  const empty = {
    totalBets: 0,
    totalBetsByChain: {} as Record<string, number>,
    totalWageredByChain: {} as Record<string, number>,
    maxWinByChain: {} as Record<string, number>,
    playerWins: 0,
    playerWinsByChain: {} as Record<string, number>,
    activePlayers: 0,
    uniqueWallets: 0,
  };
  if (!db) return empty;

  const totalWageredByChain: Record<string, number> = {};
  const totalBetsByChain: Record<string, number> = {};
  const maxWinByChain: Record<string, number> = {};
  const playerWinsByChain: Record<string, number> = {};
  const wallets = new Set<string>();
  let playerWins = 0;
  let scanned = 0;

  for (let page = 0; page < MAX_AGGREGATE_PAGES; page += 1) {
    const from = page * AGGREGATE_PAGE_SIZE;
    const to = from + AGGREGATE_PAGE_SIZE - 1;
    let q = db
      .from('game_play_events')
      .select('chain, bet_raw, payout_raw, currency, created_at, wallet')
      .order('created_at', { ascending: true })
      .range(from, to);
    if (sinceMs) {
      q = q.gte('created_at', new Date(sinceMs).toISOString());
    }
    const { data, error } = await q;
    if (error) {
      console.warn('[gamePlayEvents] aggregate page failed', error.message);
      break;
    }
    if (!data?.length) break;

    for (const row of data) {
      const chain = String(row.chain);
      const cfg = getPlayChainConfig(chain);
      const units = cfg?.units ?? 1e9;
      const bet = Number(row.bet_raw) / units;
      const payout = Number(row.payout_raw) / units;
      totalWageredByChain[chain] = (totalWageredByChain[chain] ?? 0) + bet;
      totalBetsByChain[chain] = (totalBetsByChain[chain] ?? 0) + 1;
      const profit = payout - bet;
      if (profit > 0) {
        playerWins += 1;
        playerWinsByChain[chain] = (playerWinsByChain[chain] ?? 0) + 1;
      }
      const prevMax = maxWinByChain[chain] ?? 0;
      if (payout > prevMax) maxWinByChain[chain] = payout;

      const wallet = String(row.wallet || '').trim();
      if (wallet) wallets.add(`${chain}:${wallet}`);
    }

    scanned += data.length;
    if (data.length < AGGREGATE_PAGE_SIZE) break;
  }

  return {
    // Prefer scanned sum so headline totals always match by-chain panels.
    totalBets: scanned,
    totalBetsByChain,
    totalWageredByChain,
    maxWinByChain,
    playerWins,
    playerWinsByChain,
    activePlayers: wallets.size,
    uniqueWallets: wallets.size,
  };
}

export async function aggregatePlayEventsSince(sinceMs: number | null): Promise<PlayEventsAggregate> {
  if (sinceMs != null) return aggregatePlayEventsSinceUncached(sinceMs);

  const now = Date.now();
  if (allTimeAggregateCache && now - allTimeAggregateCache.at < ALL_TIME_AGGREGATE_TTL_MS) {
    return allTimeAggregateCache.data;
  }
  if (allTimeAggregateInflight) return allTimeAggregateInflight;

  allTimeAggregateInflight = aggregatePlayEventsSinceUncached(null)
    .then((data) => {
      allTimeAggregateCache = { at: Date.now(), data };
      allTimeAggregateInflight = null;
      return data;
    })
    .catch((e) => {
      allTimeAggregateInflight = null;
      throw e;
    });

  return allTimeAggregateInflight;
}

const GAME_DISPLAY: Record<string, string> = {
  plinko: 'Plinko',
  mines: 'Mines',
  roulette: 'Roulette',
  wheel: 'Wheel',
};

function shortenWallet(addr: string, chain: string): string {
  const trimmed = addr.trim();
  if (!trimmed) return 'Player';
  if (chain === 'solana') {
    if (trimmed.length <= 12) return trimmed;
    return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
  }
  const norm = normalizeWalletForChain(trimmed, chain as ChainId) ?? trimmed;
  if (norm.length <= 12) return norm;
  return `${norm.slice(0, 6)}…${norm.slice(-4)}`;
}

function timeAgoFromMs(agoMs: number): string {
  const sec = Math.max(0, Math.floor(agoMs / 1000));
  if (sec < 60) return `${Math.max(1, sec)}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export type RecentBigWinner = {
  wallet: string;
  walletShort: string;
  payoutApt: number;
  payoutDisplay: string;
  game: string;
  timeAgo: string;
  timestampSec: string;
  /** Used internally for cross-chain dedupe; not sent to clients. */
  chain?: string;
};

function walletDedupeKey(wallet: string, chain?: string): string {
  const c = (chain || inferChainFromWallet(wallet)).toLowerCase();
  const normalized = normalizeWalletForChain(wallet, c) ?? wallet.trim();
  if (c === 'solana') return `solana:${normalized}`;
  return `aptos:${(normalizeWallet(wallet) ?? wallet).toLowerCase()}`;
}

/** One entry per wallet — keeps the highest payout, sorted biggest win first. */
export function pickUniqueTopBigWinners(entries: RecentBigWinner[], limit: number): RecentBigWinner[] {
  const best = new Map<string, RecentBigWinner>();

  for (const entry of entries) {
    if (!entry.wallet?.trim()) continue;
    const key = walletDedupeKey(entry.wallet, entry.chain);
    const cur = best.get(key);
    const payout = Number(entry.payoutApt) || 0;
    const curPayout = Number(cur?.payoutApt) || 0;
    if (!cur || payout > curPayout) {
      best.set(key, entry);
    }
  }

  return [...best.values()]
    .sort((a, b) => (Number(b.payoutApt) || 0) - (Number(a.payoutApt) || 0))
    .slice(0, limit)
    .map(({ chain: _chain, ...rest }) => rest);
}

/** Recent winning rounds from Supabase (all play chains). */
export async function loadRecentBigWinners(limit: number): Promise<RecentBigWinner[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from('game_play_events')
    .select('chain, game, wallet, bet_raw, payout_raw, created_at')
    .order('created_at', { ascending: false })
    .limit(400);

  if (error || !data?.length) return [];

  const now = Date.now();
  const winners: RecentBigWinner[] = [];

  for (const row of data) {
    const chain = String(row.chain || '');
    const cfg = getPlayChainConfig(chain);
    const units = cfg?.units ?? 1e9;
    const symbol = cfg?.nativeSymbol ?? chain.toUpperCase();
    const bet = Number(row.bet_raw) / units;
    const payout = Number(row.payout_raw) / units;
    if (payout <= bet) continue;

    const createdAtMs = row.created_at ? new Date(String(row.created_at)).getTime() : now;
    const wallet = String(row.wallet || '').trim();
    const gameSlug = String(row.game || '').toLowerCase();

    winners.push({
      wallet,
      walletShort: shortenWallet(wallet, chain),
      payoutApt: payout,
      payoutDisplay: `${payout.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${symbol}`,
      game: GAME_DISPLAY[gameSlug] || gameSlug || 'Casino',
      timeAgo: timeAgoFromMs(now - createdAtMs),
      timestampSec: String(Math.floor(createdAtMs / 1000)),
      chain,
    });
  }

  return pickUniqueTopBigWinners(winners, limit);
}

export type LeaderboardPlayEvent = {
  chain: ChainId;
  game: string;
  wallet: string;
  betRaw: bigint;
  payoutRaw: bigint;
  createdAtMs: number;
};

/** Rows from Supabase for server-side leaderboard aggregation (Solana + house-ledger play). */
export async function loadPlayEventsForLeaderboard(opts: {
  game?: string | null;
  sinceMs?: number | null;
}): Promise<LeaderboardPlayEvent[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const out: LeaderboardPlayEvent[] = [];

  for (let page = 0; page < MAX_AGGREGATE_PAGES; page += 1) {
    const from = page * AGGREGATE_PAGE_SIZE;
    const to = from + AGGREGATE_PAGE_SIZE - 1;
    let q = db
      .from('game_play_events')
      .select('chain, game, wallet, bet_raw, payout_raw, created_at')
      .order('created_at', { ascending: true })
      .range(from, to);

    if (opts.game && opts.game !== 'all') {
      q = q.eq('game', opts.game);
    }
    if (opts.sinceMs != null) {
      q = q.gte('created_at', new Date(opts.sinceMs).toISOString());
    }

    const { data, error } = await q;
    if (error) {
      console.warn('[gamePlayEvents] leaderboard page failed', error.message);
      break;
    }
    if (!data?.length) break;

    for (const row of data) {
      const chain = String(row.chain || '').toLowerCase() as ChainId;
      const cfg = getPlayChainConfig(chain);
      if (!cfg) continue;

      const wallet = normalizeWalletForChain(String(row.wallet ?? ''), chain);
      if (!wallet) continue;

      let betRaw: bigint;
      let payoutRaw: bigint;
      try {
        betRaw = BigInt(String(row.bet_raw ?? '0'));
        payoutRaw = BigInt(String(row.payout_raw ?? '0'));
      } catch {
        continue;
      }

      const createdAtMs = row.created_at ? new Date(String(row.created_at)).getTime() : Date.now();
      out.push({
        chain,
        game: String(row.game || '').toLowerCase(),
        wallet,
        betRaw,
        payoutRaw,
        createdAtMs,
      });
    }

    if (data.length < AGGREGATE_PAGE_SIZE) break;
  }

  return out;
}

const TOP_WIN_GAME_LABEL: Record<string, string> = {
  plinko: 'Plinko',
  mines: 'Mines',
  roulette: 'Roulette',
  wheel: 'Spin Wheel',
};

export type TopWinRow = {
  wallet: string;
  walletShort: string;
  chain: ChainId;
  biggestWinNative: number;
  biggestWinDisplay: string;
  /** @deprecated use biggestWinDisplay — kept for older UI */
  biggestWinApt: number;
  biggestWinGame: string;
  biggestWinGameLabel: string;
  biggestWinAt: number;
  favoriteGame: string;
  favoriteGameLabel: string;
  bets: number;
  wins: number;
};

/** Per-wallet biggest single-round profit from Supabase play events. */
export async function aggregateTopWinsFromPlayEvents(
  top: number,
  sinceMs?: number | null,
): Promise<TopWinRow[]> {
  const events = await loadPlayEventsForLeaderboard({ sinceMs: sinceMs ?? null });
  if (!events.length) return [];

  type WalletAgg = {
    chain: ChainId;
    bets: number;
    wins: number;
    biggestWinNative: number;
    biggestWinAt: number;
    biggestWinGame: string;
    gameCounts: Record<string, number>;
  };

  const byKey = new Map<string, WalletAgg>();

  for (const ev of events) {
    const cfg = getPlayChainConfig(ev.chain);
    const units = cfg?.units ?? 1e9;
    const bet = Number(ev.betRaw) / units;
    const payout = Number(ev.payoutRaw) / units;
    const profit = payout - bet;
    const key = `${ev.chain}:${ev.wallet}`;

    const agg = byKey.get(key) || {
      chain: ev.chain,
      bets: 0,
      wins: 0,
      biggestWinNative: 0,
      biggestWinAt: 0,
      biggestWinGame: ev.game,
      gameCounts: {},
    };

    agg.bets += 1;
    agg.gameCounts[ev.game] = (agg.gameCounts[ev.game] || 0) + 1;

    if (profit > 0) {
      agg.wins += 1;
      if (profit > agg.biggestWinNative) {
        agg.biggestWinNative = profit;
        agg.biggestWinAt = Math.floor(ev.createdAtMs / 1000);
        agg.biggestWinGame = ev.game;
      }
    }

    byKey.set(key, agg);
  }

  const rows: TopWinRow[] = [];
  for (const [key, v] of byKey) {
    if (v.biggestWinNative <= 0) continue;
    const wallet = key.slice(key.indexOf(':') + 1);
    const symbol = getPlayChainConfig(v.chain)?.nativeSymbol ?? v.chain.toUpperCase();
    const favoriteSlug = Object.entries(v.gameCounts).reduce(
      (best, cur) => (cur[1] > best[1] ? cur : best),
      ['plinko', 0] as [string, number],
    )[0];

    rows.push({
      wallet,
      walletShort: shortenWallet(wallet, v.chain),
      chain: v.chain,
      biggestWinNative: v.biggestWinNative,
      biggestWinDisplay: `${v.biggestWinNative.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${symbol}`,
      biggestWinApt: v.biggestWinNative,
      biggestWinGame: v.biggestWinGame,
      biggestWinGameLabel: TOP_WIN_GAME_LABEL[v.biggestWinGame] || v.biggestWinGame,
      biggestWinAt: v.biggestWinAt,
      favoriteGame: favoriteSlug,
      favoriteGameLabel: TOP_WIN_GAME_LABEL[favoriteSlug] || favoriteSlug,
      bets: v.bets,
      wins: v.wins,
    });
  }

  rows.sort((a, b) => b.biggestWinNative - a.biggestWinNative);
  return rows.slice(0, top);
}
