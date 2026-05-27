import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Volume Cup | APT Casino',
  description:
    'Seasonal wager-volume tournaments on Solana and Aptos. Register, play qualifying games, and climb live standings for prizes.',
  path: '/competition',
});

export default function CompetitionLayout({ children }) {
  return children;
}
