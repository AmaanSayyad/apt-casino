/**
 * APTC IPO — 3 timed rounds (Futardio-style raise windows) → Raydium listing → CEX.
 *
 * Base (1×) = $0.0004. Each round has a $25k soft cap at the round multiple;
 * oversubscription continues at the oversub multiple until the window ends ("fulfill rest all").
 * Settlement: Metaplex Genesis-style presale · MetaDAO-inspired architecture · PinkSale affiliates.
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
    role: 'Genesis presale settlement model — fixed-price purchase rail',
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
    blurb: 'SPL token · Pyth oracle · wallet-native purchase',
    logos: ['solana', 'pyth'],
  },
  {
    id: 'presale',
    phase: 'IPO engine',
    blurb: 'Metaplex Genesis · 3 timed rounds · PinkSale-style 3-level affiliates',
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
 * IPO SOL collector — set via NEXT_PUBLIC_IPO_SOL_TREASURY when IPO is enabled.
 * No hardcoded address (Virtuals is the launch path; IPO dormant).
 */
export const IPO_SOL_TREASURY_DEFAULT = '';

/**
 * IPO APTC distributor — set via NEXT_PUBLIC_IPO_APTC_DISTRIBUTOR when IPO is enabled.
 */
export const IPO_APTC_DISTRIBUTOR_DEFAULT = '';

/**
 * Staking vault — set via NEXT_PUBLIC_APTC_STAKING_VAULT when staking/IPO lock is enabled.
 */
export const IPO_STAKING_VAULT_DEFAULT = '2ei9VY2TtJ6GkvVMs1su5b348p98ajLaU45MzvE6gYaq';

/** APTC token — set via NEXT_PUBLIC_APTC_TOKEN_ADDRESS after Virtuals create. */
export const IPO_APTC_MINT_DEFAULT = '';

/** Base IPO price (1×). All round multiples derive from this. */
export const IPO_BASE_PRICE_USD = 0.0004;

/**
 * Timed sale rounds — windows in US Eastern (stored as UTC ISO).
 * July = EDT (UTC−4). Display as ET / New York time.
 *
 * Round 1 opens ~14h after 2026-07-10 deploy cutover (11 Jul 05:30 AM ET).
 * Round 2: 20 Jul 6 PM ET → 23 Jul 6 PM ET
 * Round 3: 27 Jul 6 PM ET → 30 Jul 6 PM ET
 */
export const IPO_ROUNDS = [
  {
    id: 1,
    key: 'r1',
    label: 'Round 1',
    shortLabel: 'R1',
    multiple: 1,
    oversubMultiple: 1.5,
    softCapUsd: 25_000,
    startAtIso: '2026-07-11T09:30:00.000Z', // 11 Jul 2026 05:30 America/New_York (EDT)
    endAtIso: '2026-07-14T09:30:00.000Z', // 14 Jul 2026 05:30 ET
    windowLabel: '11–14 Jul · 5:30 AM ET',
    blurb: 'Entry at 1× — oversub fills at 1.5×',
  },
  {
    id: 2,
    key: 'r2',
    label: 'Round 2',
    shortLabel: 'R2',
    multiple: 2,
    oversubMultiple: 2.5,
    softCapUsd: 25_000,
    startAtIso: '2026-07-20T22:00:00.000Z', // 20 Jul 2026 18:00 ET
    endAtIso: '2026-07-23T22:00:00.000Z', // 23 Jul 2026 18:00 ET
    windowLabel: '20–23 Jul · 6 PM ET',
    blurb: '2× entry — oversub fills at 2.5×',
  },
  {
    id: 3,
    key: 'r3',
    label: 'Round 3',
    shortLabel: 'R3',
    multiple: 3,
    oversubMultiple: 3.5,
    softCapUsd: 25_000,
    startAtIso: '2026-07-27T22:00:00.000Z', // 27 Jul 2026 18:00 ET
    endAtIso: '2026-07-30T22:00:00.000Z', // 30 Jul 2026 18:00 ET
    windowLabel: '27–30 Jul · 6 PM ET',
    blurb: '3× entry — oversub fills at 3.5×',
  },
];

