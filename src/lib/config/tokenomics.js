/**
 * APTC tokenomics — public-facing constants for landing + litepaper + docs.
 * Launch: Fixed-price IPO (25% public sale) → Raydium liquidity post-TGE.
 */

import { getAptcMint, isAptcLaunched, getAptcPairAddress } from './launchStatus';
import { IPO_SALE, APTC_LOGO_SRC, METAPLEX_LOGO_SRC, RAYDIUM_LOGO_SRC, METADAO_LOGO_SRC, PINKSALE_LOGO_SRC, PYTH_LOGO_SRC } from './ipo';
import { SOLSCAN_LOGO_SRC } from './solscan';

export const METAPLEX_LOGO = METAPLEX_LOGO_SRC;
export const APTC_LOGO = APTC_LOGO_SRC;

export const IPO_LAUNCH_MODE = {
  label: 'Public IPO',
  tagline: '3 timed rounds · $25k soft each · Raydium after Round 3',
  quotePair: 'SOL',
  createUrl: '/ipo',
  feesDocsUrl: 'https://docs.metaplex.com/genesis',
  publicDocsUrl: 'https://docs.metaplex.com/genesis/presale',
  saleSupplyPct: IPO_SALE.saleSupplyPct,
  migrationLpPct: 12,
  raiseTargetUsd: IPO_SALE.raiseTargetUsd,
  tokenPriceUsd: IPO_SALE.tokenPriceUsd,
  launchLabel: IPO_SALE.launchLabel,
  endLabel: IPO_SALE.endLabel,
  timezoneLabel: IPO_SALE.timezoneLabel,
};

/** @deprecated Use IPO_LAUNCH_MODE */
export const PUMP_LAUNCH_MODE = IPO_LAUNCH_MODE;
export const PUMP_PROGRAM_ID = '';
export const PUMP_LOGO_SRC = METAPLEX_LOGO_SRC;

export const APTC_TOKENOMICS = {
  name: 'AptCasino.fun',
  symbol: 'APTC',
  chain: 'Solana (SPL · Token-2022)',
  maxSupply: '1,000,000,000',
  decimals: 6,
  get mint() {
    return getAptcMint();
  },
  launchVenue: 'Public IPO → Raydium',
  launchPlatformUrl: '/ipo',
  feeMode: 'IPO_FIXED',
  feeModeLabel: 'Fixed-price IPO',
  launch:
    '25% public IPO — deposit SOL, receive APTC instantly. Auto-staked 30 days @ 30% APY. Post-IPO Raydium liquidity.',
  authorities: {
    mintRevoked: true,
    freezeRevoked: true,
    updateRevoked: true,
    pumpBondingCurve: false,
  },
  feeShare: {
    enabled: true,
    claimer: '@aptcasinofun',
    bps: 10_000,
    label: 'Protocol revenue → operations wallet',
  },
};

export const APTC_LAUNCH_METRICS = {
  pair: 'APTC/SOL',
  dex: 'IPO → Raydium (post-TGE)',
  launchPlatform: 'AptCasino IPO',
  pumpPrograms: { bondingCurve: null },
  totalSupplyShort: '1B',
  devHoldPct: 0,
  curveSupplyPct: IPO_SALE.saleSupplyPct,
  migrationLpPct: 12,
  graduationSol: null,
  devBuySupplyPct: 0,
  devBuyTokensShort: '0',
  tradeFeePreMigrationPct: 0,
  tradeFeePostMigrationFloorPct: 0.25,
  curveCreatorFeePct: 0,
  approxMarketCapUsd: IPO_SALE.raiseTargetUsd,
  approxSpotFdvUsd: IPO_SALE.raiseTargetUsd * 4,
  approxAverageFdvUsd: null,
  approxTokenPriceUsd: IPO_SALE.tokenPriceUsd,
  get pumpTokenUrl() {
    return '/ipo';
  },
  get dexscreenerPairUrl() {
    const pair = getAptcPairAddress();
    return pair ? `https://dexscreener.com/solana/${pair}` : null;
  },
};

