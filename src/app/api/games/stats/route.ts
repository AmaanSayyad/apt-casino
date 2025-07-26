import { NextRequest, NextResponse } from 'next/server';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { formatCombinedNative } from '@/lib/formatVolume';
import { normalizeWalletForChain } from '@/lib/server/referrals';

export const dynamic = 'force-dynamic';

/**
 * Aggregate on-chain game statistics, scoped to a single game type or all games.
 *
 * Source: `game_logger::get_game_history` view function. The result is cached
 * in-memory across warm invocations and via `Cache-Control` for edge cache.
 *
 * Response:
 *   {
 *     game:           'plinko' | 'mines' | 'roulette' | 'wheel' | 'all',
 *     totalBets:      number,
 *     totalWins:      number,
 *     volumeOctas:    string (bigint as decimal),
 *     volumeApt:      number,
 *     payoutOctas:    string,
 *     payoutApt:      number,
 *     maxWinOctas:    string,
 *     maxWinApt:      number,
 *     maxWinPlayer:   string | null,
 *     uniquePlayers:  number,
 *     updatedAt:      ISO timestamp,
 *     source:         'onchain' | 'empty',
 *   }
 */

const GAME_SLUG_TO_TYPE: Record<string, number> = {
  plinko: 1,
  mines: 2,
  roulette: 3,
  wheel: 4,
};

const VALID_SLUGS = new Set(['all', 'plinko', 'mines', 'roulette', 'wheel']);

type RawGame = {
  game_type?: number | string;
  player_address?: string;
  bet_amount?: number | string;
  payout?: number | string;
  result?: string;
  timestamp?: number | string;
};

const OCTAS = 100_000_000n;

type CacheEntry = { ts: number; games: RawGame[] };
let HISTORY_CACHE: CacheEntry | null = null;
const HISTORY_CACHE_TTL_MS = 30_000;

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

function readPlayerAddress(g: RawGame): string | null {
  const v = g.player_address;
  if (typeof v !== 'string') return null;
  const trimmed = v.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
}

async function loadGameHistory(): Promise<RawGame[]> {
  const now = Date.now();
  if (HISTORY_CACHE && now - HISTORY_CACHE.ts < HISTORY_CACHE_TTL_MS) {
    return HISTORY_CACHE.games;
  }

  const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;
  if (!moduleAddr) return [];

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
    console.error('[games/stats] history fetch failed:', err);
    // Don't poison the cache on failure — try again next request.
    return HISTORY_CACHE?.games ?? [];
  }
}

function octasToApt(octas: bigint): number {
  // Use Number for display only — precision loss above ~9e15 octas (~9e7 APT)
  // is acceptable for an aggregate.
  return Number(octas) / Number(OCTAS);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get('game') || 'all').toLowerCase();
  if (!VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: 'invalid game' }, { status: 400 });
  }

  const wantedType = slug === 'all' ? null : GAME_SLUG_TO_TYPE[slug];

  const games = await loadGameHistory();

  let totalBets = 0;
  let totalWins = 0;
  let volumeOctas = 0n;
  let payoutOctas = 0n;
  let maxWinOctas = 0n;
  let maxWinPlayer: string | null = null;
  const players = new Set<string>();

  for (const g of games) {
    if (wantedType !== null) {
      const gt = Number(g.game_type);
      if (gt !== wantedType) continue;
    }

    totalBets += 1;
    const bet = u64ToBigInt(g.bet_amount);
    const payout = u64ToBigInt(g.payout);
    volumeOctas += bet;
    payoutOctas += payout;
    if (payout > bet) totalWins += 1;
    if (payout > maxWinOctas) {
      maxWinOctas = payout;
      maxWinPlayer = readPlayerAddress(g);
    }
    const wallet = readPlayerAddress(g);
    if (wallet) players.add(wallet);
  }

  const volumeByChain: Record<string, number> = { aptos: octasToApt(volumeOctas) };
  let maxWinByChain: Record<string, number> = { aptos: octasToApt(maxWinOctas) };
  let extraBets = 0;

  const db = getSupabaseAdmin();
  if (db) {
    let q = db
      .from('game_play_events')
      .select('chain, bet_raw, payout_raw, wallet')
      .neq('chain', 'aptos');
    if (slug !== 'all') q = q.eq('game', slug);
    const { data: rows, error } = await q;
    if (error) {
      console.warn('[games/stats] supabase query failed:', error.message);
    }
    for (const row of rows ?? []) {
      extraBets += 1;
      const chain = String(row.chain);
      const cfg = getPlayChainConfig(chain);
      const units = cfg?.units ?? 1e9;
      const bet = Number(row.bet_raw) / units;
      const payout = Number(row.payout_raw) / units;
      volumeByChain[chain] = (volumeByChain[chain] ?? 0) + bet;
      if (payout > bet) totalWins += 1;
      if (payout > (maxWinByChain[chain] ?? 0)) maxWinByChain[chain] = payout;
      const wallet = normalizeWalletForChain(String(row.wallet ?? ''), chain);
      if (wallet) players.add(wallet);
    }
  }

  const body = {
    game: slug,
    totalBets: totalBets + extraBets,
    totalWins,
    uniquePlayers: players.size,
    volumeOctas: volumeOctas.toString(),
    volumeApt: octasToApt(volumeOctas),
    volumeByChain,
    volumeDisplay: formatCombinedNative(volumeByChain),
    payoutOctas: payoutOctas.toString(),
    payoutApt: octasToApt(payoutOctas),
    maxWinOctas: maxWinOctas.toString(),
    maxWinApt: octasToApt(maxWinOctas),
    maxWinByChain,
    maxWinDisplay: formatCombinedNative(maxWinByChain),
    maxWinPlayer,
    updatedAt: new Date().toISOString(),
    source: games.length === 0 && extraBets === 0 ? 'empty' : 'onchain',
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