export function getIpoRoundPriceUsd(multiple, basePriceUsd = IPO_BASE_PRICE_USD) {
  const m = Number(multiple);
  const base = Number(basePriceUsd);
  if (!Number.isFinite(m) || m <= 0 || !Number.isFinite(base) || base <= 0) return 0;
  return Number((base * m).toFixed(10));
}

export function enrichIpoRound(round, basePriceUsd = IPO_BASE_PRICE_USD) {
  const priceUsd = getIpoRoundPriceUsd(round.multiple, basePriceUsd);
  const oversubPriceUsd = getIpoRoundPriceUsd(round.oversubMultiple, basePriceUsd);
  const softCapAptc = priceUsd > 0 ? round.softCapUsd / priceUsd : 0;
  return {
    ...round,
    priceUsd,
    oversubPriceUsd,
    softCapAptc,
  };
}

export function getIpoRounds(basePriceUsd = IPO_BASE_PRICE_USD) {
  return IPO_ROUNDS.map((r) => enrichIpoRound(r, basePriceUsd));
}

/**
 * Resolve sale state at `now`.
 * @returns {{
 *   phase: 'upcoming' | 'live' | 'between_rounds' | 'ended' | 'unknown',
 *   activeRound: object | null,
 *   nextRound: object | null,
 *   previousRound: object | null,
 *   rounds: object[],
 * }}
 */
export function resolveIpoSaleState(now = Date.now(), basePriceUsd = IPO_BASE_PRICE_USD) {
  const rounds = getIpoRounds(basePriceUsd);
  if (!rounds.length) {
    return {
      phase: 'unknown',
      activeRound: null,
      nextRound: null,
      previousRound: null,
      rounds,
    };
  }

  const t = typeof now === 'number' ? now : Date.parse(now);
  if (!Number.isFinite(t)) {
    return {
      phase: 'unknown',
      activeRound: null,
      nextRound: null,
      previousRound: null,
      rounds,
    };
  }

  const firstStart = Date.parse(rounds[0].startAtIso);
  const lastEnd = Date.parse(rounds[rounds.length - 1].endAtIso);

  if (t < firstStart) {
    return {
      phase: 'upcoming',
      activeRound: null,
      nextRound: rounds[0],
      previousRound: null,
      rounds,
    };
  }

  if (t > lastEnd) {
    return {
      phase: 'ended',
      activeRound: null,
      nextRound: null,
      previousRound: rounds[rounds.length - 1],
      rounds,
    };
  }

  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    const start = Date.parse(r.startAtIso);
    const end = Date.parse(r.endAtIso);
    if (t >= start && t <= end) {
      return {
        phase: 'live',
        activeRound: r,
        nextRound: rounds[i + 1] || null,
        previousRound: rounds[i - 1] || null,
        rounds,
      };
    }
  }

  // Between round windows
  let previousRound = null;
  let nextRound = null;
  for (let i = 0; i < rounds.length; i++) {
    const end = Date.parse(rounds[i].endAtIso);
    const nextStart = rounds[i + 1] ? Date.parse(rounds[i + 1].startAtIso) : null;
    if (t > end && nextStart != null && t < nextStart) {
      previousRound = rounds[i];
      nextRound = rounds[i + 1];
      break;
    }
  }

  return {
    phase: 'between_rounds',
    activeRound: null,
    nextRound,
    previousRound,
    rounds,
  };
}

/**
 * Price a purchase for a round given USD already committed in that round (soft-cap FCFS).
 * Once soft cap USD is reached, further buys fill at the oversub multiple ("fulfill rest all").
 */
export function resolveIpoPurchasePricing(round, committedUsdInRound = 0) {
  if (!round) {
    return { priceUsd: 0, tranche: 'primary', oversubscribed: false, softCapUsd: 0 };
  }
  const committed = Math.max(0, Number(committedUsdInRound) || 0);
  const softCapUsd = Number(round.softCapUsd) || 0;
  const oversubscribed = softCapUsd > 0 && committed >= softCapUsd - 1e-9;
  return {
    priceUsd: oversubscribed ? round.oversubPriceUsd : round.priceUsd,
    tranche: oversubscribed ? 'oversub' : 'primary',
    oversubscribed,
    softCapUsd,
    multiple: oversubscribed ? round.oversubMultiple : round.multiple,
  };
}

