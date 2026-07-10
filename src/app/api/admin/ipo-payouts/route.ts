import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  fetchAffiliateRewardQueue,
  fetchAffiliateWithdrawalQueue,
  fetchStakingRewardQueue,
} from '@/lib/server/ipo/payouts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const filter = request.nextUrl.searchParams.get('filter') || 'due';

  const [stakingRewards, affiliateRewards, affiliateWithdrawals] = await Promise.all([
    fetchStakingRewardQueue(db),
    fetchAffiliateRewardQueue(db),
    fetchAffiliateWithdrawalQueue(db),
  ]);

  const stakingDue = stakingRewards.filter((r) => r.due);
  const affiliateDue = affiliateRewards.filter((r) => r.due);
  const stakingUpcoming = stakingRewards.filter((r) => !r.due);
  const affiliateUpcoming = affiliateRewards.filter((r) => !r.due);

  const stakingAptcDue = stakingDue.reduce((s, r) => s + r.rewardAmount, 0);
  const affiliateAptcDue = affiliateDue.reduce((s, r) => s + r.aptcAmount, 0);
  const withdrawalAptcPending = affiliateWithdrawals.reduce((s, r) => s + r.aptcAmount, 0);

  let stakingList = stakingRewards;
  let affiliateList = affiliateRewards;
  if (filter === 'due') {
    stakingList = stakingDue;
    affiliateList = affiliateDue;
  } else if (filter === 'upcoming') {
    stakingList = stakingUpcoming;
    affiliateList = affiliateUpcoming;
  }

  return NextResponse.json({
    summary: {
      stakingDueCount: stakingDue.length,
      stakingDueAptc: stakingAptcDue,
      affiliateDueCount: affiliateDue.length,
      affiliateDueAptc: affiliateAptcDue,
      withdrawalPendingCount: affiliateWithdrawals.length,
      withdrawalPendingAptc: withdrawalAptcPending,
      totalDueAptc: stakingAptcDue + affiliateAptcDue,
    },
    stakingRewards: stakingList,
    affiliateRewards: affiliateList,
    affiliateWithdrawals,
  });
}
