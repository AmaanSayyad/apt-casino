import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Litepaper | APT Casino',
  description:
    'Official APT-Casino litepaper — multichain GambleFi, provably fair games, and APTC tokenomics.',
  path: '/litepaper',
});

export default function LitepaperLayout({ children }) {
  return children;
}
