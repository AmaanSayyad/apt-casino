import { getPlayChainConfig } from '@/lib/chains/registry';

/** Synthetic wallet used for demo play (no chain signature required). */
export const DEMO_PLAY_WALLET = 'DemoPlay1111111111111111111111111111111';

const DEMO_BALANCES_LS = 'aptcasino_demo_balances_by_chain';

/** Default demo bankroll in native tokens (e.g. 100 SOL). Override via NEXT_PUBLIC_DEMO_START_NATIVE. */
export function demoStartNativeAmount() {
  const fromEnv = Number(process.env.NEXT_PUBLIC_DEMO_START_NATIVE);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 100;
}

export function demoStartBalanceRaw(chainId) {
  const cfg = getPlayChainConfig(chainId);
  const units = cfg?.units ?? 1_000_000_000;
  return String(Math.round(demoStartNativeAmount() * units));
}

export function readDemoBalancesByChain() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DEMO_BALANCES_LS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeDemoBalancesByChain(map) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_BALANCES_LS, JSON.stringify(map));
}

export function isDemoPlayWallet(wallet) {
  return wallet === DEMO_PLAY_WALLET || String(wallet || '').startsWith('demo-play');
}

/** Generic profile payload — demo mode must never load the shared demo wallet row from DB. */
export function buildDemoProfilePayload(chainId, balanceNative = 0) {
  const cfg = getPlayChainConfig(chainId);
  const symbol = cfg?.nativeSymbol ?? (chainId === 'solana' ? 'SOL' : 'APT');
  return {
    wallet: DEMO_PLAY_WALLET,
    chain: chainId,
    nativeSymbol: symbol,
    profile: {
      handle: 'Demo Player',
      avatar_url: null,
      bio: 'Practice mode — connect a wallet to see your real profile and on-chain history.',
      twitter_handle: null,
      created_at: null,
      updated_at: null,
    },
    onChainBalanceApt: null,
    onChainBalanceNative: null,
    deposits: {
      count: 0,
      totalApt: 0,
      totalFeesApt: 0,
      totalNetCreditedApt: 0,
      recent: [],
    },
    withdrawals: {
      count: 0,
      totalApt: 0,
      pendingCount: 0,
      pendingApt: 0,
      recent: [],
    },
    staking: {
      activeCount: 0,
      claimableCount: 0,
      totalActiveAptc: 0,
      positions: [],
    },
    referrals: {
      code: null,
      validReferrals: 0,
      pendingReferrals: 0,
      totalReferrals: 0,
      earnedApt: 0,
    },
    cashback: null,
    depositAptcBonus: null,
    dailyStreak: null,
    promotions: null,
    feeTiers: [],
    demoMode: true,
    houseBalanceNative: balanceNative,
  };
}

export function buildDemoGamesPayload() {
  return {
    netProfitApt: 0,
    winrate: 0,
    totalBets: 0,
    totalWageredApt: 0,
    totalWonApt: 0,
    games: [],
    recent: [],
    demoMode: true,
  };
}

export function buildDemoReferralStatsPayload() {
  return {
    code: null,
    invited: 0,
    validated: 0,
    aptcEarned: 0,
    demoMode: true,
  };
}
