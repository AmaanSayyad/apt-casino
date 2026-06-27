'use client';

import bs58 from 'bs58';
import {
  WALLET_AUTH_MAX_AGE_MS,
  buildWalletAuthMessage,
  normalizeAuthWallet,
} from '@/lib/walletAuthMessage';

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Aptos wallets return signature as string, hex, Uint8Array, or nested auth object. */
function normalizeAptosSignature(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (raw instanceof Uint8Array) return `0x${bytesToHex(raw)}`;
  if (Array.isArray(raw)) return `0x${bytesToHex(new Uint8Array(raw))}`;
  if (typeof raw === 'object') {
    if (typeof raw.signature === 'string') return raw.signature.trim();
    if (raw.signature instanceof Uint8Array) return `0x${bytesToHex(raw.signature)}`;
    if (Array.isArray(raw.signature)) return `0x${bytesToHex(new Uint8Array(raw.signature))}`;
    if (raw.signature?.data?.data && Array.isArray(raw.signature.data.data)) {
      return `0x${bytesToHex(new Uint8Array(raw.signature.data.data))}`;
    }
    if (raw.data?.data && Array.isArray(raw.data.data)) {
      return `0x${bytesToHex(new Uint8Array(raw.data.data))}`;
    }
  }
  return '';
}

const authCache = new Map();

/** Keep cache below server max age so stale signatures are never reused. */
const AUTH_CACHE_TTL_MS = WALLET_AUTH_MAX_AGE_MS - 45_000;

function authStillValid(auth) {
  const ts = auth?.timestamp;
  if (ts == null || !Number.isFinite(ts)) return false;
  return Date.now() - ts < AUTH_CACHE_TTL_MS;
}

/**
 * Sign a short-lived wallet ownership proof for API requests.
 */
export async function signWalletAuth({
  chain,
  wallet,
  signSolanaMessage,
  signAptosMessage,
  aptosPublicKey,
  fresh = false,
}) {
  if (!wallet?.trim()) return null;

  const canonicalWallet = normalizeAuthWallet(wallet, chain);
  const cacheKey = `${chain}:${canonicalWallet}`;
  if (!fresh) {
    const cached = authCache.get(cacheKey);
    if (cached && cached.expires > Date.now() && authStillValid(cached.auth)) {
      return cached.auth;
    }
  }

  const timestamp = Date.now();
  const message = buildWalletAuthMessage(canonicalWallet, chain, timestamp);

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
    signature = normalizeAptosSignature(result?.signature ?? result);
    publicKey =
      result?.publicKey?.toString?.() ??
      result?.publicKey ??
      result?.args?.publicKey?.toString?.() ??
      aptosPublicKey ??
      null;
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

  authCache.set(cacheKey, { auth, expires: Date.now() + AUTH_CACHE_TTL_MS });
  return auth;
}

export function clearWalletAuthCache() {
  authCache.clear();
}
