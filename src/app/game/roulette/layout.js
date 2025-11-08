import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Roulette | APT Casino',
  description: 'European roulette with provably fair spins — bet on Solana or Aptos at APT Casino.',
  path: '/game/roulette',
});

export default function RouletteLayout({ children }) {
  return children;
}
