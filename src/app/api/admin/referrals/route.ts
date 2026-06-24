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
    return NextResponse.json({ error: 'Supabase not configured', rows: [] }, { status: 503 });
  }

  const [leaderboardRes, bannedWallets] = await Promise.all([
    db
      .from('referral_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(200),
    loadBannedWalletKeys(),
  ]);

  const { data: leaderboard, error } = leaderboardRes;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: codes } = await db.from('referral_codes').select('wallet, code, created_at');

  const rows = filterBannedWalletRows(leaderboard ?? [], bannedWallets, (r) => r.wallet).map((r) => {
    const code = filterBannedWalletRows(codes ?? [], bannedWallets, (c) => c.wallet).find(
      (c) => c.wallet === r.wallet,
    );
    return {
      wallet: r.wallet,
      code: code?.code ?? null,
      referrals: r.referrals,
      earnedOctas: Number(r.earned_octas),
      rank: r.rank,
      firstReferralAt: r.first_referral_at,
      lastReferralAt: r.last_referral_at,
    };
  });

  return NextResponse.json({
    rows,
    totalCodes: filterBannedWalletRows(codes ?? [], bannedWallets, (c) => c.wallet).length,
  });
}
