import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Live Streams | APT Casino',
  description:
    'Watch and stream APT Casino gameplay. Go live, earn a share of platform revenue, and grow your audience on Solana.',
  path: '/live',
});

export default function LiveLayout({ children }) {
  return children;
}
