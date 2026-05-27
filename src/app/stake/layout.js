import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Stake APTC | APT Casino',
  description:
    'Fixed-term APTC staking pools on Solana. Stake APTC, earn yield at lock, and claim principal plus rewards at maturity.',
  path: '/stake',
});

export default function StakeLayout({ children }) {
  return children;
}
