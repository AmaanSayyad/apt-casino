import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import {
  aggregateGameActivityFromPlayEvents,
  aggregatePlayEventsSince,
  loadRecentBigWinners,
  pickUniqueTopBigWinners,
  type RecentBigWinner,
} from '@/lib/server/gamePlayEvents';
import { formatCombinedNative } from '@/lib/formatVolume';

const CACHE_TTL_MS = 120_000;

const GAME_NAME: Record<number, string> = {
  1: 'Plinko',
  2: 'Mines',
  3: 'Roulette',
  4: 'Wheel',
};

const OCTAS = 100_000_000n;
const DAY_SECONDS = 24n * 60n * 60n;
const ONLINE_WINDOW_SECONDS = 60n * 60n;

type RawGame = Record<string, unknown>;

type LiveStatsPayload = Record<string, unknown>;

let cached: { at: number; data: LiveStatsPayload } | null = null;
let inflight: Promise<LiveStatsPayload> | null = null;

function network(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  if (n === 'testnet') return Network.TESTNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.MAINNET;
}

function u64(g: RawGame, key: string): bigint {
  const v = g[key];
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return BigInt(Math.trunc(v));
  try {
    return BigInt(String(v ?? '0'));
  } catch {
    return 0n;
  }
}

function u8(g: RawGame, key: string): number {
  const v = g[key];
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(g: RawGame, key: string): string {
  const v = g[key];
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.value === 'string') return obj.value;
    if (typeof obj.bytes === 'string') return obj.bytes;
    if (typeof obj.inner === 'string') return obj.inner;
  }
  return '';
}

function normalizeAptosAddr(addr: string): string {
  if (!addr) return '';
  let hex = addr.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]+$/.test(hex)) return '';
  return `0x${hex.padStart(64, '0')}`;
}

function shorten(addr: string): string {
  const norm = normalizeAptosAddr(addr) || (addr.startsWith('0x') ? addr : `0x${addr}`);
  if (norm.length <= 12) return norm;
  return `${norm.slice(0, 6)}…${norm.slice(-4)}`;
}

