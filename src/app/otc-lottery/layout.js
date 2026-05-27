import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'OTC Lottery | APT Casino',
  description:
    'Send SOL, receive APTC from the APT Casino team — skip DEX slippage and Bags trade tax on larger allocations.',
  path: '/otc-lottery',
});

export default function OtcLotteryLayout({ children }) {
  return children;
}
