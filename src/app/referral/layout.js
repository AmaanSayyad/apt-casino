import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Referrals & APTC Rewards | APT Casino',
  description:
    'Share your referral link, earn APTC when friends deposit, and climb the referrer leaderboard.',
  path: '/referral',
});

export default function ReferralLayout({ children }) {
  return children;
}
