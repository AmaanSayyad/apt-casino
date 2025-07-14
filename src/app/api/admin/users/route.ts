import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getPlayChainConfig } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured', users: [] }, { status: 503 });
  }

  const [{ data: balances }, { data: events }] = await Promise.all([
    db.from('user_house_balances').select('user_address, chain, currency, balance_raw, updated_at'),
    db.from('game_play_events').select('wallet, chain, bet_raw, payout_raw'),
  ]);

  const activity = new Map<string, { bets: number; volume: number; wins: number }>();
  for (const e of events ?? []) {
    const key = `${e.wallet}|${e.chain}`;
    const cfg = getPlayChainConfig(String(e.chain));
    const units = cfg?.units ?? 1e9;
    const bet = Number(e.bet_raw) / units;
    const payout = Number(e.payout_raw) / units;
    const cur = activity.get(key) ?? { bets: 0, volume: 0, wins: 0 };
    cur.bets += 1;
    cur.volume += bet;
    if (payout > bet) cur.wins += 1;
    activity.set(key, cur);
  }

  const { data: codes } = await db.from('referral_codes').select('wallet, code');
  const codeByWallet = new Map((codes ?? []).map((c) => [c.wallet, c.code]));

  const { data: refCounts } = await db.from('referrals').select('referrer_wallet').eq('is_valid', true);
  const refByWallet = new Map<string, number>();
  for (const r of refCounts ?? []) {
    const w = r.referrer_wallet;
    refByWallet.set(w, (refByWallet.get(w) ?? 0) + 1);
  }

  const users = (balances ?? []).map((b) => {
    const cfg = getPlayChainConfig(String(b.chain));
    const units = cfg?.units ?? 1e9;
    const key = `${b.user_address}|${b.chain}`;
    const act = activity.get(key) ?? { bets: 0, volume: 0, wins: 0 };
    return {
      userAddress: b.user_address,
      chain: b.chain,
      currency: b.currency,
      balance: Number(b.balance_raw) / units,
      updatedAt: b.updated_at,
      activity: act,
      referralCode: codeByWallet.get(b.user_address) ?? null,
      referralCount: refByWallet.get(b.user_address) ?? 0,
    };
  });

  users.sort((a, b) => b.balance - a.balance);

  return NextResponse.json({ users });
}
