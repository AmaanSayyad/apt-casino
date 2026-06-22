'use client';

import bs58 from 'bs58';
import { buildWalletAuthMessage } from '@/lib/walletAuthMessage';

const authCache = new Map();

/**
 * Sign a short-lived wallet ownership proof for API requests.
 */
export async function signWalletAuth({
  chain,
  wallet,
  signSolanaMessage,
  signAptosMessage,
  aptosPublicKey,
}) {
  if (!wallet?.trim()) return null;

  const cacheKey = `${chain}:${wallet}`;
  const cached = authCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.auth;
  }

  const timestamp = Date.now();
  const message = buildWalletAuthMessage(wallet, chain, timestamp);

  let signature = '';
  let publicKey = null;

  if (chain === 'solana') {
    if (!signSolanaMessage) return null;
    const encoded = new TextEncoder().encode(message);
    const signed = await signSolanaMessage(encoded);
    signature = bs58.encode(signed);
  } else if (chain === 'aptos') {
    if (!signAptosMessage) return null;
    const result = await signAptosMessage({
      message,
      nonce: String(timestamp),
    });
    signature = result?.signature ?? '';
    publicKey = result?.publicKey ?? aptosPublicKey ?? null;
  } else {
    return null;
  }

  if (!signature) return null;

  const auth = {
    message,
    signature,
    publicKey,
    timestamp,
  };

  authCache.set(cacheKey, { auth, expires: Date.now() + 4 * 60 * 1000 });
  return auth;
}

export function clearWalletAuthCache() {
  authCache.clear();
}
