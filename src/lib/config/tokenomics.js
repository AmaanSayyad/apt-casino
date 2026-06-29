/**
 * APTC tokenomics — public-facing constants for landing + litepaper + docs.
 * Launch: Pump.fun default mode (SOL-paired bonding curve → PumpSwap).
 * @see https://pump.fun/create
 * @see https://pump.fun/docs/fees
 * @see https://github.com/pump-fun/pump-public-docs
 */

import { getAptcMint, isAptcLaunched, getAptcPairAddress } from './launchStatus';

/** Pump.fun program (mainnet) */
export const PUMP_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

export const PUMP_LOGO_SRC = '/logos/pumpfun-logo.png';

/**
 * Default Pump.fun launch — NOT mayhem mode, NOT cashback, SOL-paired `create_v2`.
 * Bonding curve sells ~793.1M tokens; graduation migrates liquidity to PumpSwap (LP burned).
 */
export const PUMP_LAUNCH_MODE = {
  label: 'Default launch',
  tagline: 'SOL-paired bonding curve · PumpSwap graduation',
  mayhemMode: false,
  cashbackEnabled: false,
  quotePair: 'SOL',
  createUrl: 'https://pump.fun/create',
  feesDocsUrl: 'https://pump.fun/docs/fees',
  publicDocsUrl: 'https://github.com/pump-fun/pump-public-docs',
  /** Creator initial buy target — 1% of 1B supply */
  devHoldPct: 1,
  /** Tokens tradeable on the bonding curve before graduation (~79.31% of supply) */
  curveSupplyPct: 79.31,
  /** Remaining supply migrates to PumpSwap LP on graduation */
  migrationLpPct: 20.69,
  /** Bonding-curve trade fee (creator + protocol) per pump.fun/fees */
  curveCreatorFeePct: 0.3,
  curveProtocolFeePct: 0.95,
  curveTotalFeePct: 1.25,
  /** Post-graduation PumpSwap canonical pool fees scale with market cap down to ~0.3% total */
  pumpswapFeeFloorPct: 0.3,
  /** Approximate SOL raised when the curve completes (varies with curve math) */
  graduationSolApprox: 85,
  migrationFeeSol: 0.015,
  createFeeSol: 0,
};

export const APTC_TOKENOMICS = {
  name: 'AptCasino.fun',
  symbol: 'APTC',
  chain: 'Solana (SPL · Token-2022 · Pump.fun)',
  maxSupply: '1,000,000,000',
  decimals: 6,
  get mint() {
    return getAptcMint();
  },
  launchVenue: 'Pump.fun → PumpSwap',
  launchPlatformUrl: PUMP_LAUNCH_MODE.createUrl,
  feeMode: 'PUMP_DEFAULT',
  feeModeLabel: 'Pump.fun default',
  launch:
    'Pump.fun default launch · SOL bonding curve · ~1% creator dev buy at TGE · 100% creator fees to @aptcasinofun · graduates to PumpSwap when curve completes.',
  authorities: {
    mintRevoked: true,
    freezeRevoked: true,
    updateRevoked: true,
    pumpBondingCurve: true,
  },
  feeShare: {
    enabled: true,
    claimer: '@aptcasinofun',
    bps: 10_000,
    label: '100% of creator fees → operations wallet',
  },
};

/** Pump.fun bonding-curve launch parameters */
export const APTC_LAUNCH_METRICS = {
  pair: 'APTC/SOL',
  dex: 'Pump.fun bonding curve → PumpSwap (canonical pool)',
  launchPlatform: 'Pump.fun',
  pumpPrograms: {
    bondingCurve: PUMP_PROGRAM_ID,
  },
  totalSupplyShort: '1B',
  devHoldPct: PUMP_LAUNCH_MODE.devHoldPct,
  curveSupplyPct: PUMP_LAUNCH_MODE.curveSupplyPct,
  migrationLpPct: PUMP_LAUNCH_MODE.migrationLpPct,
  graduationSol: PUMP_LAUNCH_MODE.graduationSolApprox,
  /** Creator dev buy — 1% of supply at launch (listings-first ops) */
  devBuySupplyPct: PUMP_LAUNCH_MODE.devHoldPct,
  devBuyTokensShort: '10M',
  tradeFeePreMigrationPct: PUMP_LAUNCH_MODE.curveTotalFeePct,
  tradeFeePostMigrationFloorPct: PUMP_LAUNCH_MODE.pumpswapFeeFloorPct,
  curveCreatorFeePct: PUMP_LAUNCH_MODE.curveCreatorFeePct,
  /** Illustrative starting MC if dev buys 1% near curve open — not a price guarantee */
  approxMarketCapUsd: null,
  approxSpotFdvUsd: null,
  approxAverageFdvUsd: null,
  approxTokenPriceUsd: null,
  get pumpTokenUrl() {
    const mint = getAptcMint();
    return isAptcLaunched() ? pumpTokenUrl(mint) : PUMP_LAUNCH_MODE.createUrl;
  },
  get dexscreenerPairUrl() {
    const pair = getAptcPairAddress();
    return pair ? `https://dexscreener.com/solana/${pair}` : null;
  },
};

