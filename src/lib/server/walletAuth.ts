import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { Ed25519PublicKey, Ed25519Signature } from '@aptos-labs/ts-sdk';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import type { ChainId } from '@/lib/chains/registry';
import {
  WALLET_AUTH_DOMAIN,
  WALLET_AUTH_MAX_AGE_MS,
  buildWalletAuthMessage,
  type WalletAuthPayload,
} from '@/lib/walletAuthMessage';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { getAptosForServer } from '@/lib/server/aptTreasury';
import { consumeWalletAuthSignature } from '@/lib/server/walletAuthConsume';
import { normalizeWalletAuthSignature } from '@/lib/server/walletAuthSignature';
import { rateLimitByKey, rateLimitRequest } from '@/lib/server/requestRateLimit';

export function isWalletAuthRequired(): boolean {
  const raw = process.env.WALLET_AUTH_REQUIRED?.trim().toLowerCase();
  if (raw === '0' || raw === 'false') return false;
  return process.env.NODE_ENV === 'production' || raw === '1' || raw === 'true';
}

function parseTimestampFromMessage(message: string): number | null {
  const line = message.split('\n').find((l) => l.startsWith('timestamp: '));
  if (!line) return null;
  const ts = Number(line.slice('timestamp: '.length).trim());
  return Number.isFinite(ts) ? ts : null;
}

function parseWalletFromMessage(message: string): string | null {
  const line = message.split('\n').find((l) => l.startsWith('wallet: '));
  return line ? line.slice('wallet: '.length).trim() : null;
}

function parseChainFromMessage(message: string): string | null {
  const line = message.split('\n').find((l) => l.startsWith('chain: '));
  return line ? line.slice('chain: '.length).trim() : null;
}

function normalizeAptosHex(hex: string): string {
  let s = hex.trim().toLowerCase();
  if (!s.startsWith('0x')) s = `0x${s}`;
  return s;
}

function normalizeAptosAddressHex(addr: string): string {
  let hex = addr.trim().toLowerCase();
  hex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return hex.padStart(64, '0');
}

function verifySolanaWalletAuth(wallet: string, message: string, signature: string): boolean {
  try {
    const pubkey = new PublicKey(wallet);
    const sig = bs58.decode(signature);
    const msgBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msgBytes, sig, pubkey.toBytes());
  } catch {
    return false;
  }
}

function verifyAptosSignature(message: string, signature: string, publicKey?: string | null): boolean {
  if (!publicKey?.trim()) return false;
  try {
    const pub = new Ed25519PublicKey(publicKey.trim());
    let sigHex = signature.trim();
    if (!sigHex.startsWith('0x')) sigHex = `0x${sigHex}`;
    const sig = new Ed25519Signature(sigHex);
    return pub.verifySignature({
      message: new TextEncoder().encode(message),
      signature: sig,
    });
  } catch {
    return false;
  }
}

/** Bind signer public key to the claimed Aptos account (standard + rotated keys). */
async function aptosPublicKeyOwnsWallet(wallet: string, publicKeyHex: string): Promise<boolean> {
  try {
    const pub = new Ed25519PublicKey(publicKeyHex.trim());
    const signerAuthKey = pub.authKey();
    const walletNorm = normalizeAptosAddressHex(wallet);
    const derivedNorm = normalizeAptosAddressHex(signerAuthKey.derivedAddress().toString());

    if (walletNorm === derivedNorm) return true;

    const aptos = getAptosForServer();
    const info = await aptos.getAccountInfo({ accountAddress: wallet });
    const onChainAuth = normalizeAptosHex(String(info.authentication_key ?? ''));
    const signerAuth = normalizeAptosHex(signerAuthKey.toString());
    return onChainAuth === signerAuth;
  } catch {
    return false;
  }
}


