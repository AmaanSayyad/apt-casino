import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Play Games | APT Casino',
  description:
    'Provably fair roulette, mines, plinko, wheel and more — play with SOL or APT on APT Casino.',
  path: '/game',
});

export default function GameLayout({ children }) {
  return <>{children}</>;
}
