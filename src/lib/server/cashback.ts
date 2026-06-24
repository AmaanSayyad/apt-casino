import type { ChainId } from '@/lib/chains/registry';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { creditHouseBalance, getHouseBalance } from '@/lib/server/houseBalance';
import { fetchDepositsForWallet, walletLookupKeys } from '@/lib/server/profileLedger';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { rawToNative } from '@/lib/server/play/amounts';

/** 1% of lifetime net deposits (basis points). */
export const CASHBACK_CAP_BPS = 100n;
/** Each bet unlocks 1% of wager toward the cap (basis points). */
export const CASHBACK_BET_BPS = 100n;
/** House balance at or below this (lamports) = busted / can claim full relief. */
export const CASHBACK_BUST_LAMPORTS = 50_000n;

const SUPPORTED: ChainId[] = ['solana'];

export type CashbackStatus = {
  wallet: string;
  chain: ChainId;
  symbol: string;
  depositsNetNative: number;
  capNative: number;
  unlockedNative: number;
  claimedNative: number;
  claimableNative: number;
  progressPct: number;
  totalBetsCount: number;
  canClaim: boolean;
  isBusted: boolean;
  houseBalanceNative: number;
};

function bpsOf(amount: bigint, bps: bigint): bigint {
  if (amount <= 0n || bps <= 0n) return 0n;
  return (amount * bps) / 10_000n;
}

async function sumNetDepositsRaw(wallet: string, chain: ChainId): Promise<bigint> {
  const db = getSupabaseAdmin();
  if (!db) return 0n;
  const { data } = await fetchDepositsForWallet(db, wallet, chain);
  const units = getPlayChainConfig(chain)?.units ?? 1_000_000_000;
  let netRaw = 0n;
  for (const row of data) {
    const netFromCol = BigInt(String(row.net_credited_octas ?? 0));
    if (netFromCol > 0n) {
      netRaw += netFromCol;
      continue;
    }
    if (chain === 'solana') {
      const native = Number(row.amount_native ?? 0);
      const fee = BigInt(String(row.fee_octas ?? 0));
      const gross = BigInt(Math.floor(native * Number(units)));
      netRaw += gross > fee ? gross - fee : 0n;
    }
  }
  return netRaw;
}

async function ensureRow(wallet: string, chain: ChainId) {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const cfg = getPlayChainConfig(chain);
  const { data } = await db
    .from('wallet_cashback')
    .select('*')
    .eq('wallet', wallet)
    .eq('chain', chain)
    .maybeSingle();

  if (data) return data;

  const { data: inserted, error } = await db
    .from('wallet_cashback')
    .insert({
      wallet,
      chain,
      currency: cfg?.dbCurrency ?? 'SOL',
    })
    .select('*')
    .single();

  if (error) {
    console.warn('[cashback] ensureRow', error.message);
    return null;
  }
  return inserted;
}

/** Replay game_play_events so pre-launch bets count toward unlocked cashback. */
async function backfillCashbackFromPlayHistory(wallet: string, chain: ChainId): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) return;

  const keys = walletLookupKeys(wallet, chain);
  if (!keys.length) return;

  const { data: events } = await db
    .from('game_play_events')
    .select('game, bet_raw')
    .in('wallet', keys)
    .eq('chain', chain)
    .order('created_at', { ascending: true });

  if (!events?.length) return;

  const row = await ensureRow(wallet, chain);
  if (!row) return;

  const capRaw = BigInt(String(row.cap_raw ?? 0));
  if (capRaw <= 0n) return;

  let unlocked = 0n;
  for (const ev of events) {
    const betRaw = BigInt(String(ev.bet_raw ?? 0));
    if (betRaw <= 0n) continue;
    const slice = bpsOf(betRaw, CASHBACK_BET_BPS);
    const room = capRaw > unlocked ? capRaw - unlocked : 0n;
    if (room <= 0n) break;
    unlocked += slice > room ? room : slice;
  }

  const prevUnlocked = BigInt(String(row.unlocked_raw ?? 0));
  if (unlocked <= prevUnlocked && Number(row.total_bets_count ?? 0) >= events.length) return;

  await db
    .from('wallet_cashback')
    .update({
      unlocked_raw: unlocked.toString(),
      total_bets_count: events.length,
      updated_at: new Date().toISOString(),
    })
    .eq('wallet', wallet)
    .eq('chain', chain);
}

/** Recompute cap from deposits_log (1% of net credited). */
export async function syncCashbackCap(wallet: string, chain: ChainId = 'solana'): Promise<void> {
  if (!SUPPORTED.includes(chain)) return;
  const normalized = normalizeWalletForChain(wallet, chain);
  if (!normalized) return;

  const db = getSupabaseAdmin();
  if (!db) return;

  const depositsNetRaw = await sumNetDepositsRaw(normalized, chain);
  const capRaw = bpsOf(depositsNetRaw, CASHBACK_CAP_BPS);

  await ensureRow(normalized, chain);
  await db
    .from('wallet_cashback')
    .update({
      deposits_net_raw: depositsNetRaw.toString(),
      cap_raw: capRaw.toString(),
      updated_at: new Date().toISOString(),
    })
    .eq('wallet', normalized)
    .eq('chain', chain);
}

