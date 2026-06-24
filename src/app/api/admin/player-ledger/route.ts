import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { filterBannedWalletRows, loadBannedWalletKeys } from '@/lib/bans/walletBan';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured', rows: [] }, { status: 503 });
  }

  const [{ data: deposits }, { data: withdrawals }, { data: balances }, { data: events }, { data: tracked }, bannedWallets] =
    await Promise.all([
    db.from('deposits_log').select('wallet, chain, amount_native, created_at'),
    db.from('withdrawal_requests').select('wallet, chain, gross_apt, status, created_at'),
    db.from('user_house_balances').select('user_address, chain, currency, balance_raw'),
    db.from('game_play_events').select('wallet, chain, bet_raw, payout_raw'),
    db.from('tracked_wallets').select('wallet, chain, first_seen_at'),
    loadBannedWalletKeys(),
  ]);

  type Row = {
    wallet: string;
    chain: string;
    currency: string;
    deposited: number;
    withdrawn: number;
    balance: number;
    bets: number;
    wagered: number;
    wins: number;
    firstDepositAt: string | null;
    joinedAt: string | null;
    withdrawableNow: number;
  };

  const map = new Map<string, Row>();

  const keyOf = (wallet: string, chain: string) => `${wallet}|${chain}`;

  const ensure = (wallet: string, chain: string) => {
    const k = keyOf(wallet, chain);
    if (!map.has(k)) {
      const sym = getPlayChainConfig(chain)?.nativeSymbol ?? chain.toUpperCase();
      map.set(k, {
        wallet,
        chain,
        currency: sym,
        deposited: 0,
        withdrawn: 0,
        balance: 0,
        bets: 0,
        wagered: 0,
        wins: 0,
        firstDepositAt: null,
        joinedAt: null,
        withdrawableNow: 0,
      });
    }
    return map.get(k)!;
  };

  for (const t of filterBannedWalletRows(tracked ?? [], bannedWallets, (r) => r.wallet)) {
    const row = ensure(t.wallet, t.chain);
    if (!row.joinedAt || t.first_seen_at < row.joinedAt) {
      row.joinedAt = t.first_seen_at;
    }
  }

  for (const d of filterBannedWalletRows(deposits ?? [], bannedWallets, (r) => r.wallet)) {
    const row = ensure(d.wallet, d.chain);
    row.deposited += Number(d.amount_native);
    if (!row.firstDepositAt || d.created_at < row.firstDepositAt) {
      row.firstDepositAt = d.created_at;
    }
    if (!row.joinedAt || d.created_at < row.joinedAt) {
      row.joinedAt = d.created_at;
    }
  }

  for (const w of filterBannedWalletRows(withdrawals ?? [], bannedWallets, (r) => r.wallet)) {
    if (w.status === 'completed') {
      const row = ensure(w.wallet, w.chain);
      row.withdrawn += Number(w.gross_apt);
    }
  }

  for (const b of filterBannedWalletRows(balances ?? [], bannedWallets, (r) => r.user_address)) {
    const cfg = getPlayChainConfig(String(b.chain));
    const units = cfg?.units ?? 1e9;
    const row = ensure(b.user_address, b.chain);
    row.balance = Number(b.balance_raw) / units;
    row.withdrawableNow = row.balance;
  }

  for (const e of filterBannedWalletRows(events ?? [], bannedWallets, (r) => r.wallet)) {
    const cfg = getPlayChainConfig(String(e.chain));
    const units = cfg?.units ?? 1e9;
    const row = ensure(e.wallet, e.chain);
    const bet = Number(e.bet_raw) / units;
    const payout = Number(e.payout_raw) / units;
    row.bets += 1;
    row.wagered += bet;
    if (payout > bet) row.wins += 1;
  }

  const rows = [...map.values()].map((r) => {
    const playerPnL = r.withdrawn + r.balance - r.deposited;
    const housePnL = -playerPnL;
    const winRate = r.bets > 0 ? (r.wins / r.bets) * 100 : 0;
    const depositFeeBps = Number(process.env.PLATFORM_FEE_BPS_DEPOSIT) || 1000;
    const withdrawFeeBps = Number(process.env.PLATFORM_FEE_BPS_WITHDRAW) || 1000;
    const feesPaid =
      (r.deposited * depositFeeBps) / 10_000 + (r.withdrawn * withdrawFeeBps) / 10_000;
    return { ...r, playerPnL, housePnL, winRate, feesPaid };
  });

  rows.sort((a, b) => b.wagered - a.wagered);

  return NextResponse.json({ rows });
}
