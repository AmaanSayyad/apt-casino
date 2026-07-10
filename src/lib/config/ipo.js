/**
 * APTC IPO / presale — public constants for landing, /ipo page, and litepaper.
 * Fixed-price sale: 25% of supply (250M APTC) targeting $100,000 raise (oversubscription allowed).
 * Settlement: Metaplex Genesis-style presale · MetaDAO-inspired architecture · PinkSale-style affiliates.
 */

export const METAPLEX_LOGO_SRC = '/metaplex.jpeg';
export const APTC_LOGO_SRC = '/APTC_logo_1000x1000.png';
export const APTC_BANNER_SRC = '/Aptcbanner.png';
export const METADAO_LOGO_SRC = '/metadaologo.png';
export const PINKSALE_LOGO_SRC = '/pinksale.png';
export const PYTH_LOGO_SRC = '/pyth logo.jpg';
export const SOLANA_LOGO_SRC = '/logos/solana-sol-logo.png';
export const RAYDIUM_LOGO_SRC = '/logos/Raydium.png';
export const JUPITER_LOGO_SRC = '/logos/jupiter.jpg';
export const DEXSCREENER_LOGO_SRC = '/logos/dexscreener.png';

/** Partner logos for IPO launch stack UI */
export const IPO_LOGOS = {
  solana: {
    src: SOLANA_LOGO_SRC,
    alt: 'Solana',
    label: 'Solana',
    role: 'Settlement chain — SPL token, wallet-native SOL deposits',
  },
  pyth: {
    src: PYTH_LOGO_SRC,
    alt: 'Pyth Network',
    label: 'Pyth',
    role: 'On-chain SOL/USD oracle for fixed APTC pricing',
  },
  metaplex: {
    src: METAPLEX_LOGO_SRC,
    alt: 'Metaplex',
    label: 'Metaplex Genesis',
    role: 'Genesis presale settlement model — fixed-price swap rail',
  },
  metadao: {
    src: METADAO_LOGO_SRC,
    alt: 'MetaDAO',
    label: 'MetaDAO',
    role: 'Launch architecture — futarchy-style community launch patterns',
  },
  aptc: {
    src: APTC_LOGO_SRC,
    alt: 'APTC',
    label: 'APTC',
    role: 'Native GambleFi token — IPO allocation + auto-stake',
  },
  pinksale: {
    src: PINKSALE_LOGO_SRC,
    alt: 'PinkSale',
    label: 'PinkSale',
    role: '3-level affiliate referral model for IPO buyers',
  },
  raydium: {
    src: RAYDIUM_LOGO_SRC,
    alt: 'Raydium',
    label: 'Raydium',
    role: 'Post-IPO canonical APTC/SOL liquidity pool',
  },
  jupiter: {
    src: JUPITER_LOGO_SRC,
    alt: 'Jupiter',
    label: 'Jupiter',
    role: 'Aggregator routing for GGR buybacks & secondary swaps',
  },
  dexscreener: {
    src: DEXSCREENER_LOGO_SRC,
    alt: 'DexScreener',
    label: 'DexScreener',
    role: 'Live chart, volume, and pair analytics after Raydium listing',
  },
};

/**
 * Launch stack — where each partner fits in the APTC lifecycle.
 * Solana + Pyth → IPO engine (Metaplex + MetaDAO + PinkSale affiliates) → Raydium migration.
 */
export const IPO_STACK = [
  {
    id: 'chain',
    phase: 'On Solana',
    blurb: 'SPL token · Pyth oracle · wallet-native swap',
    logos: ['solana', 'pyth'],
  },
  {
    id: 'presale',
    phase: 'IPO engine',
    blurb: 'Metaplex Genesis presale · MetaDAO architecture · PinkSale-style 3-level affiliates',
    logos: ['metaplex', 'metadao', 'pinksale'],
  },
  {
    id: 'migration',
    phase: 'Post-migration',
    blurb: 'Raydium LP · Jupiter routing · DexScreener charts',
    logos: ['raydium', 'jupiter', 'dexscreener'],
  },
];

/**
 * Receive-only IPO SOL collector (no hot key on server).
 * Overridable via NEXT_PUBLIC_IPO_SOL_TREASURY.
 */
export const IPO_SOL_TREASURY_DEFAULT = 'F4DhxeQstwTBiaNdoeAwM7DEcUmSzJpC6HFWNi6cE9RV';