/** Accrue cashback slice on each logged bet (all four games via recordGamePlayEvent). */
export async function accrueCashbackOnBet(input: {
  wallet: string;
  chain: ChainId;
  game: string;
  betRaw: bigint;
}): Promise<void> {
  const chain = input.chain;
  if (!SUPPORTED.includes(chain) || input.betRaw <= 0n) return;

  const wallet = normalizeWalletForChain(input.wallet, chain);
  if (!wallet) return;

  const db = getSupabaseAdmin();
  if (!db) return;

  await syncCashbackCap(wallet, chain);

  const row = await ensureRow(wallet, chain);
  if (!row) return;

  const capRaw = BigInt(String(row.cap_raw ?? 0));
  if (capRaw <= 0n) return;

  let unlockedRaw = BigInt(String(row.unlocked_raw ?? 0));
  const remaining = capRaw > unlockedRaw ? capRaw - unlockedRaw : 0n;
  if (remaining <= 0n) return;

  const fromBet = bpsOf(input.betRaw, CASHBACK_BET_BPS);
  const accrualRaw = fromBet > remaining ? remaining : fromBet;
  if (accrualRaw <= 0n) return;

  unlockedRaw += accrualRaw;
  const bets = Number(row.total_bets_count ?? 0) + 1;
  const now = new Date().toISOString();

  await db
    .from('wallet_cashback')
    .update({
      unlocked_raw: unlockedRaw.toString(),
      total_bets_count: bets,
      last_accrual_at: now,
      updated_at: now,
    })
    .eq('wallet', wallet)
    .eq('chain', chain);

  await db.from('cashback_accrual_log').insert({
    wallet,
    chain,
    game: String(input.game).toLowerCase(),
    bet_raw: input.betRaw.toString(),
    accrual_raw: accrualRaw.toString(),
  });
}

export async function getCashbackStatus(
  wallet: string,
  chain: ChainId = 'solana',
): Promise<CashbackStatus | null> {
  if (!SUPPORTED.includes(chain)) return null;
  const normalized = normalizeWalletForChain(wallet, chain);
  if (!normalized) return null;

  await syncCashbackCap(normalized, chain);
  await backfillCashbackFromPlayHistory(normalized, chain);

  const db = getSupabaseAdmin();
  if (!db) return null;

  const row = await ensureRow(normalized, chain);
  if (!row) return null;

  const cfg = getPlayChainConfig(chain)!;
  const capRaw = BigInt(String(row.cap_raw ?? 0));
  let unlockedRaw = BigInt(String(row.unlocked_raw ?? 0));
  const claimedRaw = BigInt(String(row.claimed_raw ?? 0));
  const depositsNetRaw = BigInt(String(row.deposits_net_raw ?? 0));

  const houseRaw = await getHouseBalance(normalized, chain, cfg.dbCurrency);
  const isBusted = houseRaw <= CASHBACK_BUST_LAMPORTS;

  if (isBusted && unlockedRaw < capRaw) {
    unlockedRaw = capRaw;
    await db
      .from('wallet_cashback')
      .update({
        unlocked_raw: unlockedRaw.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('wallet', normalized)
      .eq('chain', chain);
  }

  const claimableRaw =
    isBusted && capRaw > claimedRaw
      ? capRaw - claimedRaw
      : unlockedRaw > claimedRaw
        ? unlockedRaw - claimedRaw
        : 0n;

  const progressPct =
    capRaw > 0n ? Math.min(100, Number((unlockedRaw * 10000n) / capRaw) / 100) : 0;

  return {
    wallet: normalized,
    chain,
    symbol: cfg.nativeSymbol,
    depositsNetNative: rawToNative(chain, depositsNetRaw),
    capNative: rawToNative(chain, capRaw),
    unlockedNative: rawToNative(chain, unlockedRaw),
    claimedNative: rawToNative(chain, claimedRaw),
    claimableNative: rawToNative(chain, claimableRaw),
    progressPct,
    totalBetsCount: Number(row.total_bets_count ?? 0),
    canClaim: claimableRaw > 0n && isBusted,
    isBusted,
    houseBalanceNative: rawToNative(chain, houseRaw),
  };
}

export async function claimCashback(
  wallet: string,
  chain: ChainId = 'solana',
): Promise<{ ok: true; creditedNative: number; balanceNative: number } | { ok: false; error: string }> {
  if (!SUPPORTED.includes(chain)) {
    return { ok: false, error: 'Cashback not available' };
  }

  const normalized = normalizeWalletForChain(wallet, chain);
  if (!normalized) return { ok: false, error: 'Invalid wallet' };

  await syncCashbackCap(normalized, chain);
  await backfillCashbackFromPlayHistory(normalized, chain);

  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: 'Database not configured' };

  const { data, error } = await db.rpc('claim_cashback_sol_atomic', {
    p_wallet: normalized,
  });

  if (error) {
    const msg = error.message || 'Claim failed';
    if (/not_busted/i.test(msg)) {
      return {
        ok: false,
        error:
          'Cashback can be claimed when your house balance is empty. Keep playing to unlock more, or use your remaining balance first.',
      };
    }
    if (/nothing_to_claim/i.test(msg)) {
      return { ok: false, error: 'No cashback available to claim' };
    }
    if (/no_cashback_record/i.test(msg)) {
      return { ok: false, error: 'Cashback record not found' };
    }
    if (/claim_cashback_sol_atomic|function.*does not exist/i.test(msg)) {
      return { ok: false, error: 'Cashback claims are temporarily unavailable. Please try again shortly.' };
    }
    return { ok: false, error: msg };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const creditedRaw = BigInt(String(row?.credited_raw ?? 0));
  const balanceRaw = BigInt(String(row?.balance_raw ?? 0));

  if (creditedRaw <= 0n) {
    return { ok: false, error: 'No cashback available to claim' };
  }

  return {
    ok: true,
    creditedNative: rawToNative(chain, creditedRaw),
    balanceNative: rawToNative(chain, balanceRaw),
  };
}
