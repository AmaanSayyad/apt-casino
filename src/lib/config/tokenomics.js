/**
 * APTC tokenomics — public-facing constants for landing + litepaper + docs.
 * Aligns with env-driven GGR buyback (see lib/server/ggrBuyback.ts).
 */

import { getAptcMint, isAptcLaunched, getAptcPairAddress } from './launchStatus';

export const APTC_TOKENOMICS = {
  name: 'AptCasino.fun',
  symbol: 'APTC',
  chain: 'Solana (SPL)',
  maxSupply: '1,000,000,000',
  decimals: 6,
  get mint() {
    return getAptcMint();
  },
  launchVenue: 'Raydium CPMM',
  launch:
    'Raydium CPMM fair launch · 1B APTC + 40 SOL · 0.5% fee · mint, freeze & update revoked.',
  authorities: {
    mintRevoked: true,
    freezeRevoked: true,
    updateRevoked: true,
  },
};

/** Raydium CPMM launch parameters (fair launch — full supply in LP) */
export const APTC_LAUNCH_METRICS = {
  pair: 'APTC/SOL',
  dex: 'Raydium Standard AMM (CPMM)',
  aptcInLp: '1,000,000,000',
  aptcInLpShort: '1B',
  solInLp: 40,
  feeTierPct: 0.5,
  approxLiquidityUsd: 5_408,
  approxMarketCapUsd: 2_704,
  approxTokenPriceUsd: 0.000002704,
  lpBurnPct: null,
  lockedAptc: null,
  lockedSol: null,
  get raydiumPoolAddress() {
    return getAptcPairAddress();
  },
  get dexscreenerPairUrl() {
    const pair = getAptcPairAddress();
    return pair ? `https://dexscreener.com/solana/${pair}` : null;
  },
};

/** Supply at TGE — 100% seeded into Raydium CPMM liquidity */
export const APTC_ALLOCATION = [
  {
    label: 'Raydium LP',
    pct: 100,
    tokensShort: '1B',
    // Allocation accent for the "Supply allocation" donut & legends.
    // Updated to pink/fuchsia to match the landing page screenshot.
    fill: '#ec4899',
    color: 'from-fuchsia-500 to-pink-500',
  },
];

/** Launch wallet — full supply minted here, deposited into Raydium pool */
export const APTC_WALLETS = [
  {
    id: 1,
    label: 'Launch & LP',
    amount: '1,000,000,000',
    amountShort: '1B',
    pct: 100,
    address: 'CAVLQyCEycrok3Mbv5mdCbE3epGQW3ibQ447fwTLweYx',
    purpose: 'Raydium CPMM · 1B APTC + 40 SOL · fair launch',
    purposeShort: 'Raydium LP',
  },
];

export const APTC_LAUNCH_STEPS = ['Token live', 'Raydium CPMM', 'DexScreener', 'Listings'];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Token live',
    detail: '1B supply · authorities revoked',
  },
  {
    step: '2',
    title: 'Raydium pool',
    detail: '1B APTC + 40 SOL · 0.5% fee',
  },
  {
    step: '3',
    title: 'Charts live',
    detail: 'DexScreener · Jupiter routing',
  },
  {
    step: '4',
    title: 'Flywheel on',
    detail: 'GGR buybacks · staking · listings',
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
    title: 'Casino flywheel',
    body: 'Live GGR from Plinko, Mines, Wheel & Roulette → Raydium/Jupiter buybacks.',
  },
  {
    title: 'Staking',
    body: 'Fixed-term pools on /stake · rewards from GGR buyback staker share.',
  },
  {
    title: 'Referrals',
    body: 'On-chain referral rewards tied to real deposits and play volume.',
  },
  {
    title: 'Volume Cup',
    body: 'Seasonal leaderboard prizes funded from protocol GGR.',
  },
];

export const GGR_FLYWHEEL_STEPS = [
  { step: '1', title: 'Play', desc: 'Bets on-chain' },
  { step: '2', title: 'GGR', desc: 'House edge revenue' },
  { step: '3', title: 'Buyback', desc: 'Market buys APTC' },
  { step: '4', title: 'Distribute', desc: 'Burn · stake · treasury' },
];

/** One-line summary for cards and subtitles */
export function getAllocationSummary() {
  return '1,000,000,000 APTC fixed supply · 100% fair-launch liquidity on Raydium CPMM.';
}

export function truncateAddress(addr, chars = 4) {
  if (!addr || addr.length < chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export function solscanAccountUrl(address) {
  return `https://solscan.io/account/${address}`;
}

export function solscanTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return `https://solscan.io/token/${mint}`;
}

export function dexscreenerTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return `https://dexscreener.com/solana/${mint}`;
}

export function dexscreenerPairUrl(pairAddress) {
  return `https://dexscreener.com/solana/${pairAddress}`;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function raydiumSwapUrl(mint = APTC_TOKENOMICS.mint) {
  return `https://raydium.io/swap/?inputMint=${SOL_MINT}&outputMint=${mint}`;
}

export function jupiterSwapUrl(mint = APTC_TOKENOMICS.mint) {
  return `https://jup.ag/swap/SOL-${mint}`;
}

/** External + on-site trade / research links */
export function getAptcTradeLinks(options = {}) {
  const launched = isAptcLaunched();
  const mint = APTC_TOKENOMICS.mint;
  const pairUrl =
    options.pairUrl ||
    (APTC_LAUNCH_METRICS.dexscreenerPairUrl ?? null) ||
    (launched ? dexscreenerTokenUrl(mint) : null);
  const raydiumHref = launched ? raydiumSwapUrl(mint) : 'https://raydium.io/';
  const jupiterHref = launched ? jupiterSwapUrl(mint) : 'https://jup.ag/';
  const solscanHref = launched ? solscanTokenUrl(mint) : 'https://solscan.io/';
  const dexscreenerHref = pairUrl || 'https://dexscreener.com/solana';

  return [
    { id: 'raydium',     label: 'Raydium',     sub: launched ? 'CPMM pool' : 'DEX',        href: raydiumHref,      external: true,  logo: '/logos/Raydium.png' },
    { id: 'dexscreener', label: 'DexScreener', sub: launched ? 'Live chart' : 'Charts',    href: dexscreenerHref,   external: true,  logo: '/logos/dexscreener.png' },
    { id: 'jupiter',     label: 'Jupiter',     sub: launched ? 'Swap' : 'Aggregator',      href: jupiterHref,       external: true,  logo: '/logos/jupiter.jpg' },
    { id: 'solscan',     label: 'Solscan',     sub: launched ? 'Mint' : 'Explorer',        href: solscanHref,       external: true,  logo: 'https://solscan.io/favicon.ico' },
    { id: 'stake',       label: 'Stake',       sub: 'Earn APY',                            href: '/stake',          external: false, logo: '/APTC_logo_1000x1000.png' },
    { id: 'litepaper',   label: 'Litepaper',   sub: 'Full docs',                           href: '/litepaper#aptc-token', external: false, logo: '/APTC_logo_1000x1000.png' },
  ];
}

/** Allocation fill for wallet row */
export function getWalletAllocationColor(walletId) {
  return APTC_ALLOCATION[walletId - 1]?.fill ?? '#06b6d4';
}
