/**
 * APTC tokenomics — public-facing constants for landing + litepaper + docs.
 * Launch: Bags.fm SpaceX Mode (96% locked · 4% float) → Meteora DBC → DAMM v2.
 * @see https://docs.bags.fm/how-to-guides/customize-token-fees
 * @see https://docs.bags.fm/how-to-guides/initial-buy-math
 */

import { getAptcMint, isAptcLaunched, getAptcPairAddress } from './launchStatus';

/** Bags SpaceX Mode — 4% float, 96% locked, dynamic 2%→0.5% fees, 25% fee compounding post-migration, ~55 SOL graduation */
export const BAGS_SPACEX_CONFIG_ID = 'ba28db46-ea6f-4452-8218-5587f6aca0a1';

/** @deprecated Use BAGS_SPACEX_CONFIG_ID */
export const BAGS_DEFAULT_CONFIG_ID = BAGS_SPACEX_CONFIG_ID;

/** Public Bags.fm brand mark */
export const BAGS_LOGO_SRC = '/bagsapp.png';

/** Bags SpaceX Mode — modeled after the SpaceX IPO (4% float, dynamic fees, compounding). */
export const BAGS_SPACEX_MODE = {
  label: 'SpaceX Mode',
  tagline: 'Modeled after the SpaceX IPO',
  floatPct: 4,
  lockedPct: 96,
  tradeFeeStartPct: 2,
  tradeFeeFloorPct: 0.5,
  feeCompoundingPct: 25,
  docsUrl: 'https://docs.bags.fm/how-to-guides/customize-token-fees',
  bagsAppUrl: 'https://bags.fm/launch',
};

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
  feeMode: 'SPACEX',
  feeModeLabel: 'SpaceX Mode',
  bagsConfigId: BAGS_SPACEX_CONFIG_ID,
  launch:
    'Bags SpaceX Mode · 4% float at TGE · 96% supply locked · dynamic 2%→0.5% trade fees · 25% post-migration fee compounding · Meteora DBC graduates at ~55 SOL into DAMM v2.',
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
  floatPct: BAGS_SPACEX_MODE.floatPct,
  lockedPct: BAGS_SPACEX_MODE.lockedPct,
  graduationSol: 55,
  migrationQuoteLamports: 55_000_000_000,
  /** Creator kickstart buy from the 4% float (listings-first ops) */
  initialBuyUsd: 610,
  initialBuySolApprox: 8.6,
  tradeFeePreMigrationPct: BAGS_SPACEX_MODE.tradeFeeStartPct,
  tradeFeePostMigrationStartPct: BAGS_SPACEX_MODE.tradeFeeStartPct,
  tradeFeePostMigrationFloorPct: BAGS_SPACEX_MODE.tradeFeeFloorPct,
  feeCompoundingPostMigrationPct: BAGS_SPACEX_MODE.feeCompoundingPct,
  /** Target circulating market cap at TGE (4% float) */
  approxMarketCapUsd: 50_000,
  /** FDV implied by $50k MC on 4% float ($50k ÷ 0.04) */
  approxSpotFdvUsd: 1_250_000,
  approxAverageFdvUsd: 1_250_000,
  approxTokenPriceUsd: 0.00125,
  get bagsPoolUrl() {
    const mint = getAptcMint();
    return isAptcLaunched() ? `https://bags.fm/${mint}` : 'https://bags.fm/launch';
  },
  get dexscreenerPairUrl() {
    const pair = getAptcPairAddress();
    return pair ? `https://dexscreener.com/solana/${pair}` : null;
  },
};

/** Supply at TGE — SpaceX Mode float vs locked (no team / founder / VC slice) */
export const APTC_ALLOCATION = [
  {
    label: 'Locked supply',
    pct: 96,
    tokensShort: '960M',
    fill: '#6366f1',
    color: 'from-indigo-500 to-violet-600',
    detail:
      '96% locked at launch per Bags SpaceX Mode — protocol lock, not a hidden team wallet. Unlocks follow Bags rules.',
  },
  {
    label: 'Float at launch',
    pct: 4,
    tokensShort: '40M',
    fill: '#ec4899',
    color: 'from-fuchsia-500 to-pink-500',
    detail:
      '4% circulating on Bags bonding curve at TGE — modeled after SpaceX IPO scarcity · organic buyers on Meteora DBC until ~55 SOL graduation',
  },
];

/** How @aptcasinofun deploys creator initial buy + 100% Bags fee share */
export const CREATOR_BUY_DEPLOYMENT = [
  {
    label: 'Tier 1, 2 & 3 listings',
    pct: 50,
    fill: '#c084fc',
    detail:
      'Largest share — Tier 1 DEX & trader tools (Bags, Meteora, DexScreener, Jupiter), Tier 2 aggregators (CoinGecko, CMC), Tier 3 CEX roadmap (MEXC, Gate, KuCoin, Bybit, OKX, Binance)',
    highlight: true,
  },
  {
    label: 'Community & player rewards',
    pct: 26,
    fill: '#a78bfa',
    detail: 'Volume Cup, referrals, streaks, cashback — organic players only',
  },
  {
    label: 'Staking emissions',
    pct: 14,
    fill: '#34d399',
    detail: 'On-chain /stake pools · aligned with GGR buyback flywheel',
  },
  {
    label: 'Treasury & protocol ops',
    pct: 10,
    fill: '#fbbf24',
    detail: 'Infrastructure, audits, runway — not founder extraction',
  },
];

