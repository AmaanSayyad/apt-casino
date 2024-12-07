/**
 * APTC tokenomics — public-facing constants for landing + litepaper + docs.
 * Aligns with env-driven GGR buyback (see lib/server/ggrBuyback.ts).
 */

export const APTC_TOKENOMICS = {
  name: 'APT Casino Token',
  symbol: 'APTC',
  chain: 'Solana (SPL)',
  maxSupply: '1,000,000,000',
  decimals: 6,
  /** Public launch venue */
  launchVenue: 'Bags app',
  launch:
    'Public launch on Bags — protocol accumulates to a 10% holding (100M APTC) via launch buys and Meteora / open-market purchases.',
};

/** Protocol target holding vs 1B max supply */
export const APTC_PROTOCOL_HOLDING = {
  pctOfMaxSupply: 10,
  tokens: '100,000,000',
  tokensShort: '100M',
  launchBuyPct: 2,
  launchBuyTokens: '20,000,000',
};

/**
 * How the protocol deploys its 10% bucket (100M APTC).
 * Chart totals 100% of this bucket — not % of total 1B supply.
 */
export const APTC_ALLOCATION = [
  { label: 'Community & rewards', pct: 35, fill: '#c026d3', color: 'from-purple-500 to-fuchsia-500' },
  { label: 'Liquidity & market making', pct: 25, fill: '#06b6d4', color: 'from-blue-500 to-cyan-500' },
  { label: 'Treasury & operations', pct: 20, fill: '#f59e0b', color: 'from-amber-500 to-orange-500' },
  { label: 'Staking emissions', pct: 12, fill: '#10b981', color: 'from-emerald-500 to-teal-500' },
  { label: 'Partnerships & grants', pct: 8, fill: '#f43f5e', color: 'from-rose-500 to-pink-500' },
];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Public launch on Bags',
    detail:
      'APTC goes live via Bags app — fair public launch with transparent on-chain liquidity, no VC unlock overhang.',
  },
  {
    step: '2',
    title: '2% at launch',
    detail:
      'At TGE the protocol market-buys ~2% of max supply (20M APTC) on Bags as the initial treasury position.',
  },
  {
    step: '3',
    title: 'Accumulate to 10%',
    detail:
      'Further purchases on Meteora, Bags, and open markets until protocol holdings reach 10% of supply (100M APTC).',
  },
];

/** Buyback split palette (matches GGR buyback engine UI) */
export const BUYBACK_SPLIT_COLORS = {
  burn: '#fb7185',
  stakers: '#a78bfa',
  treasury: '#fbbf24',
  toMarket: '#34d399',
};

export const APTC_UTILITY = [
  {
    title: 'House staking',
    body: 'Stake APTC in fixed-term pools on the Stake page. Yield is funded from protocol revenue, staking emissions (12% of the protocol bucket), and GGR buyback.',
  },
  {
    title: 'Referral rewards',
    body: 'Referrers earn APTC (not native play tokens). Rewards unlock after a 14-day cliff or when your referee hits a volume milestone — routed from the community bucket.',
  },
  {
    title: 'GGR buyback & burn',
    body: 'A share of gross gaming revenue is used to market-buy APTC on open markets. A portion is burned, reducing circulating supply.',
  },
  {
    title: 'OTC & volume programs',
    body: 'OTC lottery and Volume Cup prizes allocate APTC from the community bucket without forcing large size through thin DEX books at launch.',
  },
];

export const GGR_FLYWHEEL_STEPS = [
  { step: '1', title: 'Play', desc: 'Bets on Plinko, Mines, Wheel, Roulette across Solana & Aptos.' },
  { step: '2', title: 'House edge', desc: 'Configurable edge per game (≈1–4%) produces gross gaming revenue (GGR).' },
  { step: '3', title: 'Buyback', desc: 'Protocol allocates a % of GGR to open-market APTC purchases (Bags / Meteora / DEX).' },
  { step: '4', title: 'Burn & stake', desc: 'Bought APTC is split between burn, staking rewards, and treasury reserves.' },
];

/** One-line summary for cards and subtitles */
export function getProtocolAllocationSummary() {
  const h = APTC_PROTOCOL_HOLDING;
  return `${h.pctOfMaxSupply}% of max supply (${h.tokensShort} APTC) — chart shows how that bucket is deployed (100%).`;
}