function validateAuthEnvelope(
  wallet: string,
  chain: ChainId,
  auth: WalletAuthPayload | null | undefined,
): { ok: true; normalized: string; message: string; signature: string } | { ok: false } {
  if (!auth?.message?.trim()) return { ok: false };

  const signature = normalizeWalletAuthSignature(auth.signature);
  if (!signature) return { ok: false };

  const message = auth.message.trim();
  if (!message.includes(`domain: ${WALLET_AUTH_DOMAIN}`)) return { ok: false };

  const msgWallet = parseWalletFromMessage(message);
  const msgChain = parseChainFromMessage(message);
  const normalized = normalizeWalletForChain(wallet, chain);
  const normalizedMsgWallet = msgWallet ? normalizeWalletForChain(msgWallet, chain) : null;
  if (!normalized || !normalizedMsgWallet || normalized !== normalizedMsgWallet) return { ok: false };
  if (msgChain !== chain) return { ok: false };

  const ts = auth.timestamp ?? parseTimestampFromMessage(message);
  if (ts == null || Math.abs(Date.now() - ts) > WALLET_AUTH_MAX_AGE_MS) return { ok: false };

  const expected = buildWalletAuthMessage(normalized, chain, ts);
  if (message !== expected) return { ok: false };

  return { ok: true, normalized, message, signature };
}

export async function verifyWalletAuthPayload(
  wallet: string,
  chain: ChainId,
  auth: WalletAuthPayload | null | undefined,
): Promise<boolean> {
  const envelope = validateAuthEnvelope(wallet, chain, auth);
  if (!envelope.ok) return false;

  if (chain === 'solana') {
    return verifySolanaWalletAuth(envelope.normalized, envelope.message, envelope.signature);
  }
  if (chain === 'aptos') {
    if (!verifyAptosSignature(envelope.message, envelope.signature, auth!.publicKey)) {
      return false;
    }
    return aptosPublicKeyOwnsWallet(envelope.normalized, auth!.publicKey!);
  }
  return false;
}

export function readWalletAuthFromBody(body: unknown): WalletAuthPayload | null {
  if (!body || typeof body !== 'object') return null;
  const auth = (body as { walletAuth?: WalletAuthPayload }).walletAuth;
  if (!auth?.message?.trim()) return null;
  if (!normalizeWalletAuthSignature(auth.signature)) return null;
  return auth;
}

export function walletAuthErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        'Wallet ownership proof required. Sign the auth message with your connected wallet and retry.',
      code: 'wallet_auth_required',
    },
    { status: 401 },
  );
}

export function walletAuthReplayResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'This wallet signature was already used. Sign a fresh auth message and retry.',
      code: 'wallet_auth_replay',
    },
    { status: 401 },
  );
}

export function walletAuthRateLimitResponse(request: Request, wallet?: string | null): NextResponse | null {
  if (rateLimitRequest(request, { key: 'wallet-auth-ip', limit: 15, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: 'Too many wallet auth attempts. Please try again shortly.', code: 'rate_limited' },
      { status: 429 },
    );
  }
  const normalized = wallet?.trim();
  if (normalized && rateLimitByKey(`wallet-auth:${normalized}`, { limit: 120, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: 'Too many requests for this wallet. Please try again shortly.', code: 'rate_limited' },
      { status: 429 },
    );
  }
  return null;
}

export async function assertWalletAuth(
  wallet: string,
  chain: ChainId,
  auth: WalletAuthPayload | null | undefined,
  opts?: { consume?: boolean; purpose?: string },
): Promise<NextResponse | null> {
  if (!isWalletAuthRequired()) return null;
  if (!(await verifyWalletAuthPayload(wallet, chain, auth))) {
    return walletAuthErrorResponse();
  }

  if (opts?.consume && auth) {
    const normalized = normalizeWalletForChain(wallet, chain) ?? wallet;
    const consumed = await consumeWalletAuthSignature(auth, normalized, chain, opts.purpose);
    if (consumed === 'replay') return walletAuthReplayResponse();
    if (consumed === 'unavailable' && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Auth replay protection unavailable. Try again shortly.', code: 'wallet_auth_store' },
        { status: 503 },
      );
    }
  }

  return null;
}
