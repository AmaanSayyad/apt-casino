-- Public APT-Casino roadmap (curated; idempotent upsert)
-- Source: src/lib/config/publicRoadmap.js

insert into public.roadmap_items (id, title, excerpt, category, status, eta_date, link, sort_order)
values
  ('a1000001-0001-4001-8001-000000000001', 'APTC public launch on Bags', 'Fair SPL launch on Bags with transparent liquidity — initial 2% protocol buy (~20M APTC) at TGE, no VC unlock overhang.', 'Platform', 'in_progress', null, 'https://aptcasino.fun/litepaper#aptc-token', 10),
  ('a1000001-0001-4001-8001-000000000002', 'Multichain connect wallet (Solana + Aptos)', 'One connect flow for Petra, Phantom, and Solana wallets — play chain switcher, house balances, and deposits without Aptos-only friction.', 'Platform', 'in_progress', null, null, 12),
  ('a1000001-0001-4001-8001-000000000003', 'Aptos mainnet games & treasury hardening', 'Move modules live on mainnet for Plinko, Mines, Roulette, and Wheel — bootstrap house state, relayer gasless UX, and production monitoring.', 'Platform', 'in_progress', null, '/game', 15),
  ('a1000001-0001-4001-8001-000000000004', 'Live streaming GA (Livepeer)', 'Creator streams on /live with auto-approve go-live, admin moderation, wallet-signed chat, and featured stream discovery on the homepage.', 'Platform', 'in_progress', null, '/live', 18),
  ('a1000001-0001-4001-8001-000000000005', 'GGR buyback transparency dashboard', 'Public 30-day GGR estimates, buyback split (burn / stakers / treasury / market), and env-driven economics — no black-box treasury moves.', 'Platform', 'in_progress', null, '/dashboard', 20),
  ('a1000001-0001-4001-8001-000000000006', 'Accumulate protocol holding to 10% (100M APTC)', 'Post-TGE market purchases on Bags, Meteora, and open DEX until treasury holds 10% of max supply — funds community, LP, staking, and ops buckets.', 'Governance', 'in_progress', null, 'https://aptcasino.fun/litepaper#aptc-allocation', 25),
  ('a1000001-0001-4001-8001-000000000007', 'APTC staking deposits live at TGE', 'Fixed-term stake pools on /stake with on-chain vault, APY display, and yield from 12% emissions bucket plus GGR staker share.', 'Platform', 'planned', null, '/stake', 30),
  ('a1000001-0001-4001-8001-000000000008', 'Meteora & Bags liquidity depth', 'Deepen APTC/SOL pools and MM support so players and OTC users can size without moving thin books at launch.', 'Partnership', 'planned', null, null, 35),
  ('a1000001-0001-4001-8001-000000000009', 'Automated GGR → APTC buyback pipeline', 'Scheduled open-market buys from gross gaming revenue with configurable burn, staker, treasury, and market splits.', 'Platform', 'planned', null, 'https://aptcasino.fun/litepaper#ggr-flywheel', 40),
  ('a1000001-0001-4001-8001-000000000010', 'Public burn & buyback tracker', 'On-chain proof links for every buyback tranche — circulating supply, cumulative burn, and staker distributions updated weekly.', 'Platform', 'planned', null, '/dashboard', 45),
  ('a1000001-0001-4001-8001-000000000011', 'Volume Cup Season 2', 'Seasonal high-volume leaderboard with APTC prize pool from the community bucket — provably logged play events, no fabricated stats.', 'Tournaments', 'planned', null, '/competition', 50),
  ('a1000001-0001-4001-8001-000000000012', 'OTC lottery tiered tranches', 'SOL → discounted APTC with lock periods in multiple size tiers for power users who would otherwise stress launch liquidity.', 'Community', 'planned', null, '/otc-lottery', 55),
  ('a1000001-0001-4001-8001-000000000013', 'Referral leaderboard & win-share cards', '14-day cliff APTC referral rewards with public leaderboard, milestone unlocks, and shareable ROI cards on withdrawals.', 'Community', 'planned', null, '/referral', 60),
  ('a1000001-0001-4001-8001-000000000014', 'Move contract third-party audit', 'Independent security review of Aptos game modules and treasury paths before scaling TVL and external integrations.', 'Security', 'planned', null, 'https://aptcasino.fun/litepaper#security', 65),
  ('a1000001-0001-4001-8001-000000000015', 'Mobile-first game UX pass', 'Touch-optimized Plinko, Mines, Wheel, and Roulette — desktop-mode warnings retired where physics and layout are production-ready.', 'Platform', 'planned', null, '/game/plinko', 70),
  ('a1000001-0001-4001-8001-000000000017', 'Responsible gaming controls', 'Session limits, cooldowns, and self-exclusion hooks — player protection without custodial lock-in of funds.', 'Governance', 'planned', null, null, 80),
  ('a1000001-0001-4001-8001-000000000018', 'Quarterly treasury transparency report', 'Published breakdown of GGR, buybacks, burns, staking emissions, and partnership grants — aligned with the 100M APTC allocation chart.', 'Governance', 'planned', null, 'https://aptcasino.fun/litepaper#aptc-allocation', 85),
  ('a1000001-0001-4001-8001-000000000019', 'Bug bounty program', 'Immunefi-style scope for Move modules, withdrawal flows, and referral accounting as TVL scales past launch.', 'Security', 'planned', null, null, 90),
  ('a1000001-0001-4001-8001-000000000020', 'Telegram & Discord alert bots', 'Stream go-live, Volume Cup standings, and large buyback/burn notifications for holders who do not live on the site.', 'Community', 'planned', null, null, 95),
  ('a1000001-0001-4001-8001-000000000021', 'Sui chain adapter live', 'Third live play chain in the registry — Sui house balance mode, treasury env, and provably fair game API routes.', 'Platform', 'planned', null, 'https://aptcasino.fun/litepaper#multichain-topology', 100),
  ('a1000001-0001-4001-8001-000000000022', 'APTC holder governance (parameter votes)', 'Community votes on buyback %, burn ratio, referral cliff, and staking emission — starting with off-chain signaling, moving on-chain.', 'Governance', 'planned', null, 'https://aptcasino.fun/litepaper#roadmap', 105),
  ('a1000001-0001-4001-8001-000000000023', 'EVM play chain (Base)', 'Server house balance on Base with the same chain registry pattern — unified profile and leaderboard across Solana, Aptos, and EVM.', 'Platform', 'planned', null, 'https://aptcasino.fun/litepaper#multichain-topology', 110),
  ('a1000001-0001-4001-8001-000000000024', 'Multilingual UI (EN · ES · PT)', 'Localized casino, stake, and referral flows for LATAM and EU communities — starting with high-traffic pages.', 'Community', 'planned', null, null, 115),
  ('a1000001-0001-4001-8001-000000000025', 'Developer SDK for provably-fair games', 'Open hub API for third-party builders to publish games with revenue share, shared RNG proofs, and APTC fee routing.', 'Platform', 'planned', null, 'https://aptcasino.fun/litepaper#scope', 120),
  ('a1000001-0001-4001-8001-000000000026', 'AI-generated player profile NFTs', 'Optional on-chain identity cards tied to play history and achievements — cosmetic first, no pay-to-win mechanics.', 'Community', 'planned', null, '/profile', 125),
  ('a1000001-0001-4001-8001-000000000027', 'Starknet & additional L2 adapters', 'Extend the chain registry to Starknet and select L2s with isolated treasuries and the same transparent fee model.', 'Platform', 'planned', null, null, 130),
  ('a1000001-0001-4001-8001-000000000028', 'Poker & table games expansion', 'Peer-style and house-banked table games with the same provably fair and multichain settlement patterns as arcade titles.', 'Platform', 'planned', null, '/game', 135),
  ('a1000001-0001-4001-8001-000000000029', 'Multichain game marketplace', 'Largest transparent GambleFi hub — listed third-party games, creator revenue share, and unified APTC economics across chains.', 'Platform', 'planned', null, 'https://aptcasino.fun/litepaper#roadmap', 140),
  ('a1000001-0001-4001-8001-000000000030', 'Ecosystem wallet & data partners', 'Deeper integrations with DexScreener, major wallets, and analytics — co-marketing with Aptos, Solana, and Bags ecosystems.', 'Partnership', 'planned', null, null, 145)
on conflict (id) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  category = excluded.category,
  status = excluded.status,
  eta_date = excluded.eta_date,
  link = excluded.link,
  sort_order = excluded.sort_order,
  updated_at = now();
