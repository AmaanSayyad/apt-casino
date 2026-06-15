/**
 * APTC tokenomics — public-facing constants for landing + litepaper + docs.
 * Aligns with env-driven GGR buyback (see lib/server/ggrBuyback.ts).
 */

export const APTC_TOKENOMICS = {
  name: 'AptCasino.fun',
  symbol: 'APTC',
  chain: 'Solana (SPL)',
  maxSupply: '1,000,000,000',
  decimals: 6,
  mint: 'C9ej1qVPj9tycKgWZSUkL9RDuz65VzX2WfG7rfhAqSaL',
  launchVenue: 'Raydium CPMM',
  launch:
    'Raydium CPMM · 120M APTC + 37 SOL · 0.5% fee · mint, freeze & update revoked.',
  authorities: {
    mintRevoked: true,
    freezeRevoked: true,
    updateRevoked: true,
  },
};

/** Raydium CPMM launch parameters */
export const APTC_LAUNCH_METRICS = {
  pair: 'APTC/SOL',
  dex: 'Raydium Standard AMM (CPMM)',
  aptcInLp: '120,000,000',
  aptcInLpShort: '120M',
  solInLp: 37,
  feeTierPct: 0.5,
  approxLiquidityUsd: 5_000,
  approxMarketCapUsd: 20_800,
  approxTokenPriceUsd: 0.00002084,
  lpBurnPct: 16.67,
  lockedAptc: '20,000,000',
  lockedSol: 6.17,
  /** Raydium CPMM pool (APTC/SOL) — set after pool creation on raydium.io */
  raydiumPoolAddress: '',
  dexscreenerPairUrl: 'https://dexscreener.com/solana/C9ej1qVPj9tycKgWZSUkL9RDuz65VzX2WfG7rfhAqSaL',
};

/**
 * Full 1B supply allocation — chart totals 100% of max supply.
 */
export const APTC_ALLOCATION = [
  { label: 'Initial liquidity', pct: 12, tokensShort: '120M', fill: '#06b6d4', color: 'from-cyan-500 to-blue-500' },
  { label: 'Treasury & operations', pct: 25, tokensShort: '250M', fill: '#f59e0b', color: 'from-amber-500 to-orange-500' },
  { label: 'Staking rewards', pct: 12, tokensShort: '120M', fill: '#10b981', color: 'from-emerald-500 to-teal-500' },
  { label: 'Community & ambassadors', pct: 15, tokensShort: '150M', fill: '#c026d3', color: 'from-purple-500 to-fuchsia-500' },
  { label: 'Referral rewards', pct: 10, tokensShort: '100M', fill: '#f43f5e', color: 'from-rose-500 to-pink-500' },
  { label: 'Partnerships & ecosystem', pct: 10, tokensShort: '100M', fill: '#3b82f6', color: 'from-blue-500 to-indigo-500' },
  { label: 'Founder reserve', pct: 8, tokensShort: '80M', fill: '#a855f7', color: 'from-violet-500 to-purple-500' },
  { label: 'Marketing & launch', pct: 5, tokensShort: '50M', fill: '#fb923c', color: 'from-orange-400 to-amber-500' },
  { label: 'Competitions & airdrops', pct: 3, tokensShort: '30M', fill: '#14b8a6', color: 'from-teal-500 to-cyan-500' },
];