export const CREATOR_BUY_PURPOSE =
  'Every APTC from the creator initial buy and 100% of Bags fee share is deployed only for platform growth. The largest share funds Tier 1, 2 & 3 listings (DEX → aggregators → CEX). No founder allocation. No team allocation. No wash volume. No fake FDV. No dumps.';

export const APTC_TRANSPARENCY = {
  headline: 'The green flag checklist',
  subhead:
    'What snipers, bots, agents, and degens scan before they buy — and how APTC answers each one.',
  pledge:
    'We are not hiding supply behind clusters, bundles, or fake metrics. No wash volume. No fake FDV. No dumps. APTC is a live GambleFi product with Bags SpaceX Mode (4% float), revoked authorities, one public ops wallet, and on-chain casino revenue. Every creator-wallet token exists to grow the platform — not to extract from it.',
  opsWalletRule:
    'Creator initial buy + 100% fee share → @aptcasinofun only · listings-first deployment · no wash · no fake FDV · no dumps',
};

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
    status: '4% float',
    detail: 'Only 4% circulating at launch (SpaceX Mode) — 96% locked by Bags, not a dev bag.',
  },
  {
    term: 'Creator wallet use',
    status: 'Growth only',
    detail: 'Largest slice → Tier 1–3 listings (DEX → CEX). Rest → rewards, staking, ops.',
  },
  {
    term: 'Volume & metrics',
    status: 'Organic',
    detail: 'Real casino GGR & wallets on-chain — no wash volume, no bot-inflated stats.',
  },
  {
    term: 'FDV / market cap',
    status: 'No fake FDV',
    detail: 'Starting ~$50k MC on 4% float — pricing from real curve trades, not inflated posts.',
  },
  {
    term: 'Supply dumps',
    status: 'No dumps',
    detail: 'No bundled wallets, no hidden multi-wallet sells, no team unlock cliffs.',
  },
  {
    term: 'Launch mode',
    status: 'SpaceX Mode',
    detail: 'Bags default · 4% float · dynamic 2%→0.5% fees · 25% fee compounding after migration.',
  },
  {
    term: 'Hidden wallets',
    status: 'None claimed',
    detail: 'One disclosed ops wallet (@aptcasinofun) — no shadow treasuries.',
  },
  {
    term: 'Transfer / sell tax',
    status: 'Bags SpaceX fees',
    detail: '2% on curve; post-migration fee scales down from 2% toward 0.5% as market cap grows.',
  },
  {
    term: 'Live product',
    status: 'Shipping',
    detail: 'Plinko, Mines, Roulette, Wheel live · GGR → open-market APTC buybacks.',
  },
];

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

export const APTC_WALLETS = [
  {
    id: 1,
    label: 'Operations & treasury',
    amount: 'TGE',
    amountShort: 'Ops',
    pct: null,
    address: null,
    purpose:
      'Creator initial buy from the 4% float + 100% Bags fee share — largest allocation to Tier 1–3 listings (DEX → CEX), then community rewards, staking, and protocol ops. Platform growth only.',
    purposeShort: 'Creator buy + fee share · growth only',
  },
];

export const APTC_LAUNCH_STEPS = [
  'Token live',
  '4% float curve',
  'Graduate (~55 SOL)',
  'DexScreener',
];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Token live',
    detail: '1B supply · Bags SpaceX Mode · 96% locked · fee share to @aptcasinofun',
  },
  {
    step: '2',
    title: '4% float curve',
    detail: 'Meteora DBC · 2% trade fee · ~$50k starting MC target on circulating float',
  },
  {
    step: '3',
    title: 'Graduation',
    detail: '~55 SOL raised → auto-migrate to Meteora DAMM v2 · fees begin scaling 2%→0.5%',
  },
  {
    step: '4',
    title: 'Flywheel on',
    detail: '25% of post-migration fees compound · creator fees + GGR buybacks · staking · listings',
  },
];

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
    body: '100% Bags fee share to @aptcasinofun — dynamic 2%→0.5% trading fees fund listings, rewards, and ops.',
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

export function getAllocationSummary() {
  return '1B APTC fixed supply · Bags SpaceX Mode · 4% float at TGE · 96% locked · ~$50k starting MC · dynamic 2%→0.5% fees · 0% team/founder · no wash · no fake FDV · no dumps.';
}

export function getCreatorBuyDeploymentLines() {
  return CREATOR_BUY_DEPLOYMENT.map((row) => `${row.pct}% — ${row.label}`);
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
