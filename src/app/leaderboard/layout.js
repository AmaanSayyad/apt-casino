import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Leaderboard | APT Casino',
  description:
    'On-chain player leaderboard for APT Casino — net P&L, wagered volume, win rate, and biggest wins on Solana and Aptos.',
  path: '/leaderboard',
});

export default function LeaderboardLayout({ children }) {
  return children;
}
