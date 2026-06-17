import type { ChainId } from '@/lib/chains/registry';
import { getManualWithdrawUsdThreshold } from '@/lib/server/platformFees';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { nativeAmountToUsd } from '@/lib/server/nativeUsdPrice';

export type PendingWithdrawalInsert = {
  chain: ChainId;
  wallet: string;
  grossOctas: number;
  grossNative: number;
  usdEstimate: number;
  feeOctas: number;
  userPayoutOctas: number;
};

export function requiresManualWithdrawalApproval(usdEstimate: number): boolean {
  const threshold = getManualWithdrawUsdThreshold();
  return usdEstimate > threshold;
}

export async function estimateWithdrawalUsd(
  chain: 'solana' | 'aptos',
  amountNative: number,
): Promise<number> {
  return nativeAmountToUsd(chain, amountNative);
}

export async function queueWithdrawalRequest(
  row: PendingWithdrawalInsert,
): Promise<{ requestId: string; thresholdUsd: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      'Withdrawals over the manual threshold require Supabase (SUPABASE_SERVICE_ROLE_KEY + withdrawal_requests table).',
    );
  }

  const thresholdUsd = getManualWithdrawUsdThreshold();

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .insert({
      chain: row.chain,
      wallet: row.wallet,
      gross_octas: row.grossOctas,
      gross_apt: row.grossNative,
      usd_estimate: row.usdEstimate,
      fee_octas: row.feeOctas,
      user_payout_octas: row.userPayoutOctas,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to queue withdrawal');
  }

  return { requestId: data.id, thresholdUsd };
}

export function pendingWithdrawalMessage(thresholdUsd: number, reason?: string): string {
  if (reason === 'daily_auto_cap') {
    const cap = process.env.AUTO_WITHDRAW_DAILY_USD_CAP?.trim() || '50';
    return `Auto-withdrawals are capped at $${cap} per 24 hours. This request requires manual approval.`;
  }
  return `Withdrawal exceeds $${thresholdUsd} USD equivalent and requires manual approval.`;
}
