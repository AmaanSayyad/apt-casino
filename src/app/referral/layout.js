import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Referrals & APTC Rewards | APT Casino',
  description:
    'Share your referral link and earn 20% of each friend\'s first deposit in APTC. Climb the referrer leaderboard.',
  path: '/referral',
});

export default function ReferralLayout({ children }) {
  return children;
}
