/**
 * APTC tokenomics — public-facing constants for landing + litepaper + docs.
 * Launch: Bags.fm fair bonding curve (Founder / Default mode) → Meteora DAMM v2.
 * @see https://docs.bags.fm/how-to-guides/customize-token-fees
 * @see https://docs.bags.fm/how-to-guides/initial-buy-math
 */

import { getAptcMint, isAptcLaunched, getAptcPairAddress } from './launchStatus';

/** Bags Default config — 2% pre/post migration, 25% fee compounding post-migration, ~85 SOL graduation */
export const BAGS_DEFAULT_CONFIG_ID = 'fa29606e-5e48-4c37-827f-4b03d58ee23d';

/** Public Bags.fm brand mark */
export const BAGS_LOGO_SRC = '/bagsapp.png';

export const APTC_TOKENOMICS = {
  name: 'AptCasino.fun',
  symbol: 'APTC',
  chain: 'Solana (SPL · Bags + Meteora)',
  maxSupply: '1,000,000,000',
  decimals: 9,
  get mint() {
    return getAptcMint();
  },
  launchVenue: 'Bags.fm · Meteora DBC → DAMM v2',
  launchPlatformUrl: 'https://bags.fm/launch',
  feeMode: 'DEFAULT',
  feeModeLabel: 'Founder mode (Default)',
  bagsConfigId: BAGS_DEFAULT_CONFIG_ID,
  launch:
    '100% fair bonding curve on Bags · Founder (Default) mode · 2% trade fee · Meteora DBC graduates at 85 SOL into DAMM v2.',
  authorities: {
    mintRevoked: true,
    freezeRevoked: true,
    updateRevoked: true,
    bagsTokenAuthority: true,
  },
  feeShare: {
    enabled: true,
    claimer: '@aptcasinofun',
    bps: 10_000,
    label: '100% of creator fee share → operations wallet',
  },
};

/** Bags / Meteora bonding-curve launch parameters */
export const APTC_LAUNCH_METRICS = {
  pair: 'APTC/SOL',
  dex: 'Bags.fm · Meteora Dynamic Bonding Curve → DAMM v2',
  launchPlatform: 'Bags.fm',
  meteoraPrograms: {
    dbc: 'dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN',
    dammV2: 'cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG',
    bagsFeeShareV2: 'FEE2tBhCKAt7shrod19QttSVREUYPiyMzoku1mL1gqVK',
  },
  totalSupplyShort: '1B',
  graduationSol: 85,
  migrationQuoteLamports: 85_000_000_000,
  initialBuyUsd: 610,
  initialBuyPct: 23,
  initialBuyTokensShort: '230M',
  initialBuySolApprox: 8.6,
  tradeFeePreMigrationPct: 2,
  tradeFeePostMigrationPct: 2,
  creatorFeePreMigrationPct: 1,
  creatorFeePostMigrationPct: 0.75,
  protocolFeePreMigrationPct: 1,
  protocolFeePostMigrationPct: 0.75,
  feeCompoundingPostMigrationPct: 0.5,
  /** Average-cost FDV implied by $610 for 23% of supply */
  approxAverageFdvUsd: 2_650,
  /** Typical spot FDV on indexers right after a ~23% creator buy (curve marginal price) */
  approxSpotFdvUsd: 11_500,
  approxMarketCapUsd: 11_500,
  /** Pre-graduation: virtual curve — no standalone Raydium-style LP */
  approxLiquidityUsd: 610,
  approxLiquidityUsdPreGrad: null,
  /** ~85 SOL side at graduation threshold (real DAMM v2 seed) */
  approxLiquidityUsdAtGraduation: 6_060,
  approxTokenPriceUsd: 0.0000115,
  lpBurnPct: null,
  lockedAptc: null,
  lockedSol: null,
  get bagsPoolUrl() {
    const mint = getAptcMint();
    return isAptcLaunched() ? `https://bags.fm/${mint}` : 'https://bags.fm/launch';
  },
  get dexscreenerPairUrl() {
    const pair = getAptcPairAddress();
    return pair ? `https://dexscreener.com/solana/${pair}` : null;
  },
};

