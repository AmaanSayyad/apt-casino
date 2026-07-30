/**
 * APTC tokenomics — public-facing constants for litepaper + docs.
 * Public token-launch marketing has been removed from the site.
 */

import {
  getAptcMint,
  isAptcLaunched,
  getAptcPairAddress,
  getVirtualsTokenPageUrl,
  VIRTUALS_CREATE_URL,
  VIRTUALS_APP_URL,
  DEXSCREENER_CHAIN_SLUG,
} from './launchStatus';

/** @deprecated Launch schedule removed from public site */
const APTC_SCHEDULED_LAUNCH_LABEL = '';

export const VIRTUALS_LOGO_SRC = '/logos/virtuals-protocol.png';
export const ROBINHOOD_CHAIN_LOGO_SRC = '/logos/robinhood.png';
/** @deprecated Prefer VIRTUALS_LOGO_SRC */
export const PUMP_LOGO_SRC = VIRTUALS_LOGO_SRC;
/** @deprecated */
export const PUMP_PROGRAM_ID = '';

/** Kept for legacy PumpLaunchPanel / unused launch tooling imports */
export const VIRTUALS_LAUNCH_MODE = {
  label: 'TBA',
  tagline: 'Protocol token · rewards & staking',
  quotePair: 'USD',
  createUrl: VIRTUALS_CREATE_URL,
  appUrl: VIRTUALS_APP_URL,
  osUrl: '',
  chainSlug: DEXSCREENER_CHAIN_SLUG,
  chainLabel: 'Multichain',
  onChainNameSuffix: '',
  scheduledLaunchLabel: APTC_SCHEDULED_LAUNCH_LABEL,
  antiSniperSeconds: 0,
  veVirtualAirdropPct: 5,
  liquidityPoolPct: 93.5,
  teamInitialBuyPct: 1.5,
  teamInitialBuyTokens: 15_000_000,
  teamInitialBuyTokensShort: '15M',
  preBuyVirtualAmount: 0,
  launchFeeVirtual: 0,
  launchFdvUsdApprox: null,
  teamCliffMonths: 1,
  teamVestMonths: 6,
  launchAsAgent: false,
  byVirtualsSuffix: false,
  airdropEnabled: false,
};

/** @deprecated Alias — older call sites */
export const PUMP_LAUNCH_MODE = {
  label: VIRTUALS_LAUNCH_MODE.label,
  tagline: VIRTUALS_LAUNCH_MODE.tagline,
  mayhemMode: false,
  cashbackEnabled: false,
  quotePair: VIRTUALS_LAUNCH_MODE.quotePair,
  createUrl: VIRTUALS_LAUNCH_MODE.createUrl,
  feesDocsUrl: VIRTUALS_LAUNCH_MODE.appUrl,
  publicDocsUrl: VIRTUALS_LAUNCH_MODE.osUrl,
  devHoldPct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
  curveSupplyPct: VIRTUALS_LAUNCH_MODE.liquidityPoolPct,
  migrationLpPct: VIRTUALS_LAUNCH_MODE.veVirtualAirdropPct,
  curveCreatorFeePct: 0,
  curveProtocolFeePct: 0,
  curveTotalFeePct: 0,
  pumpswapFeeFloorPct: 0,
  graduationSolApprox: 0,
  migrationFeeSol: 0,
  createFeeSol: 0,
};

export const APTC_TOKENOMICS = {
  name: 'AptCasino.fun',
  displayName: 'AptCasino.fun',
  symbol: 'APTC',
  chain: 'Multichain (Solana · Aptos · EVM)',
  maxSupply: '1,000,000,000',
  decimals: 18,
  get mint() {
    return getAptcMint();
  },
  launchVenue: 'TBA',
  launchPlatformUrl: getVirtualsTokenPageUrl() || '/',
  feeMode: 'DEFAULT',
  feeModeLabel: 'Protocol token',
  launch:
    'APTC is the rewards, staking, referral, and value-accrual layer for APT-Casino. Public launch details will be published when ready.',
  authorities: {
    mintRevoked: true,
    freezeRevoked: true,
    updateRevoked: true,
    pumpBondingCurve: false,
    virtualsAgent: false,
  },
  feeShare: {
    enabled: true,
    claimer: '@aptcasinofun',
    bps: 10_000,
    label: '100% protocol growth fees → operations wallet',
  },
};

