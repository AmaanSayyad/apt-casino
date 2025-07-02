import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getPlayChainConfig } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

const PAGE = 1000;

const GAME_LABELS: Record<string, string> = {
  roulette: 'Roulette',
  mines: 'Mines',
  plinko: 'Plinko',
  wheel: 'Wheel',
  slots: 'Slots',
  dice: 'Dice',
};

function rawToNative(chain: string, raw: string | number): number {
  const cfg = getPlayChainConfig(chain);
  return Number(raw) / (cfg?.units ?? 1e9);
}

type ModeStat = {
  mode: string;
  label: string;
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalWagered: number;
  totalPaidOut: number;
  housePnL: number;
  byChain: Record<
    string,
    { totalBets: number; wins: number; totalWagered: number; totalPaidOut: number; housePnL: number }
  >;
  topAssets: { asset: string; count: number }[];
};

function computeModes(
  rows: {
    chain: string;
    game: string;
    bet_raw: string;
    payout_raw: string;
    currency: string;
    result: string | null;
  }[],
): ModeStat[] {
  const map: Record<
    string,
    {
      bets: number;
      wins: number;
      wagered: number;
      paid: number;
      byChain: Record<string, { bets: number; wins: number; wagered: number; paid: number }>;
      assetCount: Record<string, number>;
    }
  > = {};

  for (const r of rows) {
    const mode = String(r.game || 'unknown').toLowerCase();
    if (!map[mode]) {
      map[mode] = { bets: 0, wins: 0, wagered: 0, paid: 0, byChain: {}, assetCount: {} };
    }
    const m = map[mode];
    const bet = rawToNative(r.chain, r.bet_raw);
    const payout = rawToNative(r.chain, r.payout_raw);
    const won = payout > bet || r.result === 'win';

    m.bets += 1;
    if (won) m.wins += 1;
    m.wagered += bet;
    m.paid += payout;

    const chain = String(r.chain || 'unknown');
    if (!m.byChain[chain]) m.byChain[chain] = { bets: 0, wins: 0, wagered: 0, paid: 0 };
    const c = m.byChain[chain];
    c.bets += 1;
    if (won) c.wins += 1;
    c.wagered += bet;
    c.paid += payout;

    const asset = String(r.currency || chain).toUpperCase();
    m.assetCount[asset] = (m.assetCount[asset] ?? 0) + 1;
  }

  return Object.entries(map)
    .map(([mode, m]) => {
      const byChain: ModeStat['byChain'] = {};
      for (const [chain, c] of Object.entries(m.byChain)) {
        byChain[chain] = {
          totalBets: c.bets,
          wins: c.wins,
          totalWagered: c.wagered,
          totalPaidOut: c.paid,
          housePnL: c.wagered - c.paid,
        };
      }
      const topAssets = Object.entries(m.assetCount)
        .map(([asset, count]) => ({ asset, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      return {
        mode,
        label: GAME_LABELS[mode] ?? mode.charAt(0).toUpperCase() + mode.slice(1),
        totalBets: m.bets,
        wins: m.wins,
        losses: m.bets - m.wins,
        winRate: m.bets > 0 ? Math.round((m.wins / m.bets) * 1000) / 10 : 0,
        totalWagered: m.wagered,
        totalPaidOut: m.paid,
        housePnL: m.wagered - m.paid,
        byChain,
        topAssets,
      };
    })
    .sort((a, b) => b.totalBets - a.totalBets);
}

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured', modes: [] }, { status: 503 });
  }

  const rows: {
    chain: string;
    game: string;
    bet_raw: string;
    payout_raw: string;
    currency: string;
    result: string | null;
  }[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from('game_play_events')
      .select('chain, game, bet_raw, payout_raw, currency, result')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
    from += PAGE;
  }

  const modes = computeModes(rows);
  const totalBets = rows.length;

  return NextResponse.json({
    modes,
    totalBets,
    totalRounds: totalBets,
  });
}
