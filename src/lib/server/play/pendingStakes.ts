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

async function findNewestOpenStake(wallet: string, chain: ChainId) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const now = new Date().toISOString();
  const { data: rows, error } = await db
    .from('play_pending_stakes')
    .select('id, bet_raw')
    .eq('wallet', wallet)
    .eq('chain', chain)
    .is('consumed_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return rows?.[0] ?? null;
}

function assertCreditWithinMultiplier(betRaw: bigint, creditRaw: bigint) {
  const maxCredit = betRaw * BigInt(maxPayoutMultiplier());
  if (creditRaw > maxCredit) {
    throw new Error('Payout exceeds allowed multiplier for this bet');
  }
}

async function markPendingStakeConsumed(stakeId: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const { error: updErr } = await db
    .from('play_pending_stakes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', stakeId)
    .is('consumed_at', null);

  if (updErr) throw new Error(updErr.message);
}

/**
 * Validate stake, credit house balance, then mark stake consumed.
 * Credit runs before consume so a failed credit does not orphan the stake.
 */
export async function creditWithPendingStake(input: {
  wallet: string;
  chain: ChainId;
  currency: string;
  creditRaw: bigint;
  creditHouseBalance: (amountRaw: bigint) => Promise<bigint>;
}): Promise<bigint> {
  if (input.creditRaw <= 0n) {
    throw new Error('Credit amount must be positive');
  }

  const row = await findNewestOpenStake(input.wallet, input.chain);
  if (!row) {
    throw new Error('No open bet stake found — credits require a recent debit first');
  }

  const betRaw = BigInt(String(row.bet_raw ?? '0'));
  if (betRaw <= 0n) {
    throw new Error('Invalid pending stake');
  }

  assertCreditWithinMultiplier(betRaw, input.creditRaw);

  const newBalance = await input.creditHouseBalance(input.creditRaw);
  await markPendingStakeConsumed(String(row.id));
  return newBalance;
}

/**
 * Debit the bet, record stake, then credit winnings or release on loss.
 */
export async function settlePlayRound(input: {
  wallet: string;
  chain: ChainId;
  currency: string;
  betAmountRaw: bigint;
  payoutAmountRaw: bigint;
  game?: string | null;
  debitHouseBalance: (amountRaw: bigint) => Promise<bigint>;
  creditHouseBalance: (amountRaw: bigint) => Promise<bigint>;
}): Promise<bigint> {
  if (input.betAmountRaw <= 0n) {
    throw new Error('Bet amount must be positive');
  }

  const balanceAfterDebit = await input.debitHouseBalance(input.betAmountRaw);
  await recordPendingStake({
    wallet: input.wallet,
    chain: input.chain,
    betRaw: input.betAmountRaw,
    game: input.game,
  });

  if (input.payoutAmountRaw > 0n) {
    return creditWithPendingStake({
      wallet: input.wallet,
      chain: input.chain,
      currency: input.currency,
      creditRaw: input.payoutAmountRaw,
      creditHouseBalance: input.creditHouseBalance,
    });
  }

  await releasePendingStake({ wallet: input.wallet, chain: input.chain });
  return balanceAfterDebit;
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

  const { data, error } = await db.rpc('consume_pending_stake', {
    p_wallet: input.wallet,
    p_chain: input.chain,
    p_credit_raw: input.creditRaw.toString(),
    p_max_multiplier: maxPayoutMultiplier(),
  });

  if (!error && data != null) {
    return { betRaw: BigInt(String(data)) };
  }

  if (error && !/consume_pending_stake|function.*does not exist/i.test(error.message)) {
    const msg = error.message;
    if (/no_open_stake/i.test(msg)) {
      throw new Error('No open bet stake found — credits require a recent debit first');
    }
    if (/payout_exceeds_multiplier/i.test(msg)) {
      throw new Error('Payout exceeds allowed multiplier for this bet');
    }
    if (/stake_already_consumed/i.test(msg)) {
      throw new Error('Bet stake already used for a payout');
    }
    throw new Error(msg);
  }

  return consumePendingStakeForCreditLegacy(input);
}

async function consumePendingStakeForCreditLegacy(input: {
  wallet: string;
  chain: ChainId;
  creditRaw: bigint;
}): Promise<{ betRaw: bigint }> {
  const row = await findNewestOpenStake(input.wallet, input.chain);
  if (!row) {
    throw new Error('No open bet stake found — credits require a recent debit first');
  }

  const betRaw = BigInt(String(row.bet_raw ?? '0'));
  if (betRaw <= 0n) {
    throw new Error('Invalid pending stake');
  }

  assertCreditWithinMultiplier(betRaw, input.creditRaw);
  await markPendingStakeConsumed(String(row.id));

  return { betRaw };
}

/** Mark the newest open stake as settled after a losing round (no payout). */
export async function releasePendingStake(input: {
  wallet: string;
  chain: ChainId;
}): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const now = new Date().toISOString();
  const { data: rows, error } = await db
    .from('play_pending_stakes')
    .select('id')
    .eq('wallet', input.wallet)
    .eq('chain', input.chain)
    .is('consumed_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const row = rows?.[0];
  if (!row) return;

  const { error: updErr } = await db
    .from('play_pending_stakes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('consumed_at', null);

  if (updErr) throw new Error(updErr.message);
}
