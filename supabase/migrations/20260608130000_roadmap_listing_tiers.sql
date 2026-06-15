-- Consolidate APTC listing milestones into Tier 1 / 2 / 3 roadmap items.

DELETE FROM public.roadmap_items
WHERE id IN (
  'a1000001-0001-4001-8001-000000000032',
  'a1000001-0001-4001-8001-000000000033',
  'a1000001-0001-4001-8001-000000000034',
  'a1000001-0001-4001-8001-000000000035'
);

INSERT INTO public.roadmap_items (id, title, excerpt, category, status, eta_date, link, sort_order)
VALUES
  (
    'a1000001-0001-4001-8001-000000000037',
    'Tier 1 — DEX & trader listings',
    'Raydium CPMM · DexScreener Enhanced · Jupiter · Birdeye · GeckoTerminal — primary Solana liquidity and chart visibility at TGE.',
    'Partnership',
    'in_progress',
    null,
    'https://raydium.io',
    21
  ),
  (
    'a1000001-0001-4001-8001-000000000038',
    'Tier 2 — CoinGecko & CoinMarketCap',
    'Data aggregator listings — global price feeds, market cap rank, watchlists, and bot/aggregator indexing for APTC.',
    'Partnership',
    'planned',
    null,
    'https://www.coingecko.com',
    23
  ),
  (
    'a1000001-0001-4001-8001-000000000039',
    'Tier 3 — CEX listings',
    'MEXC · Gate.io · KuCoin · Bybit · OKX · Binance — phased CEX applications with MM coordination as casino GGR and volume scale.',
    'Partnership',
    'planned',
    null,
    null,
    27
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  link = EXCLUDED.link,
  sort_order = EXCLUDED.sort_order;
