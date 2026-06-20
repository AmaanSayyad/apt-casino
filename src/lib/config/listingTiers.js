/**
 * APTC listing tiers — DEX → aggregators → CEX.
 * Used in roadmap, litepaper, and tokenomics docs.
 */

export const APTC_LISTING_TIERS = [
  {
    tier: 1,
    label: 'Tier 1 — DEX & trader tools',
    status: 'in_progress',
    venues: ['Bags.fm', 'Meteora', 'DexScreener', 'Jupiter', 'Birdeye', 'GeckoTerminal'],
    summary:
      'Primary Solana liquidity at TGE — Bags bonding curve (Meteora DBC), graduation to DAMM v2, DexScreener enhanced info, Jupiter swap routing, Birdeye & GeckoTerminal tracking.',
  },
  {
    tier: 2,
    label: 'Tier 2 — Data aggregators',
    status: 'planned',
    venues: ['CoinGecko', 'CoinMarketCap'],
    summary:
      'Global price feeds, market cap rank, watchlists, and indexing for bots, portfolios, and institutional dashboards.',
  },
  {
    tier: 3,
    label: 'Tier 3 — CEX listings',
    status: 'planned',
    venues: ['MEXC', 'Gate.io', 'KuCoin', 'Bybit', 'OKX', 'Binance'],
    summary:
      'Centralized exchange roadmap as volume and GGR scale — MM coordination, treasury liquidity support, and phased CEX applications.',
  },
];

export function formatListingVenues(venues) {
  return venues.join(' · ');
}
