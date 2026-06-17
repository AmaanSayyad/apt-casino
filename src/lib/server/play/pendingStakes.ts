import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import type { ChainId } from '@/lib/chains/registry';

const DEFAULT_MAX_PAYOUT_MULTIPLIER = 2000;
const STAKE_TTL_MS = 15 * 60 * 1000;

function maxPayoutMultiplier(): number {
  const raw = process.env.MAX_GAME_PAYOUT_MULTIPLIER?.trim();
  const n = raw ? Number(raw) : DEFAULT_MAX_PAYOUT_MULTIPLIER;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX_PAYOUT_MULTIPLIER;
  return Math.floor(n);
}

export async function recordPendingStake(input: {
  wallet: string;
  chain: ChainId;
  betRaw: bigint;
  game?: string | null;
}): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const expiresAt = new Date(Date.now() + STAKE_TTL_MS).toISOString();

  const { error } = await db.from('play_pending_stakes').insert({
    wallet: input.wallet,
    chain: input.chain,
    bet_raw: input.betRaw.toString(),
    game: input.game ?? null,
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);
}

/**
 * Consume the newest open stake and validate payout is within multiplier cap.
 * Returns the bet amount that was locked for this credit.
 */
export async function consumePendingStakeForCredit(input: {
  wallet: string;
  chain: ChainId;
  creditRaw: bigint;
}): Promise<{ betRaw: bigint }> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  if (input.creditRaw <= 0n) {
    throw new Error('Credit amount must be positive');
  }

  const now = new Date().toISOString();
  const { data: rows, error } = await db
    .from('play_pending_stakes')
    .select('id, bet_raw')
    .eq('wallet', input.wallet)
    .eq('chain', input.chain)
    .is('consumed_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const row = rows?.[0];
  if (!row) {
    throw new Error('No open bet stake found — credits require a recent debit first');
  }

  const betRaw = BigInt(String(row.bet_raw ?? '0'));
  if (betRaw <= 0n) {
    throw new Error('Invalid pending stake');
  }

  const maxCredit = betRaw * BigInt(maxPayoutMultiplier());
  if (input.creditRaw > maxCredit) {
    throw new Error('Payout exceeds allowed multiplier for this bet');
  }

  const { error: updErr } = await db
    .from('play_pending_stakes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('consumed_at', null);

  if (updErr) throw new Error(updErr.message);

  return { betRaw };
}
