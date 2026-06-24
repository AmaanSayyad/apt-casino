import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { walletAddressSearchVariants, normalizeWalletForBanKey } from '@/lib/admin/walletAddressVariants';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { getWalletAccountStatus, loadBannedWalletKeys, walletMatchesBanSet } from '@/lib/bans/walletBan';

export const dynamic = 'force-dynamic';

const FREQUENCY_THRESHOLD = 10;
const WIN_STREAK_THRESHOLD = 10;
const PAGE = 2000;

function rawToNative(chain: string, raw: string | number): number {
  const cfg = getPlayChainConfig(chain);
  return Number(raw) / (cfg?.units ?? 1e9);
}

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const [{ data: allBets }, { data: completedWd }, { data: pendingWd }, { data: deposits }, { data: balances }, bannedWallets] =
    await Promise.all([
      db.from('game_play_events').select('wallet, chain, bet_raw, payout_raw, created_at').order('created_at', { ascending: false }).limit(PAGE),
      db.from('withdrawal_requests').select('wallet, chain, gross_apt, status, created_at').eq('status', 'completed'),
      db.from('withdrawal_requests').select('id, wallet, chain, gross_apt, usd_estimate, status, created_at').eq('status', 'pending'),
      db.from('deposits_log').select('wallet, chain, amount_native'),
      db.from('user_house_balances').select('user_address, chain, balance_raw'),
      loadBannedWalletKeys(),
    ]);

  const userBets: Record<string, boolean[]> = {};
  for (const b of allBets ?? []) {
    const w = String(b.wallet);
    if (walletMatchesBanSet(w, bannedWallets)) continue;
    if (!userBets[w]) userBets[w] = [];
    const bet = rawToNative(b.chain, b.bet_raw);
    const payout = rawToNative(b.chain, b.payout_raw);
    userBets[w].push(payout > bet);
  }

  const suspiciousUsers: {
    wallet: string;
    maxStreak: number;
    latestBets: boolean[];
    accountStatus: string;
    totalBalance: number;
  }[] = [];

  for (const [wallet, results] of Object.entries(userBets)) {
    let current = 0;
    let maxStreak = 0;
    for (const won of results) {
      if (won) {
        current += 1;
        maxStreak = Math.max(maxStreak, current);
      } else {
        current = 0;
      }
    }
    if (maxStreak >= WIN_STREAK_THRESHOLD) {
      const status = await getWalletAccountStatus(wallet);
      const bal =
        (balances ?? [])
          .filter((b) => b.user_address === wallet)
          .reduce((s, b) => s + rawToNative(b.chain, b.balance_raw), 0) ?? 0;
      suspiciousUsers.push({
        wallet,
        maxStreak,
        latestBets: results.slice(0, 10),
        accountStatus: status,
        totalBalance: bal,
      });
    }
  }

  type WdStats = {
    wallet: string;
    completed: number;
    pending: number;
    totalWithdrawn: number;
    pendingAmount: number;
    pendingRequests: Record<string, unknown>[];
  };

  const wdMap: Record<string, WdStats> = {};
  const norm = (w: string) => normalizeWalletForBanKey(w);

  for (const r of completedWd ?? []) {
    if (walletMatchesBanSet(r.wallet, bannedWallets)) continue;
    const k = norm(r.wallet);
    if (!wdMap[k]) {
      wdMap[k] = { wallet: r.wallet, completed: 0, pending: 0, totalWithdrawn: 0, pendingAmount: 0, pendingRequests: [] };
    }
    wdMap[k].completed += 1;
    wdMap[k].totalWithdrawn += Number(r.gross_apt);
  }

  for (const r of pendingWd ?? []) {
    if (walletMatchesBanSet(r.wallet, bannedWallets)) continue;
    const k = norm(r.wallet);
    if (!wdMap[k]) {
      wdMap[k] = { wallet: r.wallet, completed: 0, pending: 0, totalWithdrawn: 0, pendingAmount: 0, pendingRequests: [] };
    }
    wdMap[k].pending += 1;
    wdMap[k].pendingAmount += Number(r.gross_apt);
    wdMap[k].pendingRequests.push(r);
  }

  const frequencyUsers: {
    wallet: string;
    totalWithdrawals: number;
    completedWithdrawals: number;
    pendingWithdrawals: number;
    totalWithdrawn: number;
    pendingAmount: number;
    totalDeposited: number;
    totalAvailableBalance: number;
    netPnl: number;
    pendingRequests: Record<string, unknown>[];
    accountStatus: string;
  }[] = [];

  for (const stats of Object.values(wdMap)) {
    const total = stats.completed + stats.pending;
    if (total < FREQUENCY_THRESHOLD) continue;

    const variants = walletAddressSearchVariants(stats.wallet);
    const deposited = (deposits ?? [])
      .filter((d) => variants.includes(d.wallet) || norm(d.wallet) === norm(stats.wallet))
      .reduce((s, d) => s + Number(d.amount_native), 0);
    const avail = (balances ?? [])
      .filter((b) => variants.includes(b.user_address) || norm(b.user_address) === norm(stats.wallet))
      .reduce((s, b) => s + rawToNative(b.chain, b.balance_raw), 0);
    const netPnl = stats.totalWithdrawn + avail - deposited;
    const accountStatus = await getWalletAccountStatus(stats.wallet);

    frequencyUsers.push({
      wallet: stats.wallet,
      totalWithdrawals: total,
      completedWithdrawals: stats.completed,
      pendingWithdrawals: stats.pending,
      totalWithdrawn: stats.totalWithdrawn,
      pendingAmount: stats.pendingAmount,
      totalDeposited: deposited,
      totalAvailableBalance: avail,
      netPnl,
      pendingRequests: stats.pendingRequests,
      accountStatus,
    });
  }

  frequencyUsers.sort((a, b) => b.totalWithdrawals - a.totalWithdrawals);
  suspiciousUsers.sort((a, b) => b.maxStreak - a.maxStreak);

  return NextResponse.json({
    frequencyUsers,
    suspiciousUsers,
    frequencyThreshold: FREQUENCY_THRESHOLD,
    winStreakThreshold: WIN_STREAK_THRESHOLD,
  });
}