/** Transparent launch wallets — on-chain distribution */
export const APTC_WALLETS = [
  {
    id: 1,
    label: 'Liquidity',
    amount: '120,000,000',
    amountShort: '120M',
    pct: 12,
    address: 'CAVLQyCEycrok3Mbv5mdCbE3epGQW3ibQ447fwTLweYx',
    purpose: 'Raydium LP · 37 SOL · ~16.67% burn',
    purposeShort: 'Raydium LP',
  },
  {
    id: 2,
    label: 'Treasury',
    amount: '250,000,000',
    amountShort: '250M',
    pct: 25,
    address: '77WBQZcjr1eLpYDk6PrwUbSUkLw57fNyX4U7pYqrrbHM',
    purpose: 'Runway · buybacks · listings',
    purposeShort: 'Operations',
  },
  {
    id: 3,
    label: 'Staking',
    amount: '120,000,000',
    amountShort: '120M',
    pct: 12,
    address: '4Ka1vdinFUqhh3TtHaohj1MiKVUrvJBrgsVp1MfVnXFQ',
    purpose: 'Staking pools · emissions',
    purposeShort: 'Staking',
  },
  {
    id: 4,
    label: 'Community',
    amount: '150,000,000',
    amountShort: '150M',
    pct: 15,
    address: '6o2MnFJkPsAcrd3aQwMLPvS7S3jLqoHufPVFpjnEemdU',
    purpose: 'Ambassadors · Galxe · creators',
    purposeShort: 'Community',
  },
  {
    id: 5,
    label: 'Referrals',
    amount: '100,000,000',
    amountShort: '100M',
    pct: 10,
    address: 'EuGB4qtHrCanacDktatYqiBGLcESBtomrE9o9vsf2PMC',
    purpose: 'Referral payouts · affiliates',
    purposeShort: 'Referrals',
  },
  {
    id: 6,
    label: 'Partnerships',
    amount: '100,000,000',
    amountShort: '100M',
    pct: 10,
    address: 'hCs3cwHHjTJbCKDgFQdcDRGLZm9foDaKbJAmjme8uN8',
    purpose: 'KOLs · guilds · integrations',
    purposeShort: 'Partners',
  },
  {
    id: 7,
    label: 'Founder reserve',
    amount: '80,000,000',
    amountShort: '80M',
    pct: 8,
    address: 'H19S7VBJweiiKhE3oFivrd43j7CAkJkWKHC2dHxDkBB',
    purpose: 'Builder reserve',
    purposeShort: 'Founder',
  },
  {
    id: 8,
    label: 'Marketing',
    amount: '50,000,000',
    amountShort: '50M',
    pct: 5,
    address: '2HuE97iCqtwJ1QaZofezzHNbgGbuoGbZA39JXgwpGWLn',
    purpose: 'Campaigns · DEX boosts',
    purposeShort: 'Marketing',
  },
  {
    id: 9,
    label: 'Competitions',
    amount: '30,000,000',
    amountShort: '30M',
    pct: 3,
    address: 'Cyrc6UZz1P4RqmMrmSSuYCSrzfu8w6TnYEAxGStdgHvq',
    purpose: 'Volume Cup · giveaways',
    purposeShort: 'Competitions',
  },
];

export const APTC_LAUNCH_STEPS = [
  'Token live',
  'Raydium CPMM',
  'LP burn',
  'Listings',
];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Token live',
    detail: '1B supply · authorities revoked',
  },
  {
    step: '2',
    title: 'Raydium pool',
    detail: '120M APTC + 37 SOL · 0.5% fee',
  },
  {
    step: '3',
    title: 'LP burn',
    detail: '~16.67% burned · ~20M APTC locked',
  },
  {
    step: '4',
    title: 'Flywheel on',
    detail: 'DexScreener · Jupiter · CG/CMC',
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
    body: '120M emissions · 30–180 day pools · plus GGR staker share.',
  },
  {
    title: 'Referrals',
    body: '100M wallet · on-chain payouts tied to real product growth.',
  },
  {
    title: 'Volume Cup',
    body: 'Competition prizes from dedicated 30M wallet.',
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
  return '1,000,000,000 APTC fixed supply · chart shows % of total supply (100%).';
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
  const mint = APTC_TOKENOMICS.mint;
  const pairUrl =
    options.pairUrl ||
    (APTC_LAUNCH_METRICS.dexscreenerPairUrl ?? null) ||
    dexscreenerTokenUrl(mint);
  const raydiumHref = raydiumSwapUrl(mint);

  return [
    { id: 'raydium', label: 'Raydium', sub: 'CPMM pool', href: raydiumHref, external: true },
    { id: 'dexscreener', label: 'DexScreener', sub: 'Live chart', href: pairUrl, external: true },
    { id: 'jupiter', label: 'Jupiter', sub: 'Swap', href: jupiterSwapUrl(mint), external: true },
    { id: 'solscan', label: 'Solscan', sub: 'Mint', href: solscanTokenUrl(mint), external: true },
    { id: 'stake', label: 'Stake', sub: 'Earn APY', href: '/stake', external: false },
    { id: 'litepaper', label: 'Litepaper', sub: 'Full docs', href: '/litepaper#aptc-token', external: false },
  ];
}

/** Allocation fill for wallet row (wallets 1–9 align with APTC_ALLOCATION order). */
export function getWalletAllocationColor(walletId) {
  return APTC_ALLOCATION[walletId - 1]?.fill ?? '#c026d3';
}
