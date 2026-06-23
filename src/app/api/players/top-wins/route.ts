import { NextRequest, NextResponse } from 'next/server';
import {
  fetchGameHistory,
  readPlayerAddress,
  shortenWallet,
  u64,
  u8,
  GAME_TYPE_TO_SLUG,
  OCTAS,
} from '@/lib/server/gameHistory';
import {
  aggregateTopWinsFromPlayEvents,
  type TopWinRow,
} from '@/lib/server/gamePlayEvents';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { loadBannedWalletKeys, walletMatchesBanSet } from '@/lib/bans/walletBan';

export const dynamic = 'force-dynamic';

const GAME_LABEL: Record<string, string> = {
  plinko: 'Plinko',
  mines: 'Mines',
  roulette: 'Roulette',
  wheel: 'Spin Wheel',
};

function aptosRowsFromGames(
  games: Record<string, unknown>[],
  sinceSec: bigint | null,
  top: number,
  bannedWallets: Set<string>,
): TopWinRow[] {
  type WalletAgg = {
    bets: number;
    wins: number;
    biggestWinOctas: bigint;
    biggestWinTs: bigint;
    biggestWinGame: string;
    gameCounts: Record<string, number>;
  };
  const byWallet = new Map<string, WalletAgg>();

  for (const g of games) {
    const ts = u64(g, 'timestamp');
    if (sinceSec !== null && ts < sinceSec) continue;

    const player = readPlayerAddress(g);
    if (!player || walletMatchesBanSet(player, bannedWallets)) continue;

    const bet = u64(g, 'bet_amount');
    const payout = u64(g, 'payout');
    const profit = payout - bet;

    const slug = GAME_TYPE_TO_SLUG[u8(g, 'game_type')] || 'plinko';
    const agg = byWallet.get(player) || {
      bets: 0,
      wins: 0,
      biggestWinOctas: 0n,
      biggestWinTs: 0n,
      biggestWinGame: slug,
      gameCounts: {},
    };
    agg.bets += 1;
    agg.gameCounts[slug] = (agg.gameCounts[slug] || 0) + 1;
    if (profit > 0n) {
      agg.wins += 1;
      if (profit > agg.biggestWinOctas) {
        agg.biggestWinOctas = profit;
        agg.biggestWinTs = ts;
        agg.biggestWinGame = slug;
      }
    }
    byWallet.set(player, agg);
  }

  const symbol = getPlayChainConfig('aptos')?.nativeSymbol ?? 'APT';

  return [...byWallet.entries()]
    .filter(([, v]) => v.biggestWinOctas > 0n)
    .map(([wallet, v]) => {
      const favoriteSlug = Object.entries(v.gameCounts).reduce(
        (best, cur) => (cur[1] > best[1] ? cur : best),
        ['plinko', 0] as [string, number],
      )[0];
      const biggestWinNative = Number(v.biggestWinOctas) / Number(OCTAS);
      return {
        wallet,
        walletShort: shortenWallet(wallet),
        chain: 'aptos' as const,
        biggestWinNative,
        biggestWinDisplay: `${biggestWinNative.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${symbol}`,
        biggestWinApt: biggestWinNative,
        biggestWinGame: v.biggestWinGame,
        biggestWinGameLabel: GAME_LABEL[v.biggestWinGame] || v.biggestWinGame,
        biggestWinAt: Number(v.biggestWinTs),
        favoriteGame: favoriteSlug,
        favoriteGameLabel: GAME_LABEL[favoriteSlug] || favoriteSlug,
        bets: v.bets,
        wins: v.wins,
      };
    })
    .sort((a, b) => b.biggestWinNative - a.biggestWinNative)
    .slice(0, top);
}

function mergeTopWins(aptosRows: TopWinRow[], supabaseRows: TopWinRow[], top: number): TopWinRow[] {
  const merged = new Map<string, TopWinRow>();

  for (const row of [...aptosRows, ...supabaseRows]) {
    const key = `${row.chain}:${row.wallet}`;
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, { ...row });
      continue;
    }
    prev.bets += row.bets;
    prev.wins += row.wins;
    if (row.biggestWinNative > prev.biggestWinNative) {
      prev.biggestWinNative = row.biggestWinNative;
      prev.biggestWinDisplay = row.biggestWinDisplay;
      prev.biggestWinApt = row.biggestWinApt;
      prev.biggestWinGame = row.biggestWinGame;
      prev.biggestWinGameLabel = row.biggestWinGameLabel;
      prev.biggestWinAt = row.biggestWinAt;
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.biggestWinNative - a.biggestWinNative)
    .slice(0, top);
}

/**
 * Top wins per wallet from Aptos game_logger and Supabase game_play_events (Solana + others).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const top = Math.min(parseInt(searchParams.get('top') || '12', 10) || 12, 50);
    const sinceParam = searchParams.get('sinceSec');
    const sinceSec = sinceParam ? BigInt(sinceParam) : null;
    const sinceMs = sinceSec !== null ? Number(sinceSec) * 1000 : null;

    const [{ games, moduleAddress }, supabaseRows, bannedWallets] = await Promise.all([
      fetchGameHistory().catch(() => ({ games: [] as Record<string, unknown>[], moduleAddress: null })),
      aggregateTopWinsFromPlayEvents(top * 2, sinceMs),
      loadBannedWalletKeys(),
    ]);

    const aptosRows = moduleAddress ? aptosRowsFromGames(games, sinceSec, top * 2, bannedWallets) : [];
    const rows = mergeTopWins(aptosRows, supabaseRows, top).filter(
      (row) => !walletMatchesBanSet(row.wallet, bannedWallets),
    );

    return NextResponse.json({
      wins: rows,
      moduleConfigured: Boolean(moduleAddress) || supabaseRows.length > 0,
      totalGames: games.length + supabaseRows.reduce((s, r) => s + r.bets, 0),
      sources: {
        aptosOnChain: games.length,
        supabasePlayEvents: supabaseRows.length > 0,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('top-wins:', e);
    return NextResponse.json({ wins: [], error: message }, { status: 500 });
  }
}
