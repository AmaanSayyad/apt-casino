import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  aggregateCupStandings,
  buildRegisteredWindows,
  findWalletRank,
  isWalletRegistered,
} from '@/lib/server/competitionVolume';
import { normalizeWalletForChain } from '@/lib/server/referrals';

export const dynamic = 'force-dynamic';

function isoToUnixSec(iso: string): bigint {
  return BigInt(Math.floor(new Date(iso).getTime() / 1000));
}

function includedSet(row: { included_games?: string[] | null }): Set<string> {
  const all = ['plinko', 'mines', 'roulette', 'wheel'] as const;
  if (!row.included_games?.length) return new Set(all);
  return new Set(row.included_games.map((g) => String(g).toLowerCase()));
}

/**
 * Live volume contest = `competition_mode='volume'`, `status in (live, open)`,
 * now ∈ [starts_at, ends_at]. Standings are restricted to **registered wallets**
 * only — each wallet's window starts at max(contest.starts_at, registered_at).
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      competition: null,
      standings: [],
      supabaseConfigured: false,
      message: 'Set SUPABASE_SERVICE_ROLE_KEY and run tournament migrations.',
    });
  }

  const { searchParams } = new URL(request.url);
  const chainParam = (searchParams.get('chain') || 'aptos').toLowerCase();
  const chain = chainParam === 'solana' ? 'solana' : 'aptos';
  const wallet = normalizeWalletForChain(searchParams.get('wallet'), chain) || '';
  const topN = Math.min(parseInt(searchParams.get('top') || '50', 10) || 50, 200);

  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from('tournaments')
    .select(
      'id, name, game, prize_pool_apt, entry_fee_apt, max_participants, starts_at, ends_at, included_games, competition_mode, status, rewards_distributed_at, notes',
    )
    .eq('competition_mode', 'volume')
    .in('status', ['live', 'open'])
    .lte('starts_at', nowIso)
    .order('starts_at', { ascending: false })
    .limit(8);

  if (error) {
    return NextResponse.json({ competition: null, standings: [], error: error.message }, { status: 500 });
  }

  const active = (rows ?? []).find((r) => r.ends_at && new Date(r.ends_at).getTime() >= Date.now());
  if (!active) {
    return NextResponse.json({
      competition: null,
      standings: [],
      message:
        'No live volume competition. Insert a tournament row with competition_mode=volume, status=live, starts_at <= now <= ends_at.',
    });
  }

  const contestStartSec = isoToUnixSec(active.starts_at);
  const contestEndSec = isoToUnixSec(active.ends_at);
  if (contestEndSec < contestStartSec) {
    return NextResponse.json(
      { competition: null, standings: [], error: 'Invalid tournament window' },
      { status: 400 },
    );
  }

  const { data: regs, error: regErr } = await supabase
    .from('tournament_registrations')
    .select('wallet, registered_at')
    .eq('tournament_id', active.id);

  if (regErr) {
    return NextResponse.json({ competition: null, standings: [], error: regErr.message }, { status: 500 });
  }

  const windows = buildRegisteredWindows(regs ?? [], contestStartSec, contestEndSec);
  const isRegistered = wallet ? isWalletRegistered(windows, wallet, chain) : false;
  const participantCount = windows.size;

  const slugs = includedSet(active);
  const fullStandings = await aggregateCupStandings(windows, slugs);
  const standings = fullStandings.slice(0, topN).map((r, i) => ({
    rank: i + 1,
    wallet: r.wallet,
    walletShort: r.walletShort,
    volumeApt: r.volumeApt,
    bets: r.bets,
  }));

  let yourRank: number | null = null;
  let yourVolumeApt = 0;
  let yourBets = 0;
  if (wallet && isRegistered) {
    const yours = findWalletRank(fullStandings, wallet, chain);
    if (yours) {
      yourRank = yours.rank;
      yourVolumeApt = yours.volume;
      yourBets = yours.bets;
    }
  }

  return NextResponse.json({
    competition: {
      id: active.id,
      name: active.name,
      displayGame: active.game,
      prizePoolApt: Number(active.prize_pool_apt) || 0,
      prizePoolAptc: Number(active.prize_pool_apt) || 0,
      entryFeeApt: Number(active.entry_fee_apt) || 0,
      entryFeeAptc: Number(active.entry_fee_apt) || 0,
      currency: 'APTC',
      maxParticipants: active.max_participants,
      participantCount,
      startsAt: active.starts_at,
      endsAt: active.ends_at,
      includedGames: [...slugs],
      status: active.status,
      rewardsDistributedAt: active.rewards_distributed_at,
      notes: active.notes,
    },
    standings,
    isRegistered,
    yourRank,
    yourVolumeApt,
    yourBets,
    supabaseConfigured: true,
    rewardLogic:
      'Register with APTC entry fee on Solana. After registering, wager volume on qualifying games counts toward the leaderboard. Top wallets share the APTC prize pool — admin manually approves and records prize payouts after the contest ends.',
  });
}
