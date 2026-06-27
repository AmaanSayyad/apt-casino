/** Shared wallet-auth message format (client + server). */

export const WALLET_AUTH_DOMAIN = 'aptcasino.fun';
export const WALLET_AUTH_MAX_AGE_MS = 5 * 60 * 1000;

/** Canonical wallet string for auth messages & API keys (Aptos = 0x + 64 hex). */
export function normalizeAuthWallet(wallet: string, chain: string): string {
  const w = String(wallet || '').trim();
  if (!w) return w;
  if (chain === 'aptos' && /^0x[0-9a-f]+$/i.test(w)) {
    return `0x${w.slice(2).toLowerCase().padStart(64, '0')}`;
  }
  return w;
}

export function buildWalletAuthMessage(wallet: string, chain: string, timestampMs: number): string {
  const canonical = normalizeAuthWallet(wallet, chain);
  return [
    'AptCasino Wallet Auth',
    `domain: ${WALLET_AUTH_DOMAIN}`,
    `wallet: ${canonical}`,
    `chain: ${chain}`,
    `timestamp: ${timestampMs}`,
  ].join('\n');
}

export type WalletAuthPayload = {
  message: string;
  signature: string;
  publicKey?: string | null;
  timestamp?: number;
};
