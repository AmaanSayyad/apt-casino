import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { aggregatePlayEventsSince } from '@/lib/server/gamePlayEvents';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const CACHE_TTL_MS = 120_000;
/** Public counters use raw protocol totals (no artificial inflation). */
const ALL_TIME_STATS_SCALE = 1;

type PublicStatsPayload = Record<string, unknown>;

let cached: { at: number; data: PublicStatsPayload } | null = null;
let inflight: Promise<PublicStatsPayload> | null = null;

function network(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  if (n === 'testnet') return Network.TESTNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.MAINNET;
}

type RawGame = Record<string, unknown>;

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

async function aptosOnChainRoundStats(): Promise<{ total: number; wins: number }> {
  let total = 0;
  let wins = 0;
  try {
    const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;
    if (!moduleAddr) return { total, wins };

    const aptos = new Aptos(new AptosConfig({ network: network() }));
    const history = await aptos.view({
      payload: {
        function: `${moduleAddr}::game_logger::get_game_history`,
        functionArguments: [moduleAddr],
      },
    });
    const games = (history[0] as RawGame[]) || [];
    total = games.length;
    for (const g of games) {
      const bet = u64(g, 'bet_amount');
      const payout = u64(g, 'payout');
      if (payout > bet) wins += 1;
    }
  } catch (e) {
    console.warn('[stats/public] on-chain history fetch failed', e);
  }
  return { total, wins };
}

async function computePublicStats(): Promise<PublicStatsPayload> {
  let totalRoundsPlayed = 0;
  let playerRoundsWon = 0;

  const supabase = getSupabaseAdmin();
  const supabaseConfigured = Boolean(supabase);

  let depositsProcessed = 0;
  let uniqueTraders = 0;
  let roundsByChain: Record<string, number> = { solana: 0, aptos: 0 };
  let winsByChain: Record<string, number> = { solana: 0, aptos: 0 };
  let depositsByChain: Record<string, number> = { solana: 0, aptos: 0 };

  if (supabase) {
    const [{ count: dCount, error: dErr }, { count: wCount, error: wErr }, allPlay, solDep, aptDep] =
      await Promise.all([
        supabase.from('deposits_log').select('*', { count: 'exact', head: true }),
        supabase.from('tracked_wallets').select('*', { count: 'exact', head: true }),
        aggregatePlayEventsSince(null),
        supabase
          .from('deposits_log')
          .select('*', { count: 'exact', head: true })
          .eq('chain', 'solana'),
        supabase
          .from('deposits_log')
          .select('*', { count: 'exact', head: true })
          .eq('chain', 'aptos'),
      ]);
    if (dErr) console.warn('[stats/public] deposits_log count', dErr.message);
    if (wErr) console.warn('[stats/public] tracked_wallets count', wErr.message);
    depositsProcessed = dCount ?? 0;
    depositsByChain = {
      solana: solDep.count ?? 0,
      aptos: aptDep.count ?? 0,
    };
    totalRoundsPlayed = allPlay.totalBets;
    playerRoundsWon = allPlay.playerWins;
    roundsByChain = {
      solana: allPlay.totalBetsByChain?.solana ?? 0,
      aptos: allPlay.totalBetsByChain?.aptos ?? 0,
    };
    winsByChain = {
      solana: allPlay.playerWinsByChain?.solana ?? 0,
      aptos: allPlay.playerWinsByChain?.aptos ?? 0,
    };
    uniqueTraders = allPlay.uniqueWallets > 0 ? allPlay.uniqueWallets : (wCount ?? 0);
  } else {
    const onChain = await aptosOnChainRoundStats();
    totalRoundsPlayed = onChain.total;
    playerRoundsWon = onChain.wins;
    roundsByChain = { solana: 0, aptos: onChain.total };
    winsByChain = { solana: 0, aptos: onChain.wins };
  }

  const scale = (n: number) => n * ALL_TIME_STATS_SCALE;

  return {
    totalRoundsPlayed: scale(totalRoundsPlayed),
    playerRoundsWon: scale(playerRoundsWon),
    depositsProcessed: scale(depositsProcessed),
    uniqueTraders: scale(uniqueTraders),
    winRatePct:
      totalRoundsPlayed > 0 ? Math.round((playerRoundsWon / totalRoundsPlayed) * 1000) / 10 : 0,
    roundsByChain: {
      solana: scale(roundsByChain.solana ?? 0),
      aptos: scale(roundsByChain.aptos ?? 0),
    },
    winsByChain: {
      solana: scale(winsByChain.solana ?? 0),
      aptos: scale(winsByChain.aptos ?? 0),
    },
    depositsByChain: {
      solana: scale(depositsByChain.solana ?? 0),
      aptos: scale(depositsByChain.aptos ?? 0),
    },
    supabaseConfigured,
    chainsActive: 2,
    chains: ['solana', 'aptos'],
    cachedAt: new Date().toISOString(),
  };
}

export async function getPublicStatsCached(): Promise<PublicStatsPayload> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.data;
  if (inflight) return inflight;

  inflight = computePublicStats()
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