/** Supply at TGE — creator initial buy + public bonding curve (no team / founder / VC slice) */
export const APTC_ALLOCATION = [
  {
    label: 'Creator initial buy',
    pct: 23,
    tokensShort: '230M',
    fill: '#ec4899',
    color: 'from-fuchsia-500 to-pink-500',
    detail:
      '230M APTC · @aptcasinofun ops wallet · largest share → Tier 1–3 listings (DEX → CEX)',
  },
  {
    label: 'Bonding curve (public)',
    pct: 77,
    tokensShort: '770M',
    fill: '#a78bfa',
    color: 'from-violet-500 to-purple-500',
    detail: 'Fair Bags / Meteora DBC · organic buyers only · graduates at 85 SOL → DAMM v2',
  },
];

/** How the 23% creator initial buy (230M APTC) is deployed — 100% of one ops wallet */
export const CREATOR_BUY_TOTAL_TOKENS = 230_000_000;

export const CREATOR_BUY_DEPLOYMENT = [
  {
    label: 'Tier 1, 2 & 3 listings',
    pct: 42,
    tokensShort: '96.6M',
    fill: '#c084fc',
    detail:
      'Largest share of the 23% — Tier 1 Listings DEX & trader tools (Bags, Meteora, DexScreener, Jupiter), Tier 2 aggregators (CoinGecko, CMC), Tier 3 CEX roadmap (MEXC, Gate, KuCoin, Bybit, OKX, Binance)',
    highlight: true,
  },
  {
    label: 'Liquidity & market making',
    pct: 22,
    tokensShort: '50.6M',
    fill: '#60a5fa',
    detail: 'Post-graduation depth · MM coordination for listings · no surprise LP dumps',
  },
  {
    label: 'Community & player rewards',
    pct: 18,
    tokensShort: '41.4M',
    fill: '#a78bfa',
    detail: 'Volume Cup, referrals, streaks, cashback — organic players only',
  },
  {
    label: 'Staking emissions',
    pct: 10,
    tokensShort: '23M',
    fill: '#34d399',
    detail: 'On-chain /stake pools · aligned with GGR buyback flywheel',
  },
  {
    label: 'Treasury & protocol ops',
    pct: 8,
    tokensShort: '18.4M',
    fill: '#fbbf24',
    detail: 'Infrastructure, audits, runway — not founder extraction',
  },
];

export const CREATOR_BUY_PURPOSE =
  'Every single APTC from the creator wallet — initial buy and 100% of Bags fee share — is deployed only for platform growth. The largest share funds Tier 1, 2 & 3 listings (DEX → aggregators → CEX). No founder allocation. No team allocation. No wash volume. No fake FDV. No dumps.';

export const APTC_TRANSPARENCY = {
  headline: 'The green flag checklist',
  subhead:
    'What snipers, bots, agents, and degens scan before they buy — and how APTC answers each one.',
  pledge:
    'We are not hiding supply behind clusters, bundles, or fake metrics. No wash volume. No fake FDV. No dumps. APTC is a live GambleFi product with a fair Bags curve, revoked authorities, one public ops wallet, and on-chain casino revenue. Every creator-wallet token exists to grow the platform — not to extract from it.',
  opsWalletRule:
    '230M creator buy + 100% fee share → @aptcasinofun only · listings-first deployment · no wash · no fake FDV · no dumps',
};

/**
 * Trader / bot due-diligence terms — explicit green flags (what scanners look for).
 * status: short label shown on card; detail: plain-language proof.
 */
