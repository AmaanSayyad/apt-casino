import type { ChainId } from '@/lib/chains/registry';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { getManualWithdrawUsdThreshold } from '@/lib/server/platformFees';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const AUTO_WITHDRAW_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getAutoWithdrawDailyUsdCap(): number {
  const raw = process.env.AUTO_WITHDRAW_DAILY_USD_CAP?.trim() ?? '50';
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 50;
  return n;
}

/** Max native amount per auto-withdraw tx (above → manual review). */
export function getAutoWithdrawMaxNative(chain: ChainId): number {
  if (chain === 'solana') {
    const raw = process.env.AUTO_WITHDRAW_MAX_SOL?.trim() ?? '0.1';
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0.1;
  }
  if (chain === 'aptos') {
    const raw = process.env.AUTO_WITHDRAW_MAX_APT?.trim() ?? '1';
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  return Infinity;
}

/** Max total native auto-withdrawn per wallet per 24h (above → manual review). */
export function getAutoWithdrawDailyMaxNative(chain: ChainId): number {
  if (chain === 'solana') {
    const raw = process.env.AUTO_WITHDRAW_DAILY_MAX_SOL?.trim() ?? '0.1';
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0.1;
  }
  if (chain === 'aptos') {
    const raw = process.env.AUTO_WITHDRAW_DAILY_MAX_APT?.trim() ?? '10';
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 10;
  }
  return Infinity;
}

export function getAutoWithdrawNativeSymbol(chain: ChainId): string {
  const cfg = getPlayChainConfig(chain);
  return cfg?.nativeSymbol ?? chain.toUpperCase();
}

export async function getWalletNetDepositedNative(
  wallet: string,
  chain: ChainId,
): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { data, error } = await db
    .from('deposits_log')
    .select('net_credited_octas')
    .eq('wallet', wallet)
    .eq('chain', chain);

  if (error || !data?.length) return 0;

  const cfg = getPlayChainConfig(chain);
  const units = cfg?.units ?? 1e9;
  const totalRaw = data.reduce((sum, row) => sum + Number(row.net_credited_octas ?? 0), 0);
  return totalRaw / units;
}

export async function getAutoWithdrawUsdInWindow(
  wallet: string,
  chain: ChainId,
  windowMs = AUTO_WITHDRAW_WINDOW_MS,
): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const since = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await db
    .from('withdrawal_requests')
    .select('usd_estimate, gross_apt')
    .eq('wallet', wallet)
    .eq('chain', chain)
    .eq('status', 'auto')
    .gte('created_at', since);

  if (error || !data?.length) return 0;

  return data.reduce((sum, row) => {
    const usd = Number(row.usd_estimate);
    if (Number.isFinite(usd) && usd > 0) return sum + usd;
    return sum;
  }, 0);
}

export async function getAutoWithdrawNativeInWindow(
  wallet: string,
  chain: ChainId,
  windowMs = AUTO_WITHDRAW_WINDOW_MS,
): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const since = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await db
    .from('withdrawal_requests')
    .select('gross_apt')
    .eq('wallet', wallet)
    .eq('chain', chain)
    .eq('status', 'auto')
    .gte('created_at', since);

  if (error || !data?.length) return 0;

  return data.reduce((sum, row) => {
    const native = Number(row.gross_apt);
    if (Number.isFinite(native) && native > 0) return sum + native;
    return sum;
  }, 0);
}

export type WithdrawalGuardResult =
  | { ok: true; forceManual: boolean; reason?: string }
  | { ok: false; error: string };

/**
 * Validates withdrawal eligibility before debiting house balance.
 * - Requires at least one verified deposit on this chain.
 * - Forces manual review above per-tx native caps (0.1 SOL / 1 APT) or daily auto caps (0.1 SOL / 10 APT).
 * - Also forces manual review above USD threshold or cumulative USD auto cap.
 */
export async function assertWithdrawalAllowed(input: {
  wallet: string;
  chain: ChainId;
  amountNative: number;
  usdEstimate: number;
}): Promise<WithdrawalGuardResult> {
  const netDeposited = await getWalletNetDepositedNative(input.wallet, input.chain);
  if (!(netDeposited > 0)) {
    return {
      ok: false,
      error:
        'Withdrawals require at least one verified deposit to this wallet. No deposit found on record.',
    };
  }

  const maxNative = getAutoWithdrawMaxNative(input.chain);
  const dailyMaxNative = getAutoWithdrawDailyMaxNative(input.chain);
  const autoNative24h = await getAutoWithdrawNativeInWindow(input.wallet, input.chain);

  if (input.amountNative > maxNative) {
    return { ok: true, forceManual: true, reason: 'per_tx_native_cap' };
  }

  if (autoNative24h + input.amountNative > dailyMaxNative) {
    return { ok: true, forceManual: true, reason: 'daily_native_cap' };
  }

  const perTxThreshold = getManualWithdrawUsdThreshold();
  const dailyAutoCap = getAutoWithdrawDailyUsdCap();
  const autoUsd24h = await getAutoWithdrawUsdInWindow(input.wallet, input.chain);

  if (input.usdEstimate > perTxThreshold) {
    return { ok: true, forceManual: true, reason: 'per_tx_threshold' };
  }

  if (autoUsd24h + input.usdEstimate > dailyAutoCap) {
    return {
      ok: true,
      forceManual: true,
      reason: 'daily_auto_cap',
    };
  }

  return { ok: true, forceManual: false };
}

export function manualWithdrawReasonMessage(
  chain: ChainId,
  reason?: string,
  thresholdUsd?: number,
): string {
  const maxNative = getAutoWithdrawMaxNative(chain);
  const dailyMaxNative = getAutoWithdrawDailyMaxNative(chain);
  const symbol = getAutoWithdrawNativeSymbol(chain);

  if (reason === 'per_tx_native_cap') {
    return `Withdrawals above ${maxNative} ${symbol} require manual approval.`;
  }
  if (reason === 'daily_native_cap') {
    return `Auto-withdrawals are capped at ${dailyMaxNative} ${symbol} per 24 hours. This request requires manual approval.`;
  }
  if (reason === 'daily_auto_cap') {
    const cap = process.env.AUTO_WITHDRAW_DAILY_USD_CAP?.trim() || '50';
    return `Auto-withdrawals are capped at $${cap} per 24 hours. This request requires manual approval.`;
  }
  const threshold = thresholdUsd ?? getManualWithdrawUsdThreshold();
  return `Withdrawal exceeds $${threshold} USD equivalent and requires manual approval.`;
}