/**
 * Hot wallet that holds IPO APTC inventory + fee SOL and signs buyer payouts.
 * Overridable via NEXT_PUBLIC_IPO_APTC_DISTRIBUTOR.
 */
export const IPO_APTC_DISTRIBUTOR_DEFAULT = '81JYyenNM7RsoDgmxgM1JxDx9243F2fVi9q7bR4rgycw';

/** Default APTC mint for IPO inventory */
export const IPO_APTC_MINT_DEFAULT = 'APTcsX9vXMbhVdH4aKNbzNqrVoj6M1En2eVK4hFP9sAh';

export function getIpoSolTreasury() {
  return process.env.NEXT_PUBLIC_IPO_SOL_TREASURY?.trim() || IPO_SOL_TREASURY_DEFAULT;
}

export function getIpoAptcDistributor() {
  return (
    process.env.NEXT_PUBLIC_IPO_APTC_DISTRIBUTOR?.trim() || IPO_APTC_DISTRIBUTOR_DEFAULT
  );
}

export const IPO_SALE = {
  saleSupplyPct: 25,
  saleTokens: 250_000_000,
  saleTokensShort: '250M',
  totalSupply: 1_000_000_000,
  raiseTargetUsd: 100_000,
  tokenPriceUsd: 0.0004,
  softCapAptc: 250_000_000,
  oversubscriptionAllowed: true,
  /** July 11, 2026 3:30 AM ET → July 14, 2026 3:30 AM ET (same instant as 1:00 PM IST) */
  startAtIso: '2026-07-11T07:30:00.000Z',
  endAtIso: '2026-07-14T07:30:00.000Z',
  durationDays: 3,
  timezoneLabel: 'Eastern Time (ET)',
  launchLabel: 'July 11, 2026 · 3:30 AM ET',
  endLabel: 'July 14, 2026 · 3:30 AM ET',
  stakingLockDays: 30,
  stakingApyPct: 30,
  stakingApyBps: 3000,
  affiliateLevels: [
    { level: 1, bps: 300, pct: 3, label: 'L1 · direct referral', desc: 'You refer a buyer — earn 3% of their APTC purchase volume' },
    { level: 2, bps: 150, pct: 1.5, label: 'L2 · upline', desc: 'Your referral refers someone — earn 1.5% of that purchase volume' },
    { level: 3, bps: 50, pct: 0.5, label: 'L3 · upline', desc: 'Third tier in your chain — earn 0.5% of purchase volume' },
  ],
  affiliateTotalBps: 500,
  affiliateWithdrawMinDays: 10,
  oracleRefreshMs: 180_000,
  postIpoDex: 'Raydium',
  poweredBy: 'Metaplex',
};

export const IPO_COPY = {
  headline: '$APTC Public IPO',
  subheadLines: [
    {
      id: 'presale',
      text: 'Fixed-price presale on Solana — deposit SOL, receive APTC instantly.',
    },
    {
      id: 'terms',
      text: 'Oversubscription accepted · extra supply fulfilled automatically.',
      accent: true,
    },
  ],
  stakingBenefits: [
    { id: 'day1', label: '30% APY from day 1' },
    { id: 'vest', label: 'Earn while your APTC vests' },
    { id: 'idle', label: 'Idle supply still yields' },
    { id: 'stack', label: 'Rewards stack · only up' },
  ],
  swapLabel: 'Swap SOL → APTC',
  swapIntro:
    'Send SOL to the IPO treasury — APTC hits your wallet instantly. Auto-staked for 30 days: your idle APTC earns 30% APY from day one through the full vesting lock.',
  affiliateHeadline: '3-level IPO referrals',
  affiliateIntro:
    'Share your referral link — earn on every referred SOL deposit. Rewards accrue in APTC; Payout after the 10-day cliff.',
  connectHint: 'Connect the wallet you used to deposit to view your position, unlock time, and rewards.',
};

export function getIpoPhase(now = Date.now()) {
  const start = Date.parse(IPO_SALE.startAtIso);
  const end = Date.parse(IPO_SALE.endAtIso);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'unknown';
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

export function isIpoLive(now = Date.now()) {
  return getIpoPhase(now) === 'live';
}

export function getIpoCountdownMs(now = Date.now()) {
  const phase = getIpoPhase(now);
  if (phase === 'upcoming') return Math.max(0, Date.parse(IPO_SALE.startAtIso) - now);
  if (phase === 'live') return Math.max(0, Date.parse(IPO_SALE.endAtIso) - now);
  return 0;
}

export function formatIpoCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
