-- Refresh public roadmap for Raydium CPMM APTC launch (replaces Bags-era milestones).

-- Remove obsolete Bags / 10% protocol items
DELETE FROM public.roadmap_items
WHERE id IN (
  'a1000001-0001-4001-8001-000000000006',
  'a1000001-0001-4001-8001-000000000008'
);

-- Upsert current launch milestones (matches src/lib/config/publicRoadmap.js)
INSERT INTO public.roadmap_items (id, title, excerpt, category, status, eta_date, link, sort_order)
VALUES
  ('a1000001-0001-4001-8001-000000000001', 'APTC TGE on Raydium CPMM', '120M APTC + 37 SOL on Raydium Standard AMM · 0.5% fee tier · ~$5k liquidity · ~$20.8k launch MC. Mint revoked. Sniper-ready.', 'Platform', 'in_progress', null, 'https://aptcasino.fun/litepaper#aptc-token', 10),
  ('a1000001-0001-4001-8001-000000000031', 'Raydium LP burn (~16.67%)', 'Permanently burn ~16.67% of LP tokens at TGE — ~20M APTC + ~6.17 SOL locked in pool. Liquidity stays. Supply signal locked.', 'Platform', 'in_progress', null, 'https://aptcasino.fun/litepaper#aptc-allocation', 11),
  ('a1000001-0001-4001-8001-000000000032', 'DexScreener Enhanced Token Info', 'Official APTC branding on DexScreener — logo, socials, description, and links live on every APTC/SOL chart traders watch.', 'Partnership', 'in_progress', null, 'https://dexscreener.com', 12),
  ('a1000001-0001-4001-8001-000000000033', 'Jupiter swap routing for APTC', 'APTC/SOL routed through Jupiter aggregator — Phantom, Backpack, and every major Solana wallet can ape in one click.', 'Partnership', 'planned', null, 'https://jup.ag', 22),
  ('a1000001-0001-4001-8001-000000000034', 'CoinGecko listing application', 'Fast-track CoinGecko for APTC — price feeds, market cap tracking, and the credibility signal every bot and aggregator scrapes.', 'Partnership', 'planned', null, 'https://www.coingecko.com', 24),
  ('a1000001-0001-4001-8001-000000000035', 'CoinMarketCap listing application', 'CoinMarketCap submission for APTC — global rank visibility, watchlists, and institutional-grade price discovery.', 'Partnership', 'planned', null, 'https://coinmarketcap.com', 26),
  ('a1000001-0001-4001-8001-000000000007', 'APTC staking deposits live at TGE', 'Fixed-term stake pools on /stake — 30/60/90/180-day locks, 120M emissions wallet, APY from emissions plus GGR staker share.', 'Platform', 'planned', null, 'https://aptcasino.fun/stake', 30),
  ('a1000001-0001-4001-8001-000000000008', 'Raydium liquidity depth & farm incentives', 'Deepen APTC/SOL on Raydium CPMM — LP incentives, treasury support buys, and MM coordination so size doesn''t nuke the chart.', 'Partnership', 'planned', null, 'https://raydium.io', 35),
  ('a1000001-0001-4001-8001-000000000009', 'Automated GGR → APTC buyback pipeline', 'Scheduled open-market buys on Raydium & Jupiter from gross gaming revenue — burn, staker, treasury splits published live.', 'Platform', 'planned', null, 'https://aptcasino.fun/litepaper#ggr-flywheel', 40),
  ('a1000001-0001-4001-8001-000000000011', 'Volume Cup Season 2', 'Seasonal high-volume leaderboard with APTC prize pool from the 30M competitions wallet — provably logged play events, no fabricated stats.', 'Tournaments', 'planned', null, 'https://aptcasino.fun/competition', 50),
  ('a1000001-0001-4001-8001-000000000012', 'OTC lottery tiered tranches', 'SOL → discounted APTC with lock periods — skip Raydium slippage and repeated swap fees for power users sizing in.', 'Community', 'planned', null, 'https://aptcasino.fun/otc-lottery', 55),
  ('a1000001-0001-4001-8001-000000000013', 'Referral leaderboard & win-share cards', '100M APTC referral wallet — 14-day cliff rewards, public leaderboard, milestone unlocks, and shareable ROI cards.', 'Community', 'planned', null, 'https://aptcasino.fun/referral', 60),
  ('a1000001-0001-4001-8001-000000000036', 'Wallet transparency dashboard', 'Live tracker for APTC allocation wallets — treasury, staking, referrals, marketing, competitions — with Solscan links and movement alerts.', 'Governance', 'planned', null, 'https://aptcasino.fun/litepaper#aptc-allocation', 78),
  ('a1000001-0001-4001-8001-000000000020', 'Telegram & Discord alert bots', 'Stream go-live, Volume Cup standings, Raydium LP events, and large buyback/burn notifications for holders.', 'Community', 'planned', null, null, 95),
  ('a1000001-0001-4001-8001-000000000018', 'Quarterly treasury transparency report', 'Published breakdown of GGR, buybacks, burns, staking emissions, and partnership grants — aligned with the 1B APTC allocation chart.', 'Governance', 'planned', null, 'https://aptcasino.fun/litepaper#aptc-allocation', 85),
  ('a1000001-0001-4001-8001-000000000030', 'Ecosystem wallet & data partners', 'Deeper integrations with DexScreener, Raydium, Jupiter, CoinGecko, and major wallets — co-marketing with Aptos & Solana ecosystems.', 'Partnership', 'planned', null, null, 145)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  link = EXCLUDED.link,
  sort_order = EXCLUDED.sort_order;
 