/** Launch metrics — kept for legacy imports; not marketed on-site */
export const APTC_LAUNCH_METRICS = {
  pair: 'APTC',
  dex: 'DEX (when published)',
  launchPlatform: 'TBA',
  chain: VIRTUALS_LAUNCH_MODE.chainLabel,
  totalSupplyShort: '1B',
  liquidityPoolPct: VIRTUALS_LAUNCH_MODE.liquidityPoolPct,
  veVirtualAirdropPct: VIRTUALS_LAUNCH_MODE.veVirtualAirdropPct,
  teamInitialBuyPct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
  devHoldPct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
  curveSupplyPct: VIRTUALS_LAUNCH_MODE.liquidityPoolPct,
  migrationLpPct: VIRTUALS_LAUNCH_MODE.veVirtualAirdropPct,
  graduationSol: 0,
  devBuySupplyPct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
  devBuyTokensShort: VIRTUALS_LAUNCH_MODE.teamInitialBuyTokensShort,
  tradeFeePreMigrationPct: null,
  tradeFeePostMigrationFloorPct: null,
  curveCreatorFeePct: null,
  antiSniperSeconds: VIRTUALS_LAUNCH_MODE.antiSniperSeconds,
  launchFdvUsdApprox: VIRTUALS_LAUNCH_MODE.launchFdvUsdApprox,
  preBuyVirtualAmount: VIRTUALS_LAUNCH_MODE.preBuyVirtualAmount,
  scheduledLaunchLabel: VIRTUALS_LAUNCH_MODE.scheduledLaunchLabel,
  approxMarketCapUsd: VIRTUALS_LAUNCH_MODE.launchFdvUsdApprox,
  approxSpotFdvUsd: VIRTUALS_LAUNCH_MODE.launchFdvUsdApprox,
  approxAverageFdvUsd: null,
  approxTokenPriceUsd: null,
  get pumpTokenUrl() {
    return virtualsTokenUrl(getAptcMint());
  },
  get virtualsTokenUrl() {
    return virtualsTokenUrl(getAptcMint());
  },
  get dexscreenerPairUrl() {
    const pair = getAptcPairAddress();
    return pair ? dexscreenerPairUrl(pair) : null;
  },
};

/** Illustrative supply allocation (charts / litepaper) */
export const APTC_ALLOCATION = [
  {
    label: 'Liquidity pool',
    pct: VIRTUALS_LAUNCH_MODE.liquidityPoolPct,
    tokensShort: '935M',
    fill: '#2dd4bf',
    color: 'from-teal-400 to-cyan-500',
    detail: 'Majority of supply reserved for public liquidity when trading is published.',
  },
  {
    label: 'Community & ecosystem',
    pct: VIRTUALS_LAUNCH_MODE.veVirtualAirdropPct,
    tokensShort: '50M',
    fill: '#f59e0b',
    color: 'from-amber-500 to-orange-500',
    detail: 'Community, ecosystem, and partner distribution — details at public release.',
  },
  {
    label: 'Team / ops (vested)',
    pct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
    tokensShort: VIRTUALS_LAUNCH_MODE.teamInitialBuyTokensShort,
    fill: '#a78bfa',
    color: 'from-violet-400 to-purple-500',
    detail: 'Vested team / ops allocation for growth — listings, rewards, and protocol ops.',
  },
];

