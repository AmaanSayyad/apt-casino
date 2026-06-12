import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { octasToApt } from '@/lib/server/aptTreasury';

export const dynamic = 'force-dynamic';

/**
 * Public referral leaderboard — no wallet required.
 * Ranks by total people invited; also exposes validated (first-deposit) counts.
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

  const [boardRes, totalInvitesRes, totalValidRes, codesRes] = await Promise.all([
    supabase
      .from('referral_leaderboard')
      .select(
        'wallet, total_referrals, referrals, earned_octas, rank, first_referral_at, last_referral_at',
      )
      .order('rank', { ascending: true })
      .limit(limit),
    supabase.from('referrals').select('referee_wallet', { count: 'exact', head: true }),
    supabase.from('referrals').select('referee_wallet', { count: 'exact', head: true }).eq('is_valid', true),
    supabase.from('referral_codes').select('wallet, code'),
  ]);

  let rows = boardRes.data ?? [];
  if (boardRes.error) {
    const fallback = await supabase
      .from('referral_leaderboard')
      .select('wallet, referrals, earned_octas, rank, first_referral_at, last_referral_at')
      .order('rank', { ascending: true })
      .limit(limit);
    if (fallback.error) {
      return NextResponse.json(
        { error: 'Failed to load leaderboard', detail: fallback.error.message },
        { status: 500 },
      );
    }
    rows = (fallback.data ?? []).map((row) => ({
      ...row,
      total_referrals: row.referrals,
    }));
  }

  const codeByWallet = new Map((codesRes.data ?? []).map((row) => [row.wallet, row.code]));

  return NextResponse.json(
    {
      totalInvites: Number(totalInvitesRes.count ?? 0),
      totalValidReferrals: Number(totalValidRes.count ?? 0),
      entries:
        rows.map((row) => ({
          wallet: row.wallet,
          code: codeByWallet.get(row.wallet) ?? null,
          totalReferrals: row.total_referrals ?? row.referrals ?? 0,
          validReferrals: row.referrals ?? 0,
          referrals: row.referrals ?? 0,
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
