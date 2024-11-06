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