/** How @aptcasinofun deploys team pre-buy + protocol growth capital */
export const CREATOR_BUY_DEPLOYMENT = [
  {
    label: 'Tier 1, 2 & 3 listings',
    pct: 50,
    fill: '#c084fc',
    detail:
      'Largest share — DEX & trader tools, aggregators (CoinGecko, CMC), CEX roadmap',
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
  'Every APTC from the 1.5% vested team initial buy is deployed only for platform growth. The largest share funds Tier 1, 2 & 3 listings (DEX → aggregators → CEX). No wash volume. No fake FDV. No dumps.';

export const APTC_TRANSPARENCY = {
  headline: 'The green flag checklist',
  subhead:
    'What snipers, bots, agents, and degens scan before they buy — and how APTC answers each one.',
  pledge:
    'We are not hiding supply behind clusters, bundles, or fake metrics. No wash volume. No fake FDV. No dumps. APTC is the rewards and value-accrual layer for a live GambleFi product with on-chain casino revenue. Every ops-wallet token exists to grow the platform — not to extract from it.',
  opsWalletRule:
    'Ops / treasury wallets · listings-first deployment · no wash · no fake FDV · no dumps',
};

export const APTC_TRADER_GREEN_FLAGS = [
  {
    term: 'Product',
    status: 'Live casino',
    detail: 'Provably fair games shipping on Solana + Aptos today.',
  },
  {
    term: 'Supply',
    status: '1B fixed',
    detail: 'Fixed max supply design with revoked mint/freeze when published.',
  },
  {
    term: 'Liquidity',
    status: 'Majority LP',
    detail: 'Majority of supply reserved for public liquidity at release.',
  },
  {
    term: 'Community',
    status: 'Aligned',
    detail: 'Community / ecosystem allocation — not a stealth dump wallet.',
  },
  {
    term: 'Team / founder allocation',
    status: 'Vested',
    detail: 'Vested team / ops allocation for growth — no unlocked founder dump.',
  },
  {
    term: 'Utility',
    status: 'GGR flywheel',
    detail: 'Casino GGR funds open-market buybacks · burn · stakers · treasury.',
  },
  {
    term: 'Volume & metrics',
    status: 'Organic',
    detail: 'Real casino GGR & wallets on-chain — no wash volume, no bot-inflated stats.',
  },
  {
    term: 'Supply dumps',
    status: 'No dumps',
    detail: 'Team / ops allocation is vested; liquidity is public float.',
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
  'Supply dumps from hidden or unlocked team wallets',
  'Hidden multi-wallet coordinated sells',
  'Empty utility with no shipping product',
];

export const APTC_WALLETS = [
  {
    id: 1,
    label: 'Operations & treasury',
    amount: 'Ops',
    amountShort: 'Ops',
    pct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
    address: null,
    purpose:
      'Vested team / ops allocation — listings, community rewards, staking, and protocol growth. Platform growth only.',
    purposeShort: 'Vested · growth only',
  },
];

export const APTC_LAUNCH_STEPS = [
  'Token published',
  'Liquidity live',
  'DexScreener',
  'GGR flywheel',
];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Product live',
    detail: 'Casino games shipping · GGR accruing · referrals & stake UI ready',
  },
  {
    step: '2',
    title: 'Token published',
    detail: 'Public mint + liquidity when ready · majority float for trading',
  },
  {
    step: '3',
    title: 'Discovery',
    detail: 'DexScreener · aggregators · trader tooling',
  },
  {
    step: '4',
    title: 'Flywheel on',
    detail: 'Casino GGR buybacks · staking · listings',
  },
];

export const BUYBACK_SPLIT_COLORS = {
  burn: '#fb7185',
  stakers: '#a78bfa',
  treasury: '#fbbf24',
  toMarket: '#34d399',
};

export const GGR_FLYWHEEL_STEPS = [
  { step: '1', title: 'Play', desc: 'Bets on-chain' },
  { step: '2', title: 'GGR', desc: 'House edge revenue' },
  { step: '3', title: 'Buyback', desc: 'Market buys APTC' },
  { step: '4', title: 'Distribute', desc: 'Burn · stake · treasury' },
];

export const APTC_UTILITY = [
  {
    title: 'Casino flywheel',
    body: 'Live GGR from Plinko, Mines, Wheel & Roulette → open-market APTC buybacks.',
  },
  {
    title: 'Rewards layer',
    body: 'APTC accrues value from real play — not a memo with no shipping product.',
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

/** @deprecated Create-form copy — unused on public site */
export const VIRTUALS_FORM_COPY = {
  description: 'AptCasino.fun ($APTC) is live GambleFi — Plinko, Mines, Roulette & Wheel with on-chain play.',
  howItWorks:
    'Play on aptcasino.fun → house edge (GGR) accrues → protocol buys APTC on the open market → burn, stake rewards, and treasury.',
  roadmap: 'Product shipping → stake & buyback rails → listings → CEX expansion.',
  additionalDetails: 'CEO @AptCasinofun. Website aptcasino.fun. No wash volume, no fake FDV, no dumps.',
  tokenUtility:
    'APTC powers the casino flywheel (GGR buybacks), staking rewards, and referrals/Volume Cup prizes.',
};

export function getAllocationSummary() {
  return '1B APTC fixed supply · majority liquidity · community · vested ops · no wash · no fake FDV · no dumps.';
}

export function getCreatorBuyDeploymentLines() {
  return CREATOR_BUY_DEPLOYMENT.map((row) => `${row.pct}% — ${row.label}`);
}

export function truncateAddress(addr, chars = 4) {
  if (!addr || addr.length < chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export function virtualsTokenUrl(_mint = APTC_TOKENOMICS.mint) {
  return getVirtualsTokenPageUrl();
}

/** @deprecated Use virtualsTokenUrl */
export function pumpTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return virtualsTokenUrl(mint);
}

/** @deprecated Use virtualsTokenUrl */
export function bagsTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return virtualsTokenUrl(mint);
}

export function dexscreenerTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}/${mint}`;
}

export function dexscreenerPairUrl(pairAddress) {
  return `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}/${pairAddress}`;
}

/** Robinhood / EVM explorer — DexScreener token page as primary explorer link */
export function explorerTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return dexscreenerTokenUrl(mint);
}

/** @deprecated Solana Solscan — redirects to DexScreener on Robinhood */
export function solscanTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return explorerTokenUrl(mint);
}

export function solscanAccountUrl(address) {
  return `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}/${address}`;
}

/** Uniswap-style trade deep link is chain-specific; use DexScreener until pair is live */
export function jupiterSwapUrl(mint = APTC_TOKENOMICS.mint) {
  return dexscreenerTokenUrl(mint);
}

/** @deprecated */
export function meteoraPoolUrl(mint = APTC_TOKENOMICS.mint) {
  return virtualsTokenUrl(mint);
}

export function getAptcTradeLinks(options = {}) {
  const launched = isAptcLaunched();
  const mint = APTC_TOKENOMICS.mint;
  const pairUrl =
    options.pairUrl ||
    (APTC_LAUNCH_METRICS.dexscreenerPairUrl ?? null) ||
    (launched ? dexscreenerTokenUrl(mint) : null);
  const explorerHref = launched ? explorerTokenUrl(mint) : `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}`;
  const dexscreenerHref = pairUrl || `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}`;

  return [
    {
      id: 'dexscreener',
      label: 'DexScreener',
      sub: launched ? 'Live chart' : 'Charts',
      href: dexscreenerHref,
      external: true,
      logo: '/logos/dexscreener.png',
    },
    {
      id: 'explorer',
      label: 'Explorer',
      sub: launched ? 'Contract' : 'Charts',
      href: explorerHref,
      external: true,
      logo: '/logos/dexscreener.png',
    },
    {
      id: 'stake',
      label: 'Stake',
      sub: 'Earn APY',
      href: '/stake',
      external: false,
      logo: '/APTC_logo_1000x1000.png',
    },
    {
      id: 'litepaper',
      label: 'Litepaper',
      sub: 'Full docs',
      href: '/litepaper#aptc-token',
      external: false,
      logo: '/APTC_logo_1000x1000.png',
    },
  ];
}

export function getWalletAllocationColor(walletId) {
  const row = APTC_ALLOCATION[walletId - 1];
  return row?.fill ?? '#06b6d4';
}

/** @deprecated */
export function raydiumSwapUrl(mint = APTC_TOKENOMICS.mint) {
  return dexscreenerTokenUrl(mint);
}