/** Supply at TGE — pump.fun curve mechanics + disclosed dev hold */
export const APTC_ALLOCATION = [
  {
    label: 'Bonding curve (public)',
    pct: PUMP_LAUNCH_MODE.curveSupplyPct,
    tokensShort: '793.1M',
    fill: '#ec4899',
    color: 'from-fuchsia-500 to-pink-500',
    detail:
      'Standard Pump.fun curve supply — anyone can buy/sell on the bonding curve until it completes and migrates to PumpSwap.',
  },
  {
    label: 'PumpSwap LP (on graduation)',
    pct: PUMP_LAUNCH_MODE.migrationLpPct,
    tokensShort: '206.9M',
    fill: '#6366f1',
    color: 'from-indigo-500 to-violet-600',
    detail:
      'Remaining supply seeds the canonical PumpSwap pool at graduation. LP tokens are burned — liquidity stays on-chain.',
  },
  {
    label: 'Creator dev buy',
    pct: PUMP_LAUNCH_MODE.devHoldPct,
    tokensShort: '10M',
    fill: '#34d399',
    color: 'from-emerald-500 to-teal-500',
    detail:
      'One-time ~1% creator buy at launch via Pump.fun — disclosed dev hold for listings, rewards, and ops. Not a hidden team wallet.',
  },
];

