import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';

import { filterBannedWalletRows, loadBannedWalletKeys } from '@/lib/bans/walletBan';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured', leaders: [], recent: [] }, { status: 503 });
  }

  const missingTable = (message: string) =>
    /wallet_daily_streaks|daily_streak_claims|does not exist/i.test(message);

  const bannedWallets = await loadBannedWalletKeys();

  const [leadersRes, recentRes] = await Promise.allSettled([
    db
      .from('wallet_daily_streaks')
      .select('wallet, chain, current_streak, longest_streak, total_aptc_claimed')
      .order('total_aptc_claimed', { ascending: false })
      .limit(200),
    db
      .from('daily_streak_claims')
      .select('id, wallet, chain, streak_day, reward_aptc, claim_tx_hash, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  let leaders: any[] = [];
  let recent: any[] = [];

  if (leadersRes.status === 'fulfilled') {
    leaders = filterBannedWalletRows(
      leadersRes.value.data ?? [],
      bannedWallets,
      (r) => r.wallet,
    ).map((r) => ({
        wallet: r.wallet,
        chain: String(r.chain || '').toLowerCase() || null,
        currentStreak: Number(r.current_streak ?? 0),
        longestStreak: Number(r.longest_streak ?? 0),
        totalAptcClaimed: Number(r.total_aptc_claimed ?? 0),
      }));
  } else if (!missingTable(String(leadersRes.reason?.message ?? leadersRes.reason))) {
    return NextResponse.json({ error: 'Failed loading daily streak leaders' }, { status: 500 });
  }

  if (recentRes.status === 'fulfilled') {
    recent = filterBannedWalletRows(
      recentRes.value.data ?? [],
      bannedWallets,
      (r) => r.wallet,
    ).map((r) => ({
        id: r.id,
        wallet: r.wallet,
        chain: String(r.chain || '').toLowerCase() || null,
        streakDay: Number(r.streak_day ?? 0),
        rewardAptc: Number(r.reward_aptc ?? 0),
        claimTxHash: r.claim_tx_hash ?? null,
        createdAt: r.created_at,
      }));
  } else if (!missingTable(String(recentRes.reason?.message ?? recentRes.reason))) {
    return NextResponse.json({ error: 'Failed loading recent daily streak claims' }, { status: 500 });
  }

  return NextResponse.json({ leaders, recent });
}

