/**
 * APTC tokenomics — public-facing constants for landing + litepaper + docs.
 * Launch: Virtuals Protocol on Robinhood Chain (agent token · EconomyOS · Uniswap LP).
 * @see https://app.virtuals.io/create
 * @see https://os.virtuals.io/
 * @see https://dexscreener.com/robinhood
 */

import {
  getAptcMint,
  isAptcLaunched,
  getAptcPairAddress,
  getVirtualsTokenPageUrl,
  VIRTUALS_CREATE_URL,
  VIRTUALS_APP_URL,
  DEXSCREENER_CHAIN_SLUG,
  APTC_SCHEDULED_LAUNCH_LABEL,
} from './launchStatus';

/** Virtuals Protocol brand asset (local) */
export const VIRTUALS_LOGO_SRC = '/logos/virtuals-protocol.png';

/** Robinhood Chain brand asset (local) */
export const ROBINHOOD_CHAIN_LOGO_SRC = '/logos/robinhood.png';

/** @deprecated Prefer VIRTUALS_LOGO_SRC */
export const PUMP_LOGO_SRC = VIRTUALS_LOGO_SRC;

/** @deprecated Legacy Pump program id — unused for Virtuals launch */
export const PUMP_PROGRAM_ID = '';

/**
 * Virtuals Protocol launch mode — Robinhood Chain agent token.
 * Matches create-form: LP 93.5% · veVIRTUAL airdrop 5% · team pre-buy 1.5% (vested).
 */
export const VIRTUALS_LAUNCH_MODE = {
  label: 'Virtuals · Robinhood',
  tagline: 'Agent token on EconomyOS · Uniswap LP on Robinhood Chain',
  quotePair: 'VIRTUAL',
  createUrl: VIRTUALS_CREATE_URL,
  appUrl: VIRTUALS_APP_URL,
  osUrl: 'https://os.virtuals.io/',
  chainSlug: DEXSCREENER_CHAIN_SLUG,
  chainLabel: 'Robinhood Chain',
  onChainNameSuffix: 'by Virtuals',
  scheduledLaunchLabel: APTC_SCHEDULED_LAUNCH_LABEL,
  /** Anti-sniper window from Advanced Config */
  antiSniperSeconds: 60,
  /** veVIRTUAL staker airdrop (fixed) */
  veVirtualAirdropPct: 5,
  /** Seeded Uniswap liquidity */
  liquidityPoolPct: 93.5,
  /** Team / creator pre-buy at TGE */
  teamInitialBuyPct: 1.5,
  teamInitialBuyTokens: 15_000_000,
  teamInitialBuyTokensShort: '15M',
  /** Pre-buy cost on Virtuals form */
  preBuyVirtualAmount: 138,
  launchFeeVirtual: 138,
  /** Illustrative FDV at pre-buy (from create UI — not a price guarantee) */
  launchFdvUsdApprox: 5379.67,
  /** Vesting on team initial buy */
  teamCliffMonths: 1,
  teamVestMonths: 6,
  launchAsAgent: true,
  byVirtualsSuffix: true,
  airdropEnabled: true,
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
  displayName: 'AptCasino.fun by Virtuals',
  symbol: 'APTC',
  chain: 'Robinhood Chain (Virtuals Protocol · EconomyOS)',
  maxSupply: '1,000,000,000',
  decimals: 18,
  get mint() {
    return getAptcMint();
  },
  launchVenue: 'Virtuals Protocol → Robinhood Chain',
  launchPlatformUrl: getVirtualsTokenPageUrl(),
  feeMode: 'VIRTUALS_DEFAULT',
  feeModeLabel: 'Virtuals agent launch',
  launch:
    'Virtuals Protocol agent token on Robinhood Chain · 93.5% Uniswap LP · 5% veVIRTUAL airdrop · 1.5% team pre-buy (1-month cliff · 6-month vest) · EconomyOS agent · anti-sniper 60s · launches 27 Jul 2026 · 11:30 AM IST · on-chain name “AptCasino.fun by Virtuals”.',
  authorities: {
    mintRevoked: true,
    freezeRevoked: true,
    updateRevoked: true,
    pumpBondingCurve: false,
    virtualsAgent: true,
  },
  feeShare: {
    enabled: true,
    claimer: '@aptcasinofun',
    bps: 10_000,
    label: '100% protocol growth fees → operations wallet',
  },
};

