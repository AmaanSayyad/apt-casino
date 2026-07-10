import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'OTC Lottery | APT Casino',
  description:
    'Send SOL, receive APTC from the APT Casino team — fixed IPO pricing without DEX slippage on larger allocations.',
  path: '/otc-lottery',
});

export default function OtcLotteryLayout({ children }) {
  return children;
}
