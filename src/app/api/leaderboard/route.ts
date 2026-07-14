import { NextRequest, NextResponse } from 'next/server';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { normalizeWallet, normalizeWalletForChain } from '@/lib/server/referrals';
import { getPlayChainConfig, type ChainId } from '@/lib/chains/registry';
import { loadPlayEventsForLeaderboard } from '@/lib/server/gamePlayEvents';
import { resolvePlayerAvatarUrl, resolveLinkedTwitterHandle } from '@/lib/xProfile';
import { loadBannedWalletKeys, walletMatchesBanSet } from '@/lib/bans/walletBan';

export const dynamic = 'force-dynamic';

// ----- Configuration --------------------------------------------------------------

const GAME_NAMES: Record<number, string> = {
  1: 'plinko',
  2: 'mines',
  3: 'roulette',
  4: 'wheel',
};

const GAME_FILTERS = new Set(['all', 'plinko', 'mines', 'roulette', 'wheel']);
const PERIOD_FILTERS = new Set(['24h', '7d', '30d', 'all']);
const METRICS = new Set(['pnl', 'wagered', 'bets', 'winrate', 'biggest']);

/** Min bets to be eligible for the winrate leaderboard — keeps a 1/1 lucky shot from #1. */
const MIN_BETS_FOR_WINRATE = 10;

// In-memory cache for the (heavy) on-chain history pull. Cached per Lambda warm path.
type CacheEntry = { ts: number; games: RawGame[] };
let HISTORY_CACHE: CacheEntry | null = null;
const HISTORY_CACHE_TTL_MS = 30_000; // 30s

// ----- Types ----------------------------------------------------------------------

type RawGame = {
  game_type?: number | string;
  player_address?: string;
  bet_amount?: number | string;
  payout?: number | string;
  result?: string;
  timestamp?: number | string; // microseconds (Aptos)
};

type Aggregated = {
  wallet: string;
  chain: ChainId;
  bets: number;
  wins: number;
  betRaw: bigint;
  payoutRaw: bigint;
  biggestWinRaw: bigint;
  lastBetMs: number | null;
  lastWinMs: number | null;
};

function aggKey(chain: ChainId, wallet: string): string {
  return `${chain}:${wallet}`;
}

/** Games that log payout as gross return (bet × multiplier), including sub-1× losses. */
const GROSS_RETURN_GAMES = new Set(['plinko', 'mines', 'wheel']);

/**
 * Older roulette clients logged profit-only on wins. For those, add stake back when
 * payout is positive but below the bet. Never apply that to Plinko/Mines/Wheel or
 * sub-1× returns read as losses (fixes inflated win rates on Plinko).
 */
function grossPayoutRaw(betRaw: bigint, payoutRaw: bigint, gameSlug: string | null): bigint {
  if (gameSlug && GROSS_RETURN_GAMES.has(gameSlug)) return payoutRaw;
  if (payoutRaw > 0n && payoutRaw < betRaw) return payoutRaw + betRaw;
  return payoutRaw;
}

function applyPlayEvent(
  byWallet: Map<string, Aggregated>,
  chain: ChainId,
  wallet: string,
  betRaw: bigint,
  payoutRaw: bigint,
  tsMs: number | null,
  gameSlug: string | null,
): void {
  const key = aggKey(chain, wallet);
  const grossPayout = grossPayoutRaw(betRaw, payoutRaw, gameSlug);
  const pnl = grossPayout - betRaw;
  let entry = byWallet.get(key);
  if (!entry) {
    entry = {
      wallet,
      chain,
      bets: 0,
      wins: 0,
      betRaw: 0n,
      payoutRaw: 0n,
      biggestWinRaw: 0n,
      lastBetMs: null,
      lastWinMs: null,
    };
    byWallet.set(key, entry);
  }
  entry.bets += 1;
  entry.betRaw += betRaw;
  entry.payoutRaw += grossPayout;
  if (pnl > 0n) entry.wins += 1;
  if (pnl > entry.biggestWinRaw) entry.biggestWinRaw = pnl;
  if (tsMs !== null) {
    if (entry.lastBetMs === null || tsMs > entry.lastBetMs) entry.lastBetMs = tsMs;
    if (pnl > 0n && (entry.lastWinMs === null || tsMs > entry.lastWinMs)) entry.lastWinMs = tsMs;
  }
}

// ----- Helpers --------------------------------------------------------------------

function network(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  if (n === 'testnet') return Network.TESTNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.MAINNET;
}

function u64ToBigInt(v: unknown): bigint {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return BigInt(Math.trunc(v));
  try {
    return BigInt(String(v ?? '0'));
  } catch {
    return 0n;
  }
}

function playerWallet(g: RawGame): string | null {
  const raw = g.player_address;
  if (typeof raw !== 'string') return null;
  return normalizeWallet(raw);
}

