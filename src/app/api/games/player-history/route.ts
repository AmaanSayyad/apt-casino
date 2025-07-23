import { NextRequest, NextResponse } from 'next/server';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { normalizeWallet, normalizeWalletForChain } from '@/lib/server/referrals';
import { getPlayChainConfig } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

const GAME_NAMES: Record<number, string> = {
  1: 'plinko',
  2: 'mines',
  3: 'roulette',
  4: 'wheel',
};

const GAME_TYPE_BY_SLUG: Record<string, number> = {
  plinko: 1,
  mines: 2,
  roulette: 3,
  wheel: 4,
};

function networkFromEnv(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  if (n === 'testnet') return Network.TESTNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.MAINNET;
}

/** Per-wallet game rows for a single game slug (Solana via Supabase, Aptos via on-chain log). */
export async function GET(req: NextRequest) {
  const chainParam = (req.nextUrl.searchParams.get('chain') || 'solana').toLowerCase();
  const chainId = chainParam === 'solana' ? 'solana' : 'aptos';
  const game = String(req.nextUrl.searchParams.get('game') || '').toLowerCase();
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 100);
  const wallet = normalizeWalletForChain(req.nextUrl.searchParams.get('wallet'), chainId);

  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }
  if (!game) {
    return NextResponse.json({ error: 'game is required' }, { status: 400 });
  }

  if (chainId === 'solana') {
    return loadSolanaPlayerHistory(wallet, game, limit);
  }

  return loadAptosPlayerHistory(wallet, game, limit);
}

async function loadSolanaPlayerHistory(wallet: string, game: string, limit: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ games: [] });
  }

  const cfg = getPlayChainConfig('solana');
  const units = cfg?.units ?? 1_000_000_000;

  const { data, error } = await supabase
    .from('game_play_events')
    .select('game, bet_raw, payout_raw, result, created_at, proof_reference')
    .eq('wallet', wallet)
    .eq('chain', 'solana')
    .eq('game', game)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const games = (data ?? []).map((row) => ({
    gameType: row.game,
    betApt: Number(row.bet_raw) / units,
    payoutApt: Number(row.payout_raw) / units,
    result: row.result ?? null,
    timestamp: row.created_at ? new Date(row.created_at).getTime() / 1000 : null,
    proofReference: row.proof_reference ?? null,
  }));

  return NextResponse.json(
    { games },
    { headers: { 'Cache-Control': 'private, max-age=15' } },
  );
}

async function loadAptosPlayerHistory(wallet: string, game: string, limit: number) {
  const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;
  if (!moduleAddr) {
    return NextResponse.json({ games: [] });
  }

  const gameType = GAME_TYPE_BY_SLUG[game];
  if (!gameType) {
    return NextResponse.json({ games: [] });
  }

  type RawGame = {
    game_type?: number | string;
    player_address?: string;
    bet_amount?: number | string;
    payout?: number | string;
    result?: string;
    timestamp?: number | string;
  };

  let rows: RawGame[] = [];
  try {
    const aptos = new Aptos(new AptosConfig({ network: networkFromEnv() }));
    const result = await aptos.view({
      payload: {
        function: `${moduleAddr}::game_logger::get_game_history`,
        functionArguments: [moduleAddr],
      },
    });
    rows = ((result?.[0] as RawGame[]) || []).filter((g) => {
      const p = normalizeWallet(String(g.player_address ?? ''));
      return p === wallet && Number(g.game_type || 0) === gameType;
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const OCT = 100_000_000;
  const games = rows
    .slice(-limit)
    .reverse()
    .map((g) => ({
      gameType: GAME_NAMES[Number(g.game_type || 0)] || game,
      betApt: Number(g.bet_amount || 0) / OCT,
      payoutApt: Number(g.payout || 0) / OCT,
      result: g.result ?? null,
      timestamp: g.timestamp != null ? Number(g.timestamp) / 1000 : null,
      proofReference: null,
    }));

  return NextResponse.json(
    { games },
    { headers: { 'Cache-Control': 'private, max-age=30' } },
  );
}
