/** Shared wallet-auth message format (client + server). */

export const WALLET_AUTH_DOMAIN = 'aptcasino.fun';
export const WALLET_AUTH_MAX_AGE_MS = 5 * 60 * 1000;

export function buildWalletAuthMessage(wallet: string, chain: string, timestampMs: number): string {
  return [
    'AptCasino Wallet Auth',
    `domain: ${WALLET_AUTH_DOMAIN}`,
    `wallet: ${wallet}`,
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