export const APTC_TRADER_GREEN_FLAGS = [
  {
    term: 'Mint authority',
    status: 'Revoked',
    detail: 'Fixed 1B supply — no hidden inflation or stealth mints.',
  },
  {
    term: 'Freeze authority',
    status: 'Revoked',
    detail: 'No wallet freeze rug — holders can always move tokens.',
  },
  {
    term: 'Update authority',
    status: 'Bags Token Authority',
    detail: 'Metadata & fee routing on Bags — not a custom honeypot contract.',
  },
  {
    term: 'Team / founder allocation',
    status: '0%',
    detail: 'No VC slice, no advisor unlock, no separate “team wallet” line item.',
  },
  {
    term: 'Bundled wallets',
    status: 'None',
    detail: 'No launch-day wallet clusters or same-block insider snipes from us.',
  },
  {
    term: 'Supply at TGE',
    status: '23% / 77%',
    detail: '$610 creator buy on curve + 77% fair public bonding — not a 90% dev bag.',
  },
  {
    term: 'Creator wallet use',
    status: 'Growth only',
    detail: 'Largest slice → Tier 1–3 listings (DEX → CEX). Rest → liquidity, rewards, staking.',
  },
  {
    term: 'Volume & metrics',
    status: 'Organic',
    detail: 'Real casino GGR & wallets on-chain — no wash volume, no bot-inflated stats.',
  },
  {
    term: 'FDV / market cap',
    status: 'No fake FDV',
    detail: 'Spot pricing from real curve trades — no misleading screenshot math or inflated FDV posts.',
  },
  {
    term: 'Supply dumps',
    status: 'No dumps',
    detail: 'No bundled wallets, no hidden multi-wallet sells, no team unlock cliffs.',
  },
  {
    term: 'Liquidity path',
    status: 'Meteora DBC → DAMM',
    detail: '85 SOL graduation threshold · public curve until migrate — no opaque presale.',
  },
  {
    term: 'Hidden wallets',
    status: 'None claimed',
    detail: 'One disclosed ops wallet (@aptcasinofun) — no shadow treasuries.',
  },
  {
    term: 'Transfer / sell tax',
    status: 'Standard Bags fees',
    detail: '2% trade fee on curve (1% creator + 1% protocol) — no custom honeypot tax.',
  },
  {
    term: 'Live product',
    status: 'Shipping',
    detail: 'Plinko, Mines, Roulette, Wheel live · GGR → open-market APTC buybacks.',
  },
];

/** Red flags we explicitly do not run — call out what scanners punish. */
export const APTC_RED_FLAGS_WE_AVOID = [
  'Bundled launch wallets or sniper clusters',
  'Wash volume or bot-inflated trade stats',
  'Fake FDV or misleading market-cap screenshots',
  'Supply dumps from hidden or team wallets',
  'Unlocked founder or team tranches',
  'Hidden multi-wallet coordinated sells',
  'Mint or freeze authority left with deployer',
  'Empty utility with no shipping product',
];

/** Single operations wallet — initial buy + 100% fee-share claimer */
export const APTC_WALLETS = [
  {
    id: 1,
    label: 'Operations & treasury',
    amount: '230,000,000',
    amountShort: '230M',
    pct: 23,
    address: null,
    purpose:
      'Initial buy at launch + 100% Bags fee share — largest allocation to Tier 1–3 listings (DEX → CEX), then liquidity, rewards, staking. Platform growth only. No wash volume. No fake FDV. No dumps.',
    purposeShort: 'Creator buy + fee share · growth only',
  },
];

export const APTC_LAUNCH_STEPS = [
  'Token live',
  'Bonding curve',
  'Graduate (85 SOL)',
  'DexScreener',
];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Token live',
    detail: '1B supply · Bags Token Authority · fee share to @aptcasinofun',
  },
  {
    step: '2',
    title: 'Bonding curve',
    detail: 'Meteora DBC · 2% trade fee · 23% creator buy · 77% on curve',
  },
  {
    step: '3',
    title: 'Graduation',
    detail: '85 SOL raised → auto-migrate to Meteora DAMM v2 pool',
  },
  {
    step: '4',
    title: 'Flywheel on',
    detail: 'Creator fees + GGR buybacks · staking · listings',
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
    body: 'Live GGR from Plinko, Mines, Wheel & Roulette → open-market APTC buybacks on Jupiter / Meteora.',
  },
  {
    title: 'Creator fee stream',
    body: '1% of bonding-curve volume (0.75% post-graduation) via Bags fee share — funds ops, rewards, and liquidity support.',
  },
  {
    title: 'Staking',
    body: 'Fixed-term pools on /stake · rewards from GGR buyback staker share.',
  },
  {
    title: 'Referrals & Volume Cup',
    body: 'On-chain referral rewards and seasonal leaderboard prizes funded from protocol revenue.',
  },
];

export const GGR_FLYWHEEL_STEPS = [
  { step: '1', title: 'Play', desc: 'Bets on-chain' },
  { step: '2', title: 'GGR', desc: 'House edge revenue' },
  { step: '3', title: 'Buyback', desc: 'Market buys APTC' },
  { step: '4', title: 'Distribute', desc: 'Burn · stake · treasury' },
];

