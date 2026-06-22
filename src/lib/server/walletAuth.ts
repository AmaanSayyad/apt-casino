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

function verifyAptosWalletAuth(message: string, signature: string, publicKey?: string | null): boolean {
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

export function verifyWalletAuthPayload(
  wallet: string,
  chain: ChainId,
  auth: WalletAuthPayload | null | undefined,
): boolean {
  if (!auth?.message?.trim() || !auth.signature?.trim()) return false;

  const message = auth.message.trim();
  if (!message.includes(`domain: ${WALLET_AUTH_DOMAIN}`)) return false;

  const msgWallet = parseWalletFromMessage(message);
  const msgChain = parseChainFromMessage(message);
  const normalized = normalizeWalletForChain(wallet, chain);
  const normalizedMsgWallet = msgWallet
    ? normalizeWalletForChain(msgWallet, chain)
    : null;
  if (!normalized || !normalizedMsgWallet || normalized !== normalizedMsgWallet) return false;
  if (msgChain !== chain) return false;

  const ts = auth.timestamp ?? parseTimestampFromMessage(message);
  if (ts == null || Math.abs(Date.now() - ts) > WALLET_AUTH_MAX_AGE_MS) return false;

  const expected = buildWalletAuthMessage(normalized, chain, ts);
  if (message !== expected) return false;

  if (chain === 'solana') {
    return verifySolanaWalletAuth(normalized, message, auth.signature.trim());
  }
  if (chain === 'aptos') {
    return verifyAptosWalletAuth(message, auth.signature.trim(), auth.publicKey);
  }
  return false;
}

export function readWalletAuthFromBody(body: unknown): WalletAuthPayload | null {
  if (!body || typeof body !== 'object') return null;
  const auth = (body as { walletAuth?: WalletAuthPayload }).walletAuth;
  if (!auth?.message || !auth.signature) return null;
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

export function assertWalletAuth(
  wallet: string,
  chain: ChainId,
  auth: WalletAuthPayload | null | undefined,
): NextResponse | null {
  if (!isWalletAuthRequired()) return null;
  if (verifyWalletAuthPayload(wallet, chain, auth)) return null;
  return walletAuthErrorResponse();
}