/** Aptos `timestamp` is microseconds. Returns ms epoch or null. */
function tsToMs(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Heuristic: values past year ~2200 in seconds → micros / millis.
  if (n > 1e15) return Math.trunc(n / 1000); // micros → ms
  if (n > 1e12) return Math.trunc(n); // ms
  return Math.trunc(n * 1000); // seconds → ms
}

function periodCutoffMs(period: string): number | null {
  const now = Date.now();
  switch (period) {
    case '24h':
      return now - 24 * 60 * 60 * 1000;
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

async function loadGameHistory(): Promise<RawGame[]> {
  const now = Date.now();
  if (HISTORY_CACHE && now - HISTORY_CACHE.ts < HISTORY_CACHE_TTL_MS) {
    return HISTORY_CACHE.games;
  }

  const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;
  if (!moduleAddr) {
    return [];
  }

  try {
    const aptos = new Aptos(new AptosConfig({ network: network() }));
    const result = await aptos.view({
      payload: {
        function: `${moduleAddr}::game_logger::get_game_history`,
        functionArguments: [moduleAddr],
      },
    });
    const games = ((result?.[0] as RawGame[]) || []).slice();
    HISTORY_CACHE = { ts: now, games };
    return games;
  } catch (err) {
    console.error('[leaderboard] Aptos history fetch failed:', err);
    return HISTORY_CACHE?.games ?? [];
  }
}

// ----- Handler --------------------------------------------------------------------

/**
 * Aggregated leaderboard from on-chain Aptos `game_logger` plus Supabase `game_play_events`
 * (Solana and other house-ledger chains).
 *
 * Query parameters:
 *   - metric:  'biggest' | 'pnl' | 'wagered' | 'bets' | 'winrate'  (default 'biggest')
 *   - period:  '24h' | '7d' | '30d' | 'all'                         (default 'all')
 *   - game:    'all' | 'plinko' | 'mines' | 'roulette' | 'wheel'    (default 'all')
 *   - top:     1..2000                                               (default 50)
 *
 * Top wallets are joined against `user_profiles` (single batched query) to surface
 * handles and avatars on the UI. Results are cached on the edge for 30s via the
 * `Cache-Control` header, and the underlying fullnode pull is cached for 30s
 * in-memory across warm invocations.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metric = (searchParams.get('metric') || 'biggest').toLowerCase();
  const period = (searchParams.get('period') || 'all').toLowerCase();
  const game = (searchParams.get('game') || 'all').toLowerCase();
  const top = Math.min(Math.max(parseInt(searchParams.get('top') || '50', 10) || 50, 1), 2000);

  if (!METRICS.has(metric)) {
    return NextResponse.json({ error: `metric must be one of: ${[...METRICS].join(', ')}` }, { status: 400 });
  }
  if (!PERIOD_FILTERS.has(period)) {
    return NextResponse.json({ error: `period must be one of: ${[...PERIOD_FILTERS].join(', ')}` }, { status: 400 });
  }
  if (!GAME_FILTERS.has(game)) {
    return NextResponse.json({ error: `game must be one of: ${[...GAME_FILTERS].join(', ')}` }, { status: 400 });
  }

  const cutoffMs = periodCutoffMs(period);
  const wantedSlug = game === 'all' ? null : game;
  const bannedWallets = await loadBannedWalletKeys();

  let games: RawGame[] = [];
  games = await loadGameHistory();

  const byWallet = new Map<string, Aggregated>();
  let totalBets = 0;
  let totalWageredRaw = 0n;
  let totalPayoutRaw = 0n;

  for (const g of games) {
    const wallet = playerWallet(g);
    if (!wallet || walletMatchesBanSet(wallet, bannedWallets)) continue;

    const slug = GAME_NAMES[Number(g.game_type || 0)] ?? null;
    if (wantedSlug && slug !== wantedSlug) continue;
    const tsMs = tsToMs(g.timestamp);
    if (cutoffMs !== null && (tsMs === null || tsMs < cutoffMs)) continue;

    const bet = u64ToBigInt(g.bet_amount);
    const payout = u64ToBigInt(g.payout);
    applyPlayEvent(byWallet, 'aptos', wallet, bet, payout, tsMs, slug);
    totalBets += 1;
    totalWageredRaw += bet;
    totalPayoutRaw += payout;
  }

  const supabaseEvents = await loadPlayEventsForLeaderboard({
    game: wantedSlug,
    sinceMs: cutoffMs,
  });
  for (const ev of supabaseEvents) {
    if (ev.chain === 'aptos') continue; // on-chain Aptos history is canonical
    if (wantedSlug && ev.game !== wantedSlug) continue;
    if (walletMatchesBanSet(ev.wallet, bannedWallets)) continue;
    applyPlayEvent(byWallet, ev.chain, ev.wallet, ev.betRaw, ev.payoutRaw, ev.createdAtMs, ev.game);
    totalBets += 1;
    totalWageredRaw += ev.betRaw;
    totalPayoutRaw += ev.payoutRaw;
  }

  // ----- Sort ---------------------------------------------------------------------
  const scored = [...byWallet.values()]
    .map((e) => {
      const units = getPlayChainConfig(e.chain)?.units ?? 1e8;
      const pnlRaw = e.payoutRaw - e.betRaw;
      const pnlNative = Number(pnlRaw) / units;
      return {
        wallet: e.wallet,
        chain: e.chain,
        bets: e.bets,
        wins: e.wins,
        wageredApt: Number(e.betRaw) / units,
        returnedApt: Number(e.payoutRaw) / units,
        pnlApt: pnlNative,
        pnlNative,
        winrate: e.bets > 0 ? e.wins / e.bets : 0,
        biggestWinApt: Number(e.biggestWinRaw) / units,
        lastBetMs: e.lastBetMs,
        lastWinMs: e.lastWinMs,
      };
    })
    .filter((row) => {
      if (walletMatchesBanSet(row.wallet, bannedWallets)) return false;
      if (metric === 'winrate') return row.bets >= MIN_BETS_FOR_WINRATE;
      return true;
    });

  scored.sort((a, b) => {
    switch (metric) {
      case 'pnl':
        return b.pnlApt - a.pnlApt;
      case 'wagered':
        return b.wageredApt - a.wageredApt;
      case 'bets':
        return b.bets - a.bets;
      case 'winrate':
        return b.winrate - a.winrate || b.bets - a.bets;
      case 'biggest':
        return b.biggestWinApt - a.biggestWinApt;
      default:
        return b.biggestWinApt - a.biggestWinApt;
    }
  });

  const ranked = scored.slice(0, top);

  // ----- Enrich with profile data -------------------------------------------------
  const profiles = await fetchProfiles(ranked.map((r) => r.wallet));

  const leaderboard = ranked.map((row, i) => {
    const profile = profiles.get(row.wallet) || profiles.get(normalizeWallet(row.wallet) ?? '') || null;
    const twitterHandle = resolveLinkedTwitterHandle({
      twitterHandle: profile?.twitter_handle,
      avatarUrl: profile?.avatar_url,
    });
    return {
      rank: i + 1,
      chain: row.chain,
      wallet: row.wallet,
      handle: safeProfileHandle(profile?.handle),
      twitterHandle,
      avatarUrl: resolvePlayerAvatarUrl({
        avatarUrl: profile?.avatar_url,
        twitterHandle,
      }),
      bets: row.bets,
      wins: row.wins,
      winrate: row.winrate,
      wageredApt: row.wageredApt,
      returnedApt: row.returnedApt,
      pnlApt: row.pnlApt,
      pnlNative: row.pnlNative,
      biggestWinApt: row.biggestWinApt,
      lastBetMs: row.lastBetMs,
      lastWinMs: row.lastWinMs,
    };
  });

  const aptUnits = getPlayChainConfig('aptos')?.units ?? 1e8;

  return NextResponse.json(
    {
      success: true,
      sources: ['aptos_on_chain', 'game_play_events'],
      metric,
      period,
      game,
      uniquePlayers: byWallet.size,
      totalBets,
      totalWageredApt: Number(totalWageredRaw) / aptUnits,
      totalReturnedApt: Number(totalPayoutRaw) / aptUnits,
      totalGamesParsed: games.length,
      supabaseEventsParsed: supabaseEvents.length,
      eligibilityThreshold: metric === 'winrate' ? MIN_BETS_FOR_WINRATE : null,
      leaderboard,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    },
  );
}

// ----- Profile join (Supabase) ----------------------------------------------------

type ProfileLite = { handle: string | null; avatar_url: string | null; twitter_handle: string | null };

function safeProfileHandle(handle: unknown): string | null {
  if (typeof handle === 'string') {
    const t = handle.trim();
    if (t && !t.includes('[object')) return t;
  }
  return null;
}

async function fetchProfiles(wallets: string[]): Promise<Map<string, ProfileLite>> {
  const map = new Map<string, ProfileLite>();
  if (!wallets.length) return map;
  const supabase = getSupabaseAdmin();
  if (!supabase) return map; // graceful degradation when service role isn't configured

  const { data } = await supabase
    .from('user_profiles')
    .select('wallet, handle, avatar_url, twitter_handle')
    .in('wallet', wallets);

  for (const row of data ?? []) {
    map.set(row.wallet, {
      handle: row.handle,
      avatar_url: row.avatar_url,
      twitter_handle: row.twitter_handle,
    });
  }
  return map;
}
