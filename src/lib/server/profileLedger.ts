import type { SupabaseClient } from '@supabase/supabase-js';
import { getPlayChainConfig, type ChainId } from '@/lib/chains/registry';
import { normalizeWalletForChain } from '@/lib/server/referrals';

/** Solana rows may use legacy lowercase wallet keys — try both. */
export function walletLookupKeys(wallet: string, chainId: ChainId): string[] {
  const primary = normalizeWalletForChain(wallet, chainId);
  if (!primary) return [];
  const keys = new Set<string>([primary]);
  if (chainId === 'solana') {
    const lower = primary.toLowerCase();
    if (lower !== primary) keys.add(lower);
  }
  return [...keys];
}

function chainFilter(chainId: ChainId): string {
  return chainId === 'solana' ? 'chain.eq.solana' : 'chain.eq.aptos,chain.is.null';
}

export async function fetchDepositsForWallet(
  supabase: SupabaseClient,
  wallet: string,
  chainId: ChainId,
) {
  const keys = walletLookupKeys(wallet, chainId);
  if (!keys.length) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('deposits_log')
    .select('amount_octas, fee_octas, net_credited_octas, amount_native, user_tx_hash, created_at')
    .in('wallet', keys)
    .or(chainFilter(chainId))
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

export async function fetchWithdrawalsForWallet(
  supabase: SupabaseClient,
  wallet: string,
  chainId: ChainId,
) {
  const keys = walletLookupKeys(wallet, chainId);
  if (!keys.length) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select(
      'id, gross_apt, gross_octas, fee_octas, user_payout_octas, status, user_tx_hash, created_at, usd_estimate, processed_at, chain',
    )
    .in('wallet', keys)
    .or(chainFilter(chainId))
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

export function mapDepositRow(d: Record<string, unknown>, chainId: ChainId) {
  const units = getPlayChainConfig(chainId)?.units ?? (chainId === 'solana' ? 1e9 : 1e8);
  const amountNative =
    chainId === 'solana'
      ? Number(d.amount_native ?? 0)
      : Number(d.amount_native ?? Number(d.amount_octas ?? 0) / units);
  const feeNative = Number(d.fee_octas ?? 0) / units;
  const netFromRaw = Number(d.net_credited_octas ?? 0) / units;
  const netNative =
    netFromRaw > 0
      ? netFromRaw
      : chainId === 'solana'
        ? Math.max(0, amountNative - feeNative)
        : Math.max(0, amountNative - feeNative);

  return {
    amountApt: amountNative,
    feeApt: feeNative,
    netCreditedApt: netNative,
    txHash: d.user_tx_hash as string | null,
    createdAt: d.created_at as string,
  };
}

export function mapWithdrawalRow(w: Record<string, unknown>, chainId: ChainId) {
  const units = getPlayChainConfig(chainId)?.units ?? (chainId === 'solana' ? 1e9 : 1e8);
  const grossNative = Number(w.gross_apt ?? 0);
  const feeNative = w.fee_octas ? Number(w.fee_octas) / units : 0;
  const netNative = w.user_payout_octas
    ? Number(w.user_payout_octas) / units
    : grossNative;

  return {
    id: w.id,
    grossApt: grossNative,
    netApt: netNative,
    feeApt: feeNative,
    status: w.status,
    payoutTxHash: (w.user_tx_hash as string | null) ?? null,
    usdEstimate: w.usd_estimate != null ? Number(w.usd_estimate) : null,
    createdAt: w.created_at as string,
    processedAt: (w.processed_at as string | null) ?? null,
  };
}