export const APTC_ALLOCATION = [
  {
    label: 'Public IPO',
    pct: IPO_SALE.saleSupplyPct,
    tokensShort: IPO_SALE.saleTokensShort,
    fill: '#d946ef',
    color: 'from-fuchsia-500 to-violet-600',
    detail:
      '3 timed rounds on aptcasino.fun — $25k soft cap each at 1× / 2× / 3×. Oversub fills the rest at 1.5× / 2.5× / 3.5×. Up to 250M APTC reserved for public sale.',
  },
  {
    label: 'Raydium LP (post-TGE)',
    pct: 12,
    tokensShort: '120M',
    fill: '#6366f1',
    color: 'from-indigo-500 to-violet-600',
    detail: 'Liquidity seeded on Raydium after IPO closes — canonical APTC/SOL pool.',
  },
  {
    label: 'Treasury & ops',
    pct: 25,
    tokensShort: '250M',
    fill: '#34d399',
    color: 'from-emerald-500 to-teal-500',
    detail: 'Listings, rewards, staking emissions, protocol runway — @aptcasinofun ops wallet.',
  },
  {
    label: 'Community & staking',
    pct: 38,
    tokensShort: '380M',
    fill: '#a78bfa',
    color: 'from-violet-500 to-purple-600',
    detail: 'Player rewards, Volume Cup, referrals, long-term staking — organic growth only.',
  },
];