/** How @aptcasinofun deploys dev buy + 100% Pump creator fees */
export const CREATOR_BUY_DEPLOYMENT = [
  {
    label: 'Tier 1, 2 & 3 listings',
    pct: 50,
    fill: '#c084fc',
    detail:
      'Largest share — Tier 1 DEX & trader tools (Pump.fun, PumpSwap, DexScreener, Jupiter), Tier 2 aggregators (CoinGecko, CMC), Tier 3 CEX roadmap (MEXC, Gate, KuCoin, Bybit, OKX, Binance)',
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
  'Every APTC from the ~1% creator dev buy and 100% of Pump.fun creator fees is deployed only for platform growth. The largest share funds Tier 1, 2 & 3 listings (DEX → aggregators → CEX). No founder allocation. No team allocation. No wash volume. No fake FDV. No dumps.';

export const APTC_TRANSPARENCY = {
  headline: 'The green flag checklist',
  subhead:
    'What snipers, bots, agents, and degens scan before they buy — and how APTC answers each one.',
  pledge:
    'We are not hiding supply behind clusters, bundles, or fake metrics. No wash volume. No fake FDV. No dumps. APTC is a live GambleFi product with a standard Pump.fun launch, revoked mint/freeze authorities, one public ops wallet, and on-chain casino revenue. Every creator-wallet token exists to grow the platform — not to extract from it.',
  opsWalletRule:
    'Creator dev buy + 100% creator fees → @aptcasinofun only · listings-first deployment · no wash · no fake FDV · no dumps',
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
    term: 'Launch venue',
    status: 'Pump.fun default',
    detail: 'Standard SOL-paired `create_v2` — not mayhem mode, not cashback.',
  },
  {
    term: 'Team / founder allocation',
    status: '0%',
    detail: 'No VC slice, no advisor unlock, no separate “team wallet” line item.',
  },
  {
    term: 'Dev hold',
    status: '~1%',
    detail: 'Disclosed creator buy at launch — used for listings, rewards, staking, and ops only.',
  },
  {
    term: 'Bundled wallets',
    status: 'None',
    detail: 'No launch-day wallet clusters or same-block insider snipes from us.',
  },
  {
    term: 'Creator fees',
    status: '100% → ops',
    detail: 'Pump.fun creator fee vault claimed by @aptcasinofun for platform growth.',
  },
  {
    term: 'Volume & metrics',
    status: 'Organic',
    detail: 'Real casino GGR & wallets on-chain — no wash volume, no bot-inflated stats.',
  },
  {
    term: 'FDV / market cap',
    status: 'Curve-priced',
    detail: 'Market cap follows bonding-curve trades — no inflated launch posts.',
  },
  {
    term: 'Supply dumps',
    status: 'No dumps',
    detail: 'No bundled wallets, no hidden multi-wallet sells, no team unlock cliffs.',
  },
  {
    term: 'Graduation',
    status: 'PumpSwap',
    detail: 'Curve completes → canonical PumpSwap pool · LP burned on migration.',
  },
  {
    term: 'Hidden wallets',
    status: 'None claimed',
    detail: 'One disclosed ops wallet (@aptcasinofun) — no shadow treasuries.',
  },
  {
    term: 'Trade fees',
    status: 'Pump.fun schedule',
    detail: '1.25% on curve (0.3% creator + 0.95% protocol). Post-grad fees scale down on PumpSwap.',
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
      'Creator dev buy (~1% supply) + 100% Pump.fun creator fees — largest allocation to Tier 1–3 listings (DEX → CEX), then community rewards, staking, and protocol ops. Platform growth only.',
    purposeShort: 'Dev buy + creator fees · growth only',
  },
];

export const APTC_LAUNCH_STEPS = [
  'Token live',
  'Bonding curve',
  'Graduate (~85 SOL)',
  'DexScreener',
];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Token live',
    detail: '1B supply · Pump.fun default · ~1% creator dev buy · fees to @aptcasinofun',
  },
  {
    step: '2',
    title: 'Bonding curve',
    detail: '1.25% trade fee on curve · public buys until curve completes',
  },
  {
    step: '3',
    title: 'Graduation',
    detail: '~85 SOL raised → migrate to PumpSwap · LP burned · canonical pool',
  },
  {
    step: '4',
    title: 'Flywheel on',
    detail: 'Creator fees + GGR buybacks · staking · listings · aggregators',
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
    body: 'Live GGR from Plinko, Mines, Wheel & Roulette → open-market APTC buybacks on Jupiter / PumpSwap.',
  },
  {
    title: 'Creator fee stream',
    body: '100% Pump.fun creator fees to @aptcasinofun — fund listings, rewards, and ops from a single treasury wallet.',
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

export function getAllocationSummary() {
  return '1B APTC fixed supply · Pump.fun default launch · ~1% dev hold · ~79% on bonding curve · 0% team/founder · creator fees → ops · no wash · no fake FDV · no dumps.';
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

export function pumpTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return isAptcLaunched() ? `https://pump.fun/coin/${mint}` : PUMP_LAUNCH_MODE.createUrl;
}

/** @deprecated Use pumpTokenUrl */
export function bagsTokenUrl(mint = APTC_TOKENOMICS.mint) {
  return pumpTokenUrl(mint);
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

/** @deprecated Post-TGE swaps route via Jupiter / PumpSwap */
export function meteoraPoolUrl(mint = APTC_TOKENOMICS.mint) {
  return pumpTokenUrl(mint);
}

export function getAptcTradeLinks(options = {}) {
  const launched = isAptcLaunched();
  const mint = APTC_TOKENOMICS.mint;
  const pairUrl =
    options.pairUrl ||
    (APTC_LAUNCH_METRICS.dexscreenerPairUrl ?? null) ||
    (launched ? dexscreenerTokenUrl(mint) : null);
  const pumpHref = pumpTokenUrl(mint);
  const jupiterHref = launched ? jupiterSwapUrl(mint) : 'https://jup.ag/';
  const solscanHref = launched ? solscanTokenUrl(mint) : 'https://solscan.io/';
  const dexscreenerHref = pairUrl || 'https://dexscreener.com/solana';

  return [
    { id: 'pumpfun', label: 'Pump.fun', sub: launched ? 'Token page' : 'Create', href: pumpHref, external: true, logo: PUMP_LOGO_SRC },
    { id: 'dexscreener', label: 'DexScreener', sub: launched ? 'Live chart' : 'Charts', href: dexscreenerHref, external: true, logo: '/logos/dexscreener.png' },
    { id: 'jupiter', label: 'Jupiter', sub: launched ? 'Swap' : 'Aggregator', href: jupiterHref, external: true, logo: '/logos/jupiter.jpg' },
    { id: 'solscan', label: 'Solscan', sub: launched ? 'Mint' : 'Explorer', href: solscanHref, external: true, logo: 'https://solscan.io/favicon.ico' },
    { id: 'stake', label: 'Stake', sub: 'Earn APY', href: '/stake', external: false, logo: '/APTC_logo_1000x1000.png' },
    { id: 'litepaper', label: 'Litepaper', sub: 'Full docs', href: '/litepaper#aptc-token', external: false, logo: '/APTC_logo_1000x1000.png' },
  ];
}

export function getWalletAllocationColor(walletId) {
  const row = APTC_ALLOCATION[walletId - 1];
  return row?.fill ?? '#06b6d4';
}

/** @deprecated Raydium launch — post-TGE swaps may route via Jupiter */
export function raydiumSwapUrl(mint = APTC_TOKENOMICS.mint) {
  return jupiterSwapUrl(mint);
}