/** Virtuals / Robinhood launch parameters */
export const APTC_LAUNCH_METRICS = {
  pair: 'APTC/VIRTUAL',
  dex: 'Virtuals Protocol · Uniswap on Robinhood Chain',
  launchPlatform: 'Virtuals Protocol',
  chain: VIRTUALS_LAUNCH_MODE.chainLabel,
  totalSupplyShort: '1B',
  liquidityPoolPct: VIRTUALS_LAUNCH_MODE.liquidityPoolPct,
  veVirtualAirdropPct: VIRTUALS_LAUNCH_MODE.veVirtualAirdropPct,
  teamInitialBuyPct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
  /** Alias used by older PumpLaunchPanel fields */
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

/** Supply at TGE — Virtuals create-form distribution */
export const APTC_ALLOCATION = [
  {
    label: 'Liquidity pool',
    pct: VIRTUALS_LAUNCH_MODE.liquidityPoolPct,
    tokensShort: '935M',
    fill: '#2dd4bf',
    color: 'from-teal-400 to-cyan-500',
    detail:
      'Fixed 93.5% seeds the Uniswap liquidity pool on Robinhood Chain at Virtuals launch — public float for trading.',
  },
  {
    label: 'veVIRTUAL airdrop',
    pct: VIRTUALS_LAUNCH_MODE.veVirtualAirdropPct,
    tokensShort: '50M',
    fill: '#f59e0b',
    color: 'from-amber-500 to-orange-500',
    detail:
      'Fixed 5% distributed to veVIRTUAL stakers — aligns long-term Virtuals ecosystem holders with APTC.',
  },
  {
    label: 'Team initial buy',
    pct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
    tokensShort: VIRTUALS_LAUNCH_MODE.teamInitialBuyTokensShort,
    fill: '#a78bfa',
    color: 'from-violet-400 to-purple-500',
    detail:
      '1.5% (15M APTC) creator pre-buy at TGE for ~138 VIRTUAL. Defaults to 1-month cliff and 6-month vesting — growth / ops only, not an unlocked dump.',
  },
];

/** How @aptcasinofun deploys team pre-buy + protocol growth capital */
export const CREATOR_BUY_DEPLOYMENT = [
  {
    label: 'Tier 1, 2 & 3 listings',
    pct: 50,
    fill: '#c084fc',
    detail:
      'Largest share — Tier 1 DEX & trader tools (Virtuals, DexScreener, Uniswap), Tier 2 aggregators (CoinGecko, CMC), Tier 3 CEX roadmap',
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
    'We are not hiding supply behind clusters, bundles, or fake metrics. No wash volume. No fake FDV. No dumps. APTC is a live GambleFi product launching via Virtuals Protocol on Robinhood Chain, with 93.5% LP, a disclosed 1.5% vested team buy, a 5% veVIRTUAL airdrop, and on-chain casino revenue. Every ops-wallet token exists to grow the platform — not to extract from it.',
  opsWalletRule:
    'Team initial buy (vested) → @aptcasinofun · listings-first deployment · no wash · no fake FDV · no dumps',
};

export const APTC_TRADER_GREEN_FLAGS = [
  {
    term: 'Launch venue',
    status: 'Virtuals Protocol',
    detail: 'Agent token on Robinhood Chain · EconomyOS · “by Virtuals” on-chain name.',
  },
  {
    term: 'Chain',
    status: 'Robinhood Chain',
    detail: 'Arbitrum Orbit L2 purpose-built for tokenized markets + AI agents.',
  },
  {
    term: 'Liquidity',
    status: '93.5% LP',
    detail: 'Fixed supply seeded into the Uniswap pool at launch — public float.',
  },
  {
    term: 'veVIRTUAL airdrop',
    status: '5%',
    detail: 'Distributed to veVIRTUAL stakers — ecosystem-aligned, not a stealth team wallet.',
  },
  {
    term: 'Team / founder allocation',
    status: '1.5% vested',
    detail: 'Team initial buy only — 1-month cliff · 6-month vest. No unlocked founder dump.',
  },
  {
    term: 'Anti-sniper',
    status: '60 seconds',
    detail: 'Basic anti-sniper protection on buys for the first minute after launch.',
  },
  {
    term: 'Agent',
    status: 'EconomyOS',
    detail: 'Launches as an AI agent on Virtuals EconomyOS with identity + wallet primitives.',
  },
  {
    term: 'Bundled wallets',
    status: 'None',
    detail: 'No launch-day wallet clusters or same-block insider snipes from us.',
  },
  {
    term: 'Volume & metrics',
    status: 'Organic',
    detail: 'Real casino GGR & wallets on-chain — no wash volume, no bot-inflated stats.',
  },
  {
    term: 'FDV / market cap',
    status: 'Market-priced',
    detail: 'Illustrative launch FDV from Virtuals pre-buy UI · live price after TGE.',
  },
  {
    term: 'Supply dumps',
    status: 'No dumps',
    detail: 'Team buy is vested; LP is fixed; airdrop goes to veVIRTUAL holders.',
  },
  {
    term: 'Hidden wallets',
    status: 'None claimed',
    detail: 'One disclosed ops identity (@aptcasinofun) — no shadow treasuries.',
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
    amount: 'TGE',
    amountShort: 'Ops',
    pct: VIRTUALS_LAUNCH_MODE.teamInitialBuyPct,
    address: null,
    purpose:
      '1.5% team initial buy (vested 1-month cliff · 6-month) — largest allocation to Tier 1–3 listings (DEX → CEX), then community rewards, staking, and protocol ops. Platform growth only.',
    purposeShort: 'Vested team buy · growth only',
  },
];

export const APTC_LAUNCH_STEPS = [
  'Virtuals live',
  'Robinhood LP',
  'DexScreener',
  'GGR flywheel',
];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Virtuals TGE',
    detail: '1B supply · agent token · anti-sniper 60s · ~138 VIRTUAL launch / pre-buy',
  },
  {
    step: '2',
    title: 'Liquidity live',
    detail: '93.5% Uniswap LP on Robinhood · 5% veVIRTUAL airdrop · 1.5% vested team buy',
  },
  {
    step: '3',
    title: 'Discovery',
    detail: 'DexScreener · Virtuals Capital Market · aggregators',
  },
  {
    step: '4',
    title: 'Flywheel on',
    detail: 'Casino GGR buybacks · staking · listings · EconomyOS agent utility',
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
    body: 'Live GGR from Plinko, Mines, Wheel & Roulette → open-market APTC buybacks on Robinhood / Uniswap rails.',
  },
  {
    title: 'Virtuals agent',
    body: 'APTC launches as an EconomyOS agent — identity, wallet, and agentic commerce primitives on Virtuals.',
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

/** Copy for Virtuals create-form Advanced Details (≤500 / free text) */
export const VIRTUALS_FORM_COPY = {
  description:
    'AptCasino.fun ($APTC) is live GambleFi — Plinko, Mines, Roulette & Wheel with on-chain play across Solana, Aptos & EVM. Casino GGR funds open-market APTC buybacks. Launching as a Virtuals agent token on Robinhood Chain.',
  howItWorks:
    'Play on aptcasino.fun → house edge (GGR) accrues → protocol buys APTC on the open market → burn, stake rewards, and treasury. Token launches via Virtuals Protocol on Robinhood with Uniswap LP, a veVIRTUAL airdrop, and a vested team pre-buy for growth.',
  roadmap:
    'TGE on Virtuals · Robinhood → DexScreener indexing → stake & buyback rails live → Tier 1–2 listings → EconomyOS agent utility → CEX expansion. Product is already shipping; token aligns capital with real GGR.',
  additionalDetails:
    'CEO @AptCasinofun. Website aptcasino.fun. Pitch: x.com/AptCasinofun. No wash volume, no fake FDV, no dumps. 93.5% LP · 5% veVIRTUAL · 1.5% vested team buy.',
  tokenUtility:
    'APTC powers the casino flywheel (GGR buybacks), staking rewards, referrals/Volume Cup prizes, and Virtuals EconomyOS agent identity — a live product token, not a memo with no utility.',
};

export function getAllocationSummary() {
  return '1B APTC fixed supply · Virtuals Protocol on Robinhood Chain · 93.5% Uniswap LP · 5% veVIRTUAL airdrop · 1.5% vested team initial buy · EconomyOS agent · no wash · no fake FDV · no dumps.';
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
  const virtualsHref = virtualsTokenUrl(mint);
  const explorerHref = launched ? explorerTokenUrl(mint) : `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}`;
  const dexscreenerHref = pairUrl || `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}`;

  return [
    {
      id: 'virtuals',
      label: 'Virtuals',
      sub: launched ? 'Token page' : 'Launchpad',
      href: virtualsHref,
      external: true,
      logo: VIRTUALS_LOGO_SRC,
    },
    {
      id: 'dexscreener',
      label: 'DexScreener',
      sub: launched ? 'Live chart' : 'Robinhood',
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