/** How @aptcasinofun deploys IPO proceeds + protocol GGR */
export const CREATOR_BUY_DEPLOYMENT = [
  {
    label: 'Tier 1, 2 & 3 listings',
    pct: 50,
    fill: '#c084fc',
    detail:
      'Largest share — Tier 1 DEX & trader tools (Raydium, DexScreener, Jupiter), Tier 2 aggregators (CoinGecko, CMC), Tier 3 CEX roadmap (MEXC, Gate, KuCoin, Bybit, OKX, Binance)',
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
  'Protocol treasury funds listings, community rewards, staking, and ops — 0% team / founder allocation.';

export const APTC_TRANSPARENCY = {
  headline: 'The green flag checklist',
  subhead:
    'What snipers, bots, agents, and degens scan before they buy — and how APTC answers each one.',
  pledge:
    'Fixed-price public IPO, revoked mint/freeze authorities, one public ops wallet, and on-chain casino revenue — no bundled clusters or hidden treasuries.',
  opsWalletRule: 'Treasury → @aptcasinofun only · listings-first deployment',
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
    status: 'Public IPO',
    detail: 'Fixed-price SOL → APTC purchase on aptcasino.fun.',
  },
  {
    term: 'Team / founder allocation',
    status: '0%',
    detail: 'No VC slice, no advisor unlock, no separate “team wallet” line item.',
  },
  {
    term: 'Dev hold',
    status: '0%',
    detail: 'No undisclosed dev buy — public IPO is the primary distribution event.',
  },
  {
    term: 'Bundled wallets',
    status: 'None',
    detail: 'No launch-day wallet clusters or same-block insider snipes from us.',
  },
  {
    term: 'Creator fees',
    status: 'N/A',
    detail: 'IPO fixed price — post-TGE Raydium pool fees apply to secondary trading.',
  },
  {
    term: 'Volume & metrics',
    status: 'Organic',
    detail: 'Real casino GGR & wallets on-chain — no wash volume, no bot-inflated stats.',
  },
  {
    term: 'FDV / market cap',
    status: 'IPO-priced',
    detail:
      '3 rounds at 1× / 2× / 3× from $0.0004 base · $25k soft each · oversub at 1.5× / 2.5× / 3.5× · Listing 5× · CEX T3 20×.',
  },
  {
    term: 'Supply dumps',
    status: 'No dumps',
    detail: 'No bundled wallets, no hidden multi-wallet sells, no team unlock cliffs.',
  },
  {
    term: 'Post-IPO liquidity',
    status: 'Raydium',
    detail: 'Canonical APTC/SOL pool on Raydium after IPO window closes.',
  },
  {
    term: 'Hidden wallets',
    status: 'None claimed',
    detail: 'One disclosed ops wallet (@aptcasinofun) — no shadow treasuries.',
  },
  {
    term: 'Trade fees',
    status: 'Raydium pool',
    detail: 'Standard AMM fees on Raydium post-TGE. IPO itself is fixed-price with no curve fee.',
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
      'Protocol treasury funds Tier 1–3 listings (DEX → aggregators → CEX), community rewards, staking, and ops. No founder allocation. IPO is the primary distribution event.',
    purposeShort: 'IPO + GGR · growth only',
  },
];

export const APTC_LAUNCH_STEPS = ['Round 1–3 IPO', 'Buy APTC with SOL', 'Raydium LP', 'DexScreener'];

export const APTC_LAUNCH_PHASES = [
  {
    step: '1',
    title: 'Round 1 opens',
    detail: '11–14 Jul ET · 1× ($0.0004) · $25k soft · oversub 1.5× · auto-stake 30d @ 30% APY',
  },
  {
    step: '2',
    title: 'Buy APTC',
    detail: 'Deposit SOL in a live round → APTC locks in staking vault under your wallet',
  },
  {
    step: '3',
    title: 'Raydium TGE',
    detail: 'IPO closes → seed Raydium APTC/SOL liquidity pool',
  },
  {
    step: '4',
    title: 'Flywheel on',
    detail: 'GGR buybacks · staking · listings · aggregators',
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
    body: 'Live GGR from Plinko, Mines, Wheel & Roulette → open-market APTC buybacks on Jupiter / Raydium.',
  },
  {
    title: 'IPO + staking',
    body: 'Public IPO buyers auto-enrolled in 30-day stake at 30% APY — rewards recorded for manual admin payout.',
  },
  {
    title: 'Staking',
    body: 'Additional fixed-term pools on /stake · rewards from GGR buyback staker share.',
  },
  {
    title: 'Referrals & Volume Cup',
    body: 'On-chain referral rewards and seasonal leaderboard prizes funded from protocol revenue.',
  },
];

export function getAllocationSummary() {
  return '1B fixed supply · 25% public IPO · Raydium post-TGE · 0% team / founder.';
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

export function ipoPageUrl() {
  return '/ipo';
}

/** @deprecated Use ipoPageUrl */
export function pumpTokenUrl() {
  return ipoPageUrl();
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

/** @deprecated Post-TGE swaps route via Jupiter / Raydium */
export function meteoraPoolUrl(mint = APTC_TOKENOMICS.mint) {
  return pumpTokenUrl(mint);
}

/** Full trade & research grid — generic URLs pre-TGE, mint-specific after Raydium listing */
export function getTradeResearchTools() {
  const launched = isAptcLaunched();
  const mint = APTC_TOKENOMICS.mint;

  return [
    { id: 'ipo', label: 'IPO', logo: '/APTC_logo_1000x1000.png', href: '/ipo' },
    { id: 'raydium', label: 'Raydium', logo: RAYDIUM_LOGO_SRC, href: launched ? `https://raydium.io/swap/?inputMint=sol&outputMint=${mint}` : 'https://raydium.io/' },
    { id: 'jupiter', label: 'Jupiter', logo: '/logos/jupiter.jpg', href: launched ? jupiterSwapUrl(mint) : 'https://jup.ag/' },
    { id: 'dexscreener', label: 'DexScreener', logo: '/logos/dexscreener.png', href: launched ? dexscreenerTokenUrl(mint) : 'https://dexscreener.com/solana' },
    { id: 'birdeye', label: 'Birdeye', logo: '/logos/birdeye.png', href: launched ? `https://birdeye.so/token/${mint}?chain=solana` : 'https://birdeye.so/' },
    { id: 'gecko', label: 'GeckoTerminal', logo: '/logos/gecko.png', href: launched ? `https://www.geckoterminal.com/solana/pools/${mint}` : 'https://www.geckoterminal.com/' },
    { id: 'dextools', label: 'DexTools', logo: '/logos/dextools.png', href: launched ? `https://www.dextools.io/app/en/solana/pair-explorer/${mint}` : 'https://www.dextools.io/' },
    { id: 'gmgn', label: 'GMGN', logo: '/logos/gmgn.png', href: launched ? `https://gmgn.ai/sol/token/${mint}` : 'https://gmgn.ai/' },
    { id: 'axiom', label: 'Axiom', logo: '/logos/axiom.jpeg', href: launched ? `https://axiom.trade/token/${mint}` : 'https://axiom.trade/' },
    { id: 'photon', label: 'Photon', logo: '/logos/photon.png', href: launched ? `https://photon-sol.tinyastro.io/en/lp/${mint}` : 'https://photon-sol.tinyastro.io/' },
    { id: 'coingecko', label: 'CoinGecko', logo: '/logos/coingecko-logo.png', href: launched ? `https://www.coingecko.com/en/coins/${mint}` : 'https://www.coingecko.com/' },
    { id: 'cmc', label: 'CMC', logo: '/logos/cmc.png', href: launched ? `https://coinmarketcap.com/currencies/${mint}/` : 'https://coinmarketcap.com/' },
    { id: 'solscan', label: 'Solscan', logo: SOLSCAN_LOGO_SRC, href: launched ? solscanTokenUrl(mint) : 'https://solscan.io/' },
  ];
}

export function getAptcTradeLinks(options = {}) {
  const launched = isAptcLaunched();
  const mint = APTC_TOKENOMICS.mint;
  const pairUrl =
    options.pairUrl ||
    (APTC_LAUNCH_METRICS.dexscreenerPairUrl ?? null) ||
    (launched ? dexscreenerTokenUrl(mint) : null);
  const jupiterHref = launched ? jupiterSwapUrl(mint) : 'https://jup.ag/';
  const solscanHref = launched ? solscanTokenUrl(mint) : 'https://solscan.io/';
  const dexscreenerHref = pairUrl || 'https://dexscreener.com/solana';

  return [
    { id: 'ipo', label: 'IPO', sub: 'Buy APTC with SOL', href: '/ipo', external: false, logo: '/APTC_logo_1000x1000.png' },
    { id: 'metaplex', label: 'Metaplex', sub: 'Genesis presale', href: 'https://docs.metaplex.com/genesis/presale', external: true, logo: METAPLEX_LOGO_SRC },
    { id: 'metadao', label: 'MetaDAO', sub: 'Launch architecture', href: 'https://metadao.fi/', external: true, logo: METADAO_LOGO_SRC },
    { id: 'pinksale', label: 'PinkSale', sub: 'Affiliate model', href: 'https://www.pinksale.finance/', external: true, logo: PINKSALE_LOGO_SRC },
    { id: 'pyth', label: 'Pyth', sub: 'SOL/USD oracle', href: 'https://pyth.network/', external: true, logo: PYTH_LOGO_SRC },
    { id: 'dexscreener', label: 'DexScreener', sub: launched ? 'Live chart' : 'Charts', href: dexscreenerHref, external: true, logo: '/logos/dexscreener.png' },
    { id: 'jupiter', label: 'Jupiter', sub: launched ? 'Swap' : 'Aggregator', href: jupiterHref, external: true, logo: '/logos/jupiter.jpg' },
    { id: 'raydium', label: 'Raydium', sub: 'Post-TGE', href: launched ? `https://raydium.io/swap/?inputMint=sol&outputMint=${mint}` : 'https://raydium.io/', external: true, logo: RAYDIUM_LOGO_SRC },
    { id: 'solscan', label: 'Solscan', sub: launched ? 'Mint' : 'Explorer', href: solscanHref, external: true, logo: SOLSCAN_LOGO_SRC },
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
