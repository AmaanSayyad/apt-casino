-- Refresh public roadmap for Bags.fm / Meteora DBC APTC launch (replaces Raydium CPMM excerpts).

UPDATE public.roadmap_items SET
  title = 'APTC TGE on Bags.fm (Meteora DBC)',
  excerpt = 'Fair bonding curve launch · Founder (Default) mode · 23% creator buy · 85 SOL graduation → Meteora DAMM v2 · 2% trade fee · 100% fee share to @aptcasinofun.',
  link = 'https://aptcasino.fun/litepaper#aptc-token'
WHERE id = 'a1000001-0001-4001-8001-000000000001';

UPDATE public.roadmap_items SET
  title = 'Tier 1 — DEX & trader listings',
  excerpt = 'Bags.fm · Meteora DBC · DexScreener Enhanced · Jupiter · Birdeye · GeckoTerminal — bonding curve launch and chart visibility at TGE.',
  link = 'https://bags.fm/launch'
WHERE id = 'a1000001-0001-4001-8001-000000000037';

UPDATE public.roadmap_items SET
  title = 'Meteora DAMM v2 liquidity depth',
  excerpt = 'Post-graduation pool depth — fee compounding, treasury support buys, and MM coordination so size doesn''t nuke the chart.',
  link = 'https://app.meteora.ag/'
WHERE id = 'a1000001-0001-4001-8001-000000000008';

UPDATE public.roadmap_items SET
  excerpt = 'Scheduled open-market buys on Jupiter & Meteora from gross gaming revenue — burn, staker, treasury splits published live.'
WHERE id = 'a1000001-0001-4001-8001-000000000009';

UPDATE public.roadmap_items SET
  excerpt = 'SOL → discounted APTC with lock periods — skip bonding-curve / DEX slippage and repeated swap fees for power users sizing in.'
WHERE id = 'a1000001-0001-4001-8001-000000000012';

UPDATE public.roadmap_items SET
  excerpt = 'Stream go-live, Volume Cup standings, Bags graduation events, and large buyback/burn notifications for holders.'
WHERE id = 'a1000001-0001-4001-8001-000000000020';

UPDATE public.roadmap_items SET
  excerpt = 'Deeper integrations with Bags, DexScreener, Meteora, Jupiter, CoinGecko, and major wallets — co-marketing with Aptos & Solana ecosystems.'
WHERE id = 'a1000001-0001-4001-8001-000000000030';
