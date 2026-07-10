import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'APTC IPO | AptCasino.fun',
  description:
    'Fixed-price $APTC public IPO on Solana. Deposit SOL, receive APTC instantly. 30-day auto-stake at 30% APY. Post-IPO Raydium liquidity.',
  path: '/ipo',
});

export { default } from './page-client';