function timeAgo(secondsAgo: bigint): string {
  let sec = Number(secondsAgo);
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  if (sec < 60) return `${Math.max(1, Math.floor(sec))}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

async function computeLiveStats(): Promise<LiveStatsPayload> {
  const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;

  let games: RawGame[] = [];
  if (moduleAddr) {
    try {
      const aptos = new Aptos(new AptosConfig({ network: network() }));
      const history = await aptos.view({
        payload: {
          function: `${moduleAddr}::game_logger::get_game_history`,
          functionArguments: [moduleAddr],
        },
      });
      games = (history[0] as RawGame[]) || [];
    } catch (e) {
      console.warn('[stats/live] on-chain history fetch failed', e);
    }
  }

  let nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  if (games.length > 0) {
    const latest = games.reduce((max, g) => {
      const t = u64(g, 'timestamp');
      return t > max ? t : max;
    }, 0n);
    if (latest > nowSeconds) nowSeconds = latest;
  }

  const dayCutoff = nowSeconds - DAY_SECONDS;
  const onlineCutoff = nowSeconds - ONLINE_WINDOW_SECONDS;

  let totalWageredOctas = 0n;
  let maxPayoutOctas = 0n;
  let dailyWinners = 0;
  const activePlayerSet = new Set<string>();
  const gameTotals = new Map<string, number>();
  const gameOnlinePlayers = new Map<string, Set<string>>();
  const winners: RecentBigWinner[] = [];

  for (const g of games) {
    const bet = u64(g, 'bet_amount');
    const payout = u64(g, 'payout');
    const ts = u64(g, 'timestamp');
    const player = normalizeAptosAddr(str(g, 'player_address'));
    const gameTypeNum = u8(g, 'game_type');
    const gameSlug =
      GAME_NAME[gameTypeNum]?.toLowerCase() === 'wheel'
        ? 'wheel'
        : GAME_NAME[gameTypeNum]?.toLowerCase() || `game_${gameTypeNum}`;

    totalWageredOctas += bet;
    if (payout > maxPayoutOctas) maxPayoutOctas = payout;

    gameTotals.set(gameSlug, (gameTotals.get(gameSlug) || 0) + 1);
    if (ts >= onlineCutoff && player) {
      let set = gameOnlinePlayers.get(gameSlug);
      if (!set) {
        set = new Set<string>();
        gameOnlinePlayers.set(gameSlug, set);
      }
      set.add(player);
    }

    if (ts >= dayCutoff) {
      if (player) activePlayerSet.add(player);
      if (payout > bet) dailyWinners += 1;
    }

    if (payout > bet && player) {
      const payoutApt = Number(payout) / Number(OCTAS);
      winners.push({
        wallet: player,
        walletShort: shorten(player),
        payoutApt,
        payoutDisplay: `${payoutApt.toLocaleString('en-US', { maximumFractionDigits: 4 })} APT`,
        game: GAME_NAME[u8(g, 'game_type')] || 'Casino',
        timeAgo: timeAgo(nowSeconds - ts),
        timestampSec: ts.toString(),
        chain: 'aptos',
      });
    }
  }

  const sbRecentWinners = await loadRecentBigWinners(12);
  const mergedWinners = pickUniqueTopBigWinners([...sbRecentWinners, ...winners], 4);
  const recentWinners = mergedWinners.map((w) =>
    'payoutDisplay' in w && w.payoutDisplay
      ? w
      : {
          ...w,
          payoutDisplay: `${w.payoutApt?.toLocaleString('en-US', { maximumFractionDigits: 4 }) ?? '0'} APT`,
        },
  );

  const gameActivity: Record<string, { playersOnline: number; totalBets: number }> = {};
  for (const slug of ['plinko', 'mines', 'roulette', 'wheel']) {
    gameActivity[slug] = {
      playersOnline: gameOnlinePlayers.get(slug)?.size ?? 0,
      totalBets: gameTotals.get(slug) ?? 0,
    };
  }

  const supabaseActivity = await aggregateGameActivityFromPlayEvents({
    onlineSinceMs: Number(onlineCutoff) * 1000,
  });
  for (const slug of ['plinko', 'mines', 'roulette', 'wheel']) {
    const sb = supabaseActivity[slug];
    if (!sb) continue;
    gameActivity[slug].totalBets += sb.totalBets;
    gameActivity[slug].playersOnline += sb.playersOnline;
  }

  const aptWagered = Number(totalWageredOctas) / Number(OCTAS);
  const aptMaxWin = Number(maxPayoutOctas) / Number(OCTAS);

  const dayMs = Date.now() - 24 * 60 * 60 * 1000;
  const [sb, allSb] = await Promise.all([aggregatePlayEventsSince(dayMs), aggregatePlayEventsSince(null)]);

  const wageredByChain: Record<string, number> = { aptos: aptWagered };
  for (const [chain, vol] of Object.entries(allSb.totalWageredByChain)) {
    if (chain !== 'aptos') wageredByChain[chain] = vol;
  }

  const maxWinByChain: Record<string, number> = { aptos: aptMaxWin };
  for (const [chain, w] of Object.entries(allSb.maxWinByChain)) {
    if (chain === 'aptos') continue;
    maxWinByChain[chain] = w;
  }

  const totalBetsAll = games.length + allSb.totalBets;
  const totalWagered24hByChain: Record<string, number> = {
    aptos: Number(
      games.filter((g) => u64(g, 'timestamp') >= dayCutoff).reduce((s, g) => s + u64(g, 'bet_amount'), 0n),
    ) / Number(OCTAS),
  };
  for (const [chain, vol] of Object.entries(sb.totalWageredByChain)) {
    totalWagered24hByChain[chain] = (totalWagered24hByChain[chain] ?? 0) + vol;
  }

  const activePlayers = Math.max(activePlayerSet.size, sb.activePlayers);

  return {
    activePlayers,
    totalBets: totalBetsAll,
    totalWageredApt: aptWagered,
    maxWinApt: aptMaxWin,
    totalWageredByChain: wageredByChain,
    totalWagered24hByChain,
    maxWinByChain,
    totalWageredDisplay: formatCombinedNative(wageredByChain),
    totalWagered24hDisplay: formatCombinedNative(totalWagered24hByChain),
    maxWinDisplay: formatCombinedNative(maxWinByChain),
    dailyWinners: sb.totalBets > 0 ? sb.playerWins : dailyWinners + sb.playerWins,
    recentWinners,
    gameActivity,
    configured: Boolean(moduleAddr) || Object.values(supabaseActivity).some((g) => g.totalBets > 0),
    chainsActive: ['solana', 'aptos'],
    cachedAt: new Date().toISOString(),
  };
}

export async function getLiveStatsCached(): Promise<LiveStatsPayload> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }
  if (inflight) return inflight;

  inflight = computeLiveStats()
    .then((data) => {
      cached = { at: Date.now(), data };
      inflight = null;
      return data;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });

  return inflight;
}
