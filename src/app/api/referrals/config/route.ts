import { NextResponse } from 'next/server';
import {
  getDepositFeeBps,
  getReferrerFeeShareBpsOfDeposit,
} from '@/lib/server/platformFees';
import {
  getReferralCliffDays,
  getRefereeVolumeUnlockUsd,
  aptcPriceUsd,
} from '@/lib/server/referralAptc';

export const dynamic = 'force-dynamic';

/**
 * Public referral economics — read by the in-app calculator.
 * Referrers earn APTC (not APT), unlocked after cliff or referee volume.
 */
export async function GET() {
  const depositFeeBps = getDepositFeeBps();
  const referrerShareBps = getReferrerFeeShareBpsOfDeposit();
  const platformKeepBps = Math.max(0, depositFeeBps - referrerShareBps);

  const price = await aptcPriceUsd();

  return NextResponse.json(
    {
      depositFeeBps,
      referrerShareBpsOfDeposit: referrerShareBps,
      platformKeepBpsOfDeposit: platformKeepBps,
      referrerSharePct: referrerShareBps / 100,
      depositFeePct: depositFeeBps / 100,
      platformKeepPct: platformKeepBps / 100,
      referrerSharePctOfFee:
        depositFeeBps > 0 ? (referrerShareBps / depositFeeBps) * 100 : 0,
      rewardCurrency: 'APTC',
      cliffDays: getReferralCliffDays(),
      refereeVolumeUnlockUsd: getRefereeVolumeUnlockUsd(),
      aptcPriceUsd: price,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
