import { NextRequest, NextResponse } from 'next/server';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { normalizeWallet, normalizeWalletForChain } from '@/lib/server/referrals';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { buildDemoGamesPayload, isDemoPlayWallet } from '@/lib/play/demoPlay';

export const dynamic = 'force-dynamic';

const GAME_NAMES: Record<number, string> = {
  1: 'plinko',
  2: 'mines',
  3: 'roulette',
  4: 'wheel',
};

type RawGame = {
  game_type?: number | string;
  player_address?: string;
  bet_amount?: number | string;
  payout?: number | string;
  result?: string;
  timestamp?: number | string;
};

function networkFromEnv(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  if (n === 'testnet') return Network.TESTNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.MAINNET;
}

/**
 * Per-wallet game stats sourced from the on-chain game_logger module.
 * Returns aggregate counts + a recent list. Cached briefly to avoid hammering the
 * fullnode for repeated profile loads.
 */
export async function GET(req: NextRequest) {
  const chainParam = (req.nextUrl.searchParams.get('chain') || 'aptos').toLowerCase();
  const chainId = chainParam === 'solana' ? 'solana' : 'aptos';
  const wallet = normalizeWalletForChain(req.nextUrl.searchParams.get('wallet'), chainId);
  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  if (isDemoPlayWallet(wallet)) {
    return NextResponse.json(buildDemoGamesPayload());
  }

  if (chainId === 'solana') {
    return loadSolanaGameStats(wallet);
  }

  const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;
  if (!moduleAddr) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_CASINO_MODULE_ADDRESS is not configured.' },
      { status: 500 },
    );
  }

  let games: RawGame[] = [];
  try {
    const aptos = new Aptos(new AptosConfig({ network: networkFromEnv() }));
    const result = await aptos.view({
      payload: {
        function: `${moduleAddr}::game_logger::get_game_history`,
        functionArguments: [moduleAddr],
      },
    });
    games = ((result?.[0] as RawGame[]) || []).filter((g) => {
      // Player addresses on-chain may be raw bytes; compare normalized.
      const p = normalizeWallet(String(g.player_address ?? ''));
      return p === wallet;
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to load on-chain game history', detail: msg },
      { status: 502 },
    );
  }

  const OCT = 100_000_000;
  let totalBetOctas = 0;
  let totalPayoutOctas = 0;
  let wins = 0;
  let losses = 0;
  const perGame: Record<string, { bets: number; wins: number; betOctas: number; payoutOctas: number }> = {};
  let biggestWinOctas = 0;
  let biggestWinGame: string | null = null;

  for (const g of games) {
    const bet = Number(g.bet_amount || 0);
    const payout = Number(g.payout || 0);
    const type = Number(g.game_type || 0);
    const slug = GAME_NAMES[type] || `type_${type}`;

    totalBetOctas += bet;
    totalPayoutOctas += payout;
    if (payout > bet) wins += 1;
    else losses += 1;

    if (payout - bet > biggestWinOctas) {
      biggestWinOctas = payout - bet;
      biggestWinGame = slug;
    }

    if (!perGame[slug]) perGame[slug] = { bets: 0, wins: 0, betOctas: 0, payoutOctas: 0 };
    perGame[slug].bets += 1;
    if (payout > bet) perGame[slug].wins += 1;
    perGame[slug].betOctas += bet;
    perGame[slug].payoutOctas += payout;
  }

  const recent = games
    .slice(-20)
    .reverse()
    .map((g) => ({
      gameType: GAME_NAMES[Number(g.game_type || 0)] || `type_${g.game_type}`,
      betApt: Number(g.bet_amount || 0) / OCT,
      payoutApt: Number(g.payout || 0) / OCT,
      result: g.result ?? null,
      timestamp: g.timestamp != null ? Number(g.timestamp) / 1000 : null,
    }));

  return NextResponse.json(
    {
      wallet,
      totalBets: games.length,
      wins,
      losses,
      winrate: games.length > 0 ? wins / games.length : 0,
      totalWageredApt: totalBetOctas / OCT,
      totalReturnedApt: totalPayoutOctas / OCT,
      netProfitApt: (totalPayoutOctas - totalBetOctas) / OCT,
      biggestWinApt: biggestWinOctas / OCT,
      biggestWinGame,
      perGame: Object.fromEntries(
        Object.entries(perGame).map(([slug, stats]) => [
          slug,
          {
            bets: stats.bets,
            wins: stats.wins,
            winrate: stats.bets > 0 ? stats.wins / stats.bets : 0,
            wageredApt: stats.betOctas / OCT,
            returnedApt: stats.payoutOctas / OCT,
            netProfitApt: (stats.payoutOctas - stats.betOctas) / OCT,
          },
        ]),
      ),
      recent,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    },
  );
}

async function loadSolanaGameStats(wallet: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const cfg = getPlayChainConfig('solana');
  const units = cfg?.units ?? 1_000_000_000;

  const { data, error } = await supabase
    .from('game_play_events')
    .select('game, bet_raw, payout_raw, result, created_at, proof_reference')
    .eq('wallet', wallet)
    .eq('chain', 'solana')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load game history', detail: error.message },
      { status: 502 },
    );
  }

  const rows = data ?? [];
  let totalBet = 0;
  let totalPayout = 0;
  let wins = 0;
  let losses = 0;
  const perGame: Record<string, { bets: number; wins: number; betNative: number; payoutNative: number }> =
    {};
  let biggestWin = 0;
  let biggestWinGame: string | null = null;

  for (const row of rows) {
    const bet = Number(row.bet_raw) / units;
    const payout = Number(row.payout_raw) / units;
    const slug = String(row.game || 'unknown').toLowerCase();

    totalBet += bet;
    totalPayout += payout;
    if (payout > bet) wins += 1;
    else losses += 1;

    const profit = payout - bet;
    if (profit > biggestWin) {
      biggestWin = profit;
      biggestWinGame = slug;
    }

    if (!perGame[slug]) perGame[slug] = { bets: 0, wins: 0, betNative: 0, payoutNative: 0 };
    perGame[slug].bets += 1;
    if (payout > bet) perGame[slug].wins += 1;
    perGame[slug].betNative += bet;
    perGame[slug].payoutNative += payout;
  }

  const recent = rows
    .slice(-20)
    .reverse()
    .map((row) => ({
      gameType: row.game,
      betApt: Number(row.bet_raw) / units,
      payoutApt: Number(row.payout_raw) / units,
      result: row.result ?? null,
      timestamp: row.created_at ? new Date(row.created_at).getTime() / 1000 : null,
      proofReference: row.proof_reference ?? null,
    }));

  return NextResponse.json(
    {
      wallet,
      chain: 'solana',
      totalBets: rows.length,
      wins,
      losses,
      winrate: rows.length > 0 ? wins / rows.length : 0,
      totalWageredApt: totalBet,
      totalReturnedApt: totalPayout,
      netProfitApt: totalPayout - totalBet,
      biggestWinApt: biggestWin,
      biggestWinGame,
      perGame: Object.fromEntries(
        Object.entries(perGame).map(([slug, stats]) => [
          slug,
          {
            bets: stats.bets,
            wins: stats.wins,
            winrate: stats.bets > 0 ? stats.wins / stats.bets : 0,
            wageredApt: stats.betNative,
            returnedApt: stats.payoutNative,
            netProfitApt: stats.payoutNative - stats.betNative,
          },
        ]),
      ),
      recent,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    },
  );
}
