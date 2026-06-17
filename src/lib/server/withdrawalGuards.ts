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

export type WithdrawalGuardResult =
  | { ok: true; forceManual: boolean; reason?: string }
  | { ok: false; error: string };

/**
 * Validates withdrawal eligibility before debiting house balance.
 * - Requires at least one verified deposit on this chain.
 * - Forces manual review above per-tx USD threshold OR cumulative auto cap ($50/24h default).
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
