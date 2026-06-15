/**
 * Public APT-Casino roadmap — curated from litepaper, pitch deck, tokenomics, and product surface.
 * Seeded into Supabase `roadmap_items` via migration + `npm run seed:roadmap`.
 * API falls back to this list when the table is empty.
 */

import { getLitepaperUrl } from '../siteMetadata.js';

/** @typedef {'Platform'|'Governance'|'Partnership'|'Security'|'Community'|'Tournaments'} RoadmapCategory */
/** @typedef {'planned'|'in_progress'} RoadmapStatus */

/**
 * @type {Array<{
 *   id: string;
 *   title: string;
 *   excerpt: string;
 *   category: RoadmapCategory;
 *   status: RoadmapStatus;
 *   link: string | null;
 *   sortOrder: number;
 * }>}
 */
export const PUBLIC_ROADMAP_ITEMS = [
  {
    id: 'a1000001-0001-4001-8001-000000000001',
    title: 'APTC TGE on Raydium CPMM',
    excerpt:
      '1B APTC + 40 SOL on Raydium Standard AMM · 0.5% fee tier · ~$5.4k liquidity · ~$2.7k launch MC. Mint revoked. Fair launch.',
    category: 'Platform',
    status: 'in_progress',
    link: getLitepaperUrl('aptc-token'),
    sortOrder: 10,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000031',
    title: 'Raydium LP burn (~16.67%)',
    excerpt:
      'Permanently burn ~16.67% of LP tokens at TGE — ~20M APTC + ~6.17 SOL locked in pool. Liquidity stays. Supply signal locked.',
    category: 'Platform',
    status: 'in_progress',
    link: getLitepaperUrl('aptc-allocation'),
    sortOrder: 11,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000037',
    title: 'Tier 1 — DEX & trader listings',
    excerpt:
      'Raydium CPMM · DexScreener Enhanced · Jupiter · Birdeye · GeckoTerminal — primary Solana liquidity and chart visibility at TGE.',
    category: 'Partnership',
    status: 'in_progress',
    link: 'https://raydium.io',
    sortOrder: 21,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000038',
    title: 'Tier 2 — CoinGecko & CoinMarketCap',
    excerpt:
      'Data aggregator listings — global price feeds, market cap rank, watchlists, and bot/aggregator indexing for APTC.',
    category: 'Partnership',
    status: 'planned',
    link: 'https://www.coingecko.com',
    sortOrder: 23,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000039',
    title: 'Tier 3 — CEX listings',
    excerpt:
      'MEXC · Gate.io · KuCoin · Bybit · OKX · Binance — phased CEX applications with MM coordination as casino GGR and volume scale.',
    category: 'Partnership',
    status: 'planned',
    link: null,
    sortOrder: 27,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000002',
    title: 'Multichain connect wallet (Solana + Aptos)',
    excerpt:
      'One connect flow for Petra, Phantom, and Solana wallets — play chain switcher, house balances, and deposits without Aptos-only friction.',
    category: 'Platform',
    status: 'in_progress',
    link: null,
    sortOrder: 15,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000003',
    title: 'Aptos mainnet games & treasury hardening',
    excerpt:
      'Move modules live on mainnet for Plinko, Mines, Roulette, and Wheel — bootstrap house state, relayer gasless UX, and production monitoring.',
    category: 'Platform',
    status: 'in_progress',
    link: '/game',
    sortOrder: 18,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000005',
    title: 'GGR buyback transparency dashboard',
    excerpt:
      'Public 30-day GGR estimates, buyback split (burn / stakers / treasury), and env-driven economics — no black-box treasury moves.',
    category: 'Platform',
    status: 'in_progress',
    link: '/dashboard',
    sortOrder: 20,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000007',
    title: 'APTC staking deposits live at TGE',
    excerpt:
      'Fixed-term stake pools on /stake — 30/60/90/180-day locks, 120M emissions wallet, APY from emissions plus GGR staker share.',
    category: 'Platform',
    status: 'planned',
    link: '/stake',
    sortOrder: 30,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000008',
    title: 'Raydium liquidity depth & farm incentives',
    excerpt:
      'Deepen APTC/SOL on Raydium CPMM — LP incentives, treasury support buys, and MM coordination so size doesn’t nuke the chart.',
    category: 'Partnership',
    status: 'planned',
    link: 'https://raydium.io',
    sortOrder: 35,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000009',
    title: 'Automated GGR → APTC buyback pipeline',
    excerpt:
      'Scheduled open-market buys on Raydium & Jupiter from gross gaming revenue — burn, staker, treasury splits published live.',
    category: 'Platform',
    status: 'planned',
    link: getLitepaperUrl('ggr-flywheel'),
    sortOrder: 40,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000010',
    title: 'Public burn & buyback tracker',
    excerpt:
      'On-chain proof links for every buyback tranche — circulating supply, cumulative burn, and staker distributions updated weekly.',
    category: 'Platform',
    status: 'planned',
    link: '/dashboard',
    sortOrder: 45,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000011',
    title: 'Volume Cup Season 2',
    excerpt:
      'Seasonal high-volume leaderboard with APTC prize pool from the 30M competitions wallet — provably logged play events, no fabricated stats.',
    category: 'Tournaments',
    status: 'planned',
    link: '/competition',
    sortOrder: 50,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000012',
    title: 'OTC lottery tiered tranches',
    excerpt:
      'SOL → discounted APTC with lock periods — skip Raydium slippage and repeated swap fees for power users sizing in.',
    category: 'Community',
    status: 'planned',
    link: '/otc-lottery',
    sortOrder: 55,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000013',
    title: 'Referral leaderboard & win-share cards',
    excerpt:
      '100M APTC referral wallet — 14-day cliff rewards, public leaderboard, milestone unlocks, and shareable ROI cards.',
    category: 'Community',
    status: 'planned',
    link: '/referral',
    sortOrder: 60,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000004',
    title: 'Live streaming GA (Livepeer)',
    excerpt:
      'Creator streams on /live with auto-approve go-live, admin moderation, wallet-signed chat, and featured stream discovery on the homepage.',
    category: 'Platform',
    status: 'planned',
    link: '/live',
    sortOrder: 65,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000014',
    title: 'Move contract third-party audit',
    excerpt:
      'Independent security review of Aptos game modules and treasury paths before scaling TVL and external integrations.',
    category: 'Security',
    status: 'planned',
    link: getLitepaperUrl('security'),
    sortOrder: 70,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000015',
    title: 'Mobile-first game UX pass',
    excerpt:
      'Touch-optimized Plinko, Mines, Wheel, and Roulette — desktop-mode warnings retired where physics and layout are production-ready.',
    category: 'Platform',
    status: 'planned',
    link: '/game/plinko',
    sortOrder: 75,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000036',
    title: 'Wallet transparency dashboard',
    excerpt:
      'Live tracker for APTC allocation wallets — treasury, staking, referrals, marketing, competitions — with Solscan links and movement alerts.',
    category: 'Governance',
    status: 'planned',
    link: getLitepaperUrl('aptc-allocation'),
    sortOrder: 78,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000017',
    title: 'Responsible gaming controls',
    excerpt:
      'Session limits, cooldowns, and self-exclusion hooks — player protection without custodial lock-in of funds.',
    category: 'Governance',
    status: 'planned',
    link: null,
    sortOrder: 80,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000018',
    title: 'Quarterly treasury transparency report',
    excerpt:
      'Published breakdown of GGR, buybacks, burns, staking emissions, and partnership grants — aligned with the 1B APTC allocation chart.',
    category: 'Governance',
    status: 'planned',
    link: getLitepaperUrl('aptc-allocation'),
    sortOrder: 85,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000019',
    title: 'Bug bounty program',
    excerpt:
      'Immunefi-style scope for Move modules, withdrawal flows, and referral accounting as TVL scales past launch.',
    category: 'Security',
    status: 'planned',
    link: null,
    sortOrder: 90,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000020',
    title: 'Telegram & Discord alert bots',
    excerpt:
      'Stream go-live, Volume Cup standings, Raydium LP events, and large buyback/burn notifications for holders.',
    category: 'Community',
    status: 'planned',
    link: null,
    sortOrder: 95,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000021',
    title: 'Sui chain adapter live',
    excerpt:
      'Third live play chain in the registry — Sui house balance mode, treasury env, and provably fair game API routes.',
    category: 'Platform',
    status: 'planned',
    link: getLitepaperUrl('multichain-topology'),
    sortOrder: 100,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000022',
    title: 'APTC holder governance (parameter votes)',
    excerpt:
      'Community votes on buyback %, burn ratio, referral cliff, and staking emission — starting with off-chain signaling, moving on-chain.',
    category: 'Governance',
    status: 'planned',
    link: getLitepaperUrl('roadmap'),
    sortOrder: 105,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000023',
    title: 'EVM play chain (Base)',
    excerpt:
      'Server house balance on Base with the same chain registry pattern — unified profile and leaderboard across Solana, Aptos, and EVM.',
    category: 'Platform',
    status: 'planned',
    link: getLitepaperUrl('multichain-topology'),
    sortOrder: 110,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000024',
    title: 'Multilingual UI (EN · ES · PT)',
    excerpt:
      'Localized casino, stake, and referral flows for LATAM and EU communities — starting with high-traffic pages.',
    category: 'Community',
    status: 'planned',
    link: null,
    sortOrder: 115,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000025',
    title: 'Developer SDK for provably-fair games',
    excerpt:
      'Open hub API for third-party builders to publish games with revenue share, shared RNG proofs, and APTC fee routing.',
    category: 'Platform',
    status: 'planned',
    link: getLitepaperUrl('scope'),
    sortOrder: 120,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000026',
    title: 'AI-generated player profile NFTs',
    excerpt:
      'Optional on-chain identity cards tied to play history and achievements — cosmetic first, no pay-to-win mechanics.',
    category: 'Community',
    status: 'planned',
    link: '/profile',
    sortOrder: 125,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000027',
    title: 'Starknet & additional L2 adapters',
    excerpt:
      'Extend the chain registry to Starknet and select L2s with isolated treasuries and the same transparent fee model.',
    category: 'Platform',
    status: 'planned',
    link: null,
    sortOrder: 130,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000028',
    title: 'Poker & table games expansion',
    excerpt:
      'Peer-style and house-banked table games with the same provably fair and multichain settlement patterns as arcade titles.',
    category: 'Platform',
    status: 'planned',
    link: '/game',
    sortOrder: 135,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000029',
    title: 'Multichain game marketplace',
    excerpt:
      'Largest transparent GambleFi hub — listed third-party games, creator revenue share, and unified APTC economics across chains.',
    category: 'Platform',
    status: 'planned',
    link: getLitepaperUrl('roadmap'),
    sortOrder: 140,
  },
  {
    id: 'a1000001-0001-4001-8001-000000000030',
    title: 'Ecosystem wallet & data partners',
    excerpt:
      'Deeper integrations with DexScreener, Raydium, Jupiter, CoinGecko, and major wallets — co-marketing with Aptos & Solana ecosystems.',
    category: 'Partnership',
    status: 'planned',
    link: null,
    sortOrder: 145,
  },
];

export function mapPublicRoadmapToApi(items = PUBLIC_ROADMAP_ITEMS) {
  return items.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category,
    status: r.status,
    statusLabel: r.status === 'in_progress' ? 'In progress' : 'Planned',
    link: r.link,
  }));
}

export function mapPublicRoadmapToDbRows(items = PUBLIC_ROADMAP_ITEMS) {
  return items.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category,
    status: r.status,
    eta_date: null,
    link: r.link,
    sort_order: r.sortOrder,
  }));
}
