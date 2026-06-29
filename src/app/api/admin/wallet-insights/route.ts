import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { walletAddressSearchVariants } from '@/lib/admin/walletAddressVariants';
import { getWalletAccountStatus, isWalletGloballyBanned } from '@/lib/bans/walletBan';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { getWithdrawFeeBps } from '@/lib/server/platformFees';

export const dynamic = 'force-dynamic';

const BETS_CAP = 5000;
const DEP_CAP = 500;

function rawToNative(chain: string, raw: string | number): number {
  const cfg = getPlayChainConfig(chain);
  const units = cfg?.units ?? 1e9;
  return Number(raw) / units;
}

function aggregateBets(
  rows: {
    chain: string;
    game: string;
    bet_raw: string;
    payout_raw: string;
    currency: string;
    result: string | null;
    created_at: string;
  }[],
) {
  let wins = 0;
  let losses = 0;
  let totalWagered = 0;
  let totalPayout = 0;
  const byChain: Record<
    string,
    { bets: number; wins: number; losses: number; wagered: number; payout: number; net: number; currency: string }
  > = {};
  const byGame: Record<string, { bets: number; wagered: number; payout: number }> = {};

  for (const b of rows) {
    const chain = String(b.chain);
    const bet = rawToNative(chain, b.bet_raw);
    const payout = rawToNative(chain, b.payout_raw);
    totalWagered += bet;
    totalPayout += payout;
    if (payout > bet) wins += 1;
    else if (payout < bet) losses += 1;

    if (!byChain[chain]) {
      byChain[chain] = {
        bets: 0,
        wins: 0,
        losses: 0,
        wagered: 0,
        payout: 0,
        net: 0,
        currency: b.currency || getPlayChainConfig(chain)?.nativeSymbol || chain,
      };
    }
    const c = byChain[chain];
    c.bets += 1;
    c.wagered += bet;
    c.payout += payout;
    c.net += bet - payout;
    if (payout > bet) c.wins += 1;
    else c.losses += 1;

    const g = b.game || 'unknown';
    if (!byGame[g]) byGame[g] = { bets: 0, wagered: 0, payout: 0 };
    byGame[g].bets += 1;
    byGame[g].wagered += bet;
    byGame[g].payout += payout;
  }

  const totalBets = rows.length;
  return {
    totalBets,
    wins,
    losses,
    winRate: totalBets > 0 ? wins / totalBets : 0,
    totalWagered,
    totalPayout,
    netBettingPLUser: totalPayout - totalWagered,
    houseEdgeFromBets: totalWagered - totalPayout,
    byChain,
    byGame,
  };
}

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const raw = new URL(request.url).searchParams.get('address')?.trim() || '';
  if (raw.length < 3) {
    return NextResponse.json({ error: 'address query required (min 3 chars)' }, { status: 400 });
  }

  const variants = walletAddressSearchVariants(raw);
  if (variants.length === 0) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const bannedGlobally = await isWalletGloballyBanned(raw);
  const accountStatus = await getWalletAccountStatus(raw);

  const [
    profileRes,
    balancesRes,
    depositsRes,
    withdrawalsRes,
    betsRes,
    refCodeRes,
    refAsRefereeRes,
    refAsReferrerRes,
    trackedRes,
    otcRes,
    stakingRes,
    rewardsRes,
  ] = await Promise.all([
    db.from('user_profiles').select('*').in('wallet', variants).limit(1),
    db.from('user_house_balances').select('*').in('user_address', variants),
    db
      .from('deposits_log')
      .select('*')
      .in('wallet', variants)
      .order('created_at', { ascending: false })
      .limit(DEP_CAP),
    db
      .from('withdrawal_requests')
      .select('*')
      .in('wallet', variants)
      .order('created_at', { ascending: false })
      .limit(500),
    db
      .from('game_play_events')
      .select('*')
      .in('wallet', variants)
      .order('created_at', { ascending: false })
      .limit(BETS_CAP),
    db.from('referral_codes').select('*').in('wallet', variants).limit(1),
    db.from('referrals').select('*').in('referee_wallet', variants).limit(1),
    db.from('referrals').select('*').in('referrer_wallet', variants).order('attributed_at', { ascending: false }).limit(50),
    db.from('tracked_wallets').select('*').in('wallet', variants).order('last_seen_at', { ascending: false }).limit(5),
    db.from('otc_lottery_entries').select('*').in('sol_sender_wallet', variants).order('created_at', { ascending: false }).limit(20),
    db.from('staking_positions').select('*').in('user_address', variants).order('created_at', { ascending: false }).limit(50),
    db.from('referral_rewards_log').select('*').in('referrer_wallet', variants).order('created_at', { ascending: false }).limit(30),
  ]);

  const profile = profileRes.data?.[0] ?? null;
  const balances = balancesRes.data ?? [];
  const deposits = depositsRes.data ?? [];
  const withdrawals = withdrawalsRes.data ?? [];
  const bets = betsRes.data ?? [];

  const depositsByChain: Record<string, number> = {};
  let depositCount = 0;
  for (const d of deposits) {
    depositCount += 1;
    const sym = getPlayChainConfig(String(d.chain))?.nativeSymbol ?? d.chain;
    depositsByChain[sym] = (depositsByChain[sym] ?? 0) + Number(d.amount_native);
  }

  const withdrawalsByChain: Record<string, number> = {};
  let completedWd = 0;
  let pendingWd = 0;
  for (const w of withdrawals) {
    const sym = getPlayChainConfig(String(w.chain))?.nativeSymbol ?? w.chain;
    if (w.status === 'completed') {
      completedWd += 1;
      withdrawalsByChain[sym] = (withdrawalsByChain[sym] ?? 0) + Number(w.gross_apt);
    } else if (w.status === 'pending') pendingWd += 1;
  }

  const betting = aggregateBets(bets);
  const withdrawFeeBps = getWithdrawFeeBps();

  const balanceRows = balances.map((b) => {
    const bal = rawToNative(String(b.chain), b.balance_raw);
    const canWithdraw =
      !bannedGlobally && accountStatus === 'active' ? bal : 0;
    return {
      chain: b.chain,
      currency: b.currency,
      balance: bal,
      status: accountStatus,
      updatedAt: b.updated_at,
      withdrawableNow: canWithdraw,
    };
  });

  const tracked = trackedRes.data ?? [];
  const firstSeen =
    tracked.length > 0
      ? tracked.reduce((a, t) => (t.first_seen_at < a ? t.first_seen_at : a), tracked[0].first_seen_at)
      : null;
  const lastSeen =
    tracked.length > 0
      ? tracked.reduce((a, t) => (t.last_seen_at > a ? t.last_seen_at : a), tracked[0].last_seen_at)
      : null;

  const totalDeposited = Object.values(depositsByChain).reduce((s, n) => s + n, 0);
  const totalWithdrawn = Object.values(withdrawalsByChain).reduce((s, n) => s + n, 0);
  const totalBalance = balanceRows.reduce((s, b) => s + b.balance, 0);
  const playerPnL = totalWithdrawn + totalBalance - totalDeposited;

  return NextResponse.json({
    query: raw,
    variantsUsed: variants,
    bannedGlobally,
    accountStatus,
    profile,
    balances: balanceRows,
    timeOnPlatform: {
      totalSessions: tracked.length,
      firstSeen,
      lastSeen,
      chains: [...new Set(tracked.map((t) => t.chain))],
    },
    aggregates: {
      financial: {
        depositCount,
        withdrawalCount: withdrawals.length,
        completedWithdrawals: completedWd,
        pendingWithdrawals: pendingWd,
        totalDepositsByCurrency: depositsByChain,
        totalWithdrawalsByCurrency: withdrawalsByChain,
        totalDeposited,
        totalWithdrawn,
        totalHouseBalance: totalBalance,
        playerPnL,
        housePnL: -playerPnL,
        platformFeeBpsWithdraw: withdrawFeeBps,
      },
      betting: {
        ...betting,
        betsTruncated: bets.length >= BETS_CAP,
        betsCappedAt: BETS_CAP,
      },
      withdrawals: {
        pending: withdrawals.filter((w) => w.status === 'pending'),
        completed: withdrawals.filter((w) => w.status === 'completed'),
        rejected: withdrawals.filter((w) => w.status === 'rejected'),
      },
      summary: {
        netBettingProfitLoss: betting.netBettingPLUser,
        houseEdgeFromBets: betting.houseEdgeFromBets,
      },
    },
    referral: {
      code: refCodeRes.data?.[0]?.code ?? null,
      asReferee: refAsRefereeRes.data?.[0] ?? null,
      referralsMade: refAsReferrerRes.data?.length ?? 0,
      referrals: refAsReferrerRes.data ?? [],
      rewardsLog: rewardsRes.data ?? [],
    },
    staking: {
      positions: stakingRes.data ?? [],
      active: (stakingRes.data ?? []).filter((p) => p.status === 'active').length,
    },
    otcEntries: otcRes.data ?? [],
    recentDeposits: deposits.slice(0, 40),
    depositHistory: deposits,
    recentBets: bets.slice(0, 80).map((b) => ({
      ...b,
      betNative: rawToNative(b.chain, b.bet_raw),
      payoutNative: rawToNative(b.chain, b.payout_raw),
      won: Number(b.payout_raw) > Number(b.bet_raw),
    })),
    withdrawalHistory: withdrawals,
  });
}