/** Illustrative post-graduation liquidity vs FDV (grows with volume + fee compounding) */
export const APTC_LIQUIDITY_PROJECTIONS = [
  { fdvUsd: 50_000, liquidityUsdLow: 8_000, liquidityUsdHigh: 15_000 },
  { fdvUsd: 100_000, liquidityUsdLow: 15_000, liquidityUsdHigh: 28_000 },
  { fdvUsd: 200_000, liquidityUsdLow: 28_000, liquidityUsdHigh: 55_000 },
];

export function getAllocationSummary() {
  return '1B APTC fixed supply · 23% creator buy (listings-first) · 77% fair public bonding curve · 0% team/founder · no wash · no fake FDV · no dumps.';
}

export function getCreatorBuyDeploymentLines() {
  return CREATOR_BUY_DEPLOYMENT.map((row) => `${row.pct}% — ${row.label} (${row.tokensShort} APTC)`);
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

export function bagsTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return isAptcLaunched() ? `https://bags.fm/${mint}` : 'https://bags.fm/launch';
}

export function dexscreenerTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return `https://dexscreener.com/solana/${mint}`;
}

export function dexscreenerPairUrl(pairAddress) {
  return `https://dexscreener.com/solana/${pairAddress}`;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function jupiterSwapUrl(mint = APTC_TOKENOMICS.mint) {
  return `https://jup.ag/swap/SOL-${mint}`;
}

export function meteoraPoolUrl(mint = APTC_TOKENOMICS.mint) {
  return `https://app.meteora.ag/pools?search=${mint}`;
}

/** External + on-site trade / research links */
export function getAptcTradeLinks(options = {}) {
  const launched = isAptcLaunched();
  const mint = APTC_TOKENOMICS.mint;
  const pairUrl =
    options.pairUrl ||
    (APTC_LAUNCH_METRICS.dexscreenerPairUrl ?? null) ||
    (launched ? dexscreenerTokenUrl(mint) : null);
  const bagsHref = bagsTokenUrl(mint);
  const jupiterHref = launched ? jupiterSwapUrl(mint) : 'https://jup.ag/';
  const meteoraHref = launched ? meteoraPoolUrl(mint) : 'https://app.meteora.ag/';
  const solscanHref = launched ? solscanTokenUrl(mint) : 'https://solscan.io/';
  const dexscreenerHref = pairUrl || 'https://dexscreener.com/solana';

  return [
    { id: 'bags', label: 'Bags', sub: launched ? 'Token page' : 'Launch', href: bagsHref, external: true, logo: BAGS_LOGO_SRC },
    { id: 'dexscreener', label: 'DexScreener', sub: launched ? 'Live chart' : 'Charts', href: dexscreenerHref, external: true, logo: '/logos/dexscreener.png' },
    { id: 'jupiter', label: 'Jupiter', sub: launched ? 'Swap' : 'Aggregator', href: jupiterHref, external: true, logo: '/logos/jupiter.jpg' },
    { id: 'meteora', label: 'Meteora', sub: launched ? 'DAMM v2 pool' : 'DEX', href: meteoraHref, external: true, logo: '/logos/meteora-logo.png' },
    { id: 'solscan', label: 'Solscan', sub: launched ? 'Mint' : 'Explorer', href: solscanHref, external: true, logo: 'https://solscan.io/favicon.ico' },
    { id: 'stake', label: 'Stake', sub: 'Earn APY', href: '/stake', external: false, logo: '/APTC_logo_1000x1000.png' },
    { id: 'litepaper', label: 'Litepaper', sub: 'Full docs', href: '/litepaper#aptc-token', external: false, logo: '/APTC_logo_1000x1000.png' },
  ];
}

export function getWalletAllocationColor(walletId) {
  const row = APTC_ALLOCATION[walletId - 1];
  return row?.fill ?? '#06b6d4';
}

/** @deprecated Raydium launch — post-TGE swaps may route via Jupiter/Meteora */
export function raydiumSwapUrl(mint = APTC_TOKENOMICS.mint) {
  return jupiterSwapUrl(mint);
}
