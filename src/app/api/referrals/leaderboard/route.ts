import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { octasToApt } from '@/lib/server/aptTreasury';

export const dynamic = 'force-dynamic';

/**
 * Public leaderboard — VALID referrals only (referees who made their first deposit).
 * Each row exposes both the count and the cumulative APT earned from the fee split.
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  const limitParam = Number(req.nextUrl.searchParams.get('limit'));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 200
      ? Math.floor(limitParam)
      : 50;

  const [boardRes, totalRes] = await Promise.all([
    supabase
      .from('referral_leaderboard')
      .select('wallet, referrals, earned_octas, rank, first_referral_at, last_referral_at')
      .order('rank', { ascending: true })
      .limit(limit),
    supabase
      .from('referrals')
      .select('referee_wallet', { count: 'exact', head: true })
      .eq('is_valid', true),
  ]);

  if (boardRes.error) {
    return NextResponse.json(
      { error: 'Failed to load leaderboard', detail: boardRes.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      totalValidReferrals: Number(totalRes.count ?? 0),
      entries:
        boardRes.data?.map((row) => ({
          wallet: row.wallet,
          referrals: row.referrals,
          earnedOctas: String(row.earned_octas ?? 0),
          earnedApt: octasToApt(Number(row.earned_octas ?? 0)),
          rank: row.rank,
          first_referral_at: row.first_referral_at,
          last_referral_at: row.last_referral_at,
        })) ?? [],
    },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
  );
}
