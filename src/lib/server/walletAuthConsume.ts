import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import type { WalletAuthPayload } from '@/lib/walletAuthMessage';
import { normalizeWalletAuthSignature } from '@/lib/server/walletAuthSignature';

export function hashWalletAuthSignature(signature: unknown): string {
  const normalized = normalizeWalletAuthSignature(signature) ?? String(signature ?? '');
  return createHash('sha256').update(normalized).digest('hex');
}

export type ConsumeAuthResult = 'ok' | 'replay' | 'unavailable';

/** Mark a wallet-auth signature as used. Returns replay if already consumed. */
export async function consumeWalletAuthSignature(
  auth: WalletAuthPayload,
  wallet: string,
  chain: string,
  purpose?: string,
): Promise<ConsumeAuthResult> {
  const db = getSupabaseAdmin();
  if (!db) return 'unavailable';

  const signatureHash = hashWalletAuthSignature(auth.signature);

  const { error } = await db.from('wallet_auth_consumed').insert({
    signature_hash: signatureHash,
    wallet,
    chain,
    purpose: purpose ?? null,
  });

  if (error) {
    if (error.code === '23505') return 'replay';
    console.warn('[walletAuthConsume] insert failed:', error.message);
    return 'unavailable';
  }

  // Best-effort cleanup of entries older than 48h
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  db.from('wallet_auth_consumed').delete().lt('consumed_at', cutoff).then(() => {});

  return 'ok';
}