export function getRoundStatus(round, now = Date.now()) {
  const start = Date.parse(round.startAtIso);
  const end = Date.parse(round.endAtIso);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'unknown';
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

export function getIpoSolTreasury() {
  return process.env.NEXT_PUBLIC_IPO_SOL_TREASURY?.trim() || IPO_SOL_TREASURY_DEFAULT;
}

export function getIpoAptcDistributor() {
  return (
    process.env.NEXT_PUBLIC_IPO_APTC_DISTRIBUTOR?.trim() || IPO_APTC_DISTRIBUTOR_DEFAULT
  );
}

export function getIpoStakingVault() {
  return (
    process.env.NEXT_PUBLIC_APTC_STAKING_VAULT?.trim() ||
    process.env.NEXT_PUBLIC_IPO_STAKING_VAULT?.trim() ||
    IPO_STAKING_VAULT_DEFAULT
  );
}

const ROUNDS = getIpoRounds();
const FIRST_ROUND = ROUNDS[0];
const LAST_ROUND = ROUNDS[ROUNDS.length - 1];
const TOTAL_SOFT_CAP_USD = ROUNDS.reduce((s, r) => s + r.softCapUsd, 0);
const SOFT_CAP_APTC_EST = ROUNDS.reduce((s, r) => s + r.softCapAptc, 0);

export const IPO_SALE = {
  /** Hard ceiling for public IPO APTC (25% of supply). Soft raise is USD-capped per round. */
  saleSupplyPct: 25,
  saleTokens: 250_000_000,
  saleTokensShort: '250M',
  inventoryCapAptc: 250_000_000,
  totalSupply: 1_000_000_000,
  raiseTargetUsd: TOTAL_SOFT_CAP_USD,
  raisePerRoundUsd: 25_000,
  roundCount: ROUNDS.length,
  softCapAptcEstimate: Math.round(SOFT_CAP_APTC_EST),
  softCapAptcEstimateShort: `${Math.round(SOFT_CAP_APTC_EST / 1_000_000)}M`,
  tokenPriceUsd: IPO_BASE_PRICE_USD,
  basePriceUsd: IPO_BASE_PRICE_USD,
  softCapAptc: Math.round(SOFT_CAP_APTC_EST),
  oversubscriptionAllowed: true,
  /** Overall IPO window spans round 1 start → round 3 end */
  startAtIso: FIRST_ROUND.startAtIso,
  endAtIso: LAST_ROUND.endAtIso,
  durationDays: 19,
  timezoneLabel: 'Eastern Time (ET)',
  launchLabel: 'Opens soon',
  endLabel: 'July 30, 2026',
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
  listingMultiple: 5,
  listingPriceUsd: getIpoRoundPriceUsd(5),
  cexMultiple: 20,
  cexPriceUsd: getIpoRoundPriceUsd(20),
  cexTierLabel: 'CEX Tier 3',
};

/**
 * Full price ladder: Round 1–3 (sale) → Listing (5×) → CEX Tier 3 (20×).
 * Round statuses are resolved live via resolveIpoSaleState / getRoundStatus.
 */
export const IPO_PRICE_LADDER = [
  ...ROUNDS.map((r) => ({
    id: r.key,
    round: r.id,
    kind: 'sale',
    label: r.shortLabel,
    fullLabel: r.label,
    priceUsd: r.priceUsd,
    oversubPriceUsd: r.oversubPriceUsd,
    multiple: r.multiple,
    oversubMultiple: r.oversubMultiple,
    softCapUsd: r.softCapUsd,
    startAtIso: r.startAtIso,
    endAtIso: r.endAtIso,
    windowLabel: r.windowLabel,
    blurb: r.blurb,
    status: 'planned',
  })),
  {
    id: 'listing',
    round: 4,
    kind: 'listing',
    label: 'Listing',
    fullLabel: 'Raydium listing',
    priceUsd: IPO_SALE.listingPriceUsd,
    multiple: IPO_SALE.listingMultiple,
    status: 'planned',
    blurb: '5× IPO base',
  },
  {
    id: 'cex',
    round: 5,
    kind: 'cex',
    label: 'CEX T3',
    fullLabel: 'CEX Tier 3',
    priceUsd: IPO_SALE.cexPriceUsd,
    multiple: IPO_SALE.cexMultiple,
    status: 'planned',
    blurb: '20× IPO base',
  },
];

export function getIpoPriceLadder(now = Date.now()) {
  const { activeRound, phase } = resolveIpoSaleState(now);
  return IPO_PRICE_LADDER.map((tier) => {
    if (tier.kind !== 'sale') {
      return {
        ...tier,
        status: phase === 'ended' && tier.id === 'listing' ? 'next' : 'planned',
      };
    }
    const status = getRoundStatus(tier, now);
    const live = status === 'live' && activeRound?.id === tier.round;
    return {
      ...tier,
      status: live ? 'live' : status === 'ended' ? 'ended' : status === 'upcoming' ? 'upcoming' : 'planned',
    };
  });
}

export const IPO_PRICE_LADDER_COPY =
  '250M APTC for sale across 3 rounds. Soft cap $25k each at 1× / 2× / 3× — oversub continues at 1.5× / 2.5× / 3.5× until the round ends or 250M sells out. Listing 5× ($0.002) · CEX Tier 3 20× ($0.008).';

export const IPO_OVERSUB_COPY =
  'Each round soft-caps at $25k. Oversub keeps filling at a higher × until the window ends or the 250M APTC inventory sells out.';

export function formatIpoPriceUsd(price) {
  if (!Number.isFinite(Number(price))) return '—';
  const n = Number(price);
  if (n >= 0.01) return `$${n.toFixed(2)}`;
  // Trim trailing zeros for ladder prices like $0.008
  const fixed = n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return `$${fixed}`;
}

export const IPO_COPY = {
  headline: '$APTC Public IPO',
  subheadLines: [
    {
      id: 'presale',
      text: '250M APTC · 3 rounds · $25k soft each · 1× → 2× → 3×. Listing 5× · CEX Tier 3 at 20×.',
    },
    {
      id: 'terms',
      text: 'Oversub fills at 1.5× / 2.5× / 3.5× until the round ends or 250M sells out.',
      accent: true,
    },
  ],
  stakingBenefits: [
    { id: 'day1', label: '30% APY from day 1' },
    { id: 'vest', label: 'Earn while your APTC vests' },
    { id: 'idle', label: 'Idle supply still yields' },
    { id: 'stack', label: 'Rewards stack · only up' },
  ],
  swapLabel: 'Buy APTC with SOL',
  swapIntro:
    'Send SOL during a live round — APTC locks in the staking vault for 30 days at 30% APY. Track your position under My position; tokens unlock to your wallet after the lock.',
  affiliateHeadline: '3-level IPO referrals',
  affiliateIntro:
    'Share your referral link — earn on every referred SOL deposit. Rewards accrue in APTC; Payout after the 10-day cliff.',
  connectHint: 'Connect the wallet you used to deposit to view your position, unlock time, and rewards.',
};

export function getIpoSchedule() {
  const state = resolveIpoSaleState(Date.now());
  return {
    startAtIso: IPO_SALE.startAtIso,
    endAtIso: IPO_SALE.endAtIso,
    activeRound: state.activeRound,
    nextRound: state.nextRound,
    phase: state.phase,
  };
}

export function getIpoPhase(now = Date.now()) {
  return resolveIpoSaleState(now).phase;
}

export function isIpoLive(now = Date.now()) {
  return getIpoPhase(now) === 'live';
}

export function getIpoCountdownMs(now = Date.now()) {
  const { phase, activeRound, nextRound } = resolveIpoSaleState(now);
  if (phase === 'upcoming' && nextRound) {
    return Math.max(0, Date.parse(nextRound.startAtIso) - now);
  }
  if (phase === 'live' && activeRound) {
    return Math.max(0, Date.parse(activeRound.endAtIso) - now);
  }
  if (phase === 'between_rounds' && nextRound) {
    return Math.max(0, Date.parse(nextRound.startAtIso) - now);
  }
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
