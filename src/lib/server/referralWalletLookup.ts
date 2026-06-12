import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeWalletForChain } from '@/lib/server/referrals';

/** Solana referrer keys (exact + legacy lowercase) for OR filters. */
export function referrerWalletKeys(wallet: string, chain: string): string[] {
  if (chain !== 'solana') return [wallet];
  const legacy = wallet.toLowerCase();
  return legacy === wallet ? [wallet] : [wallet, legacy];
}

/** Load referral_codes row — Solana tries exact case then legacy lowercase key. */
export async function findReferralCodeRow(
  supabase: SupabaseClient,
  walletInput: string | null | undefined,
  chain: string,
) {
  const wallet = normalizeWalletForChain(walletInput, chain);
  if (!wallet) return { wallet: null as string | null, row: null };

  const { data } = await supabase
    .from('referral_codes')
    .select('code, wallet, created_at, updated_at')
    .eq('wallet', wallet)
    .maybeSingle();

  if (data) return { wallet: data.wallet, row: data };

  if (chain === 'solana') {
    const legacy = wallet.toLowerCase();
    if (legacy !== wallet) {
      const { data: legacyRow } = await supabase
        .from('referral_codes')
        .select('code, wallet, created_at, updated_at')
        .eq('wallet', legacy)
        .maybeSingle();
      if (legacyRow) return { wallet: legacyRow.wallet, row: legacyRow };
    }
  }

  return { wallet, row: null };
}

/** Query referrals where this wallet is the referrer (handles Solana legacy keys). */
export function referralsByReferrerQuery(
  supabase: SupabaseClient,
  wallet: string,
  chain: string,
  select: string,
) {
  const keys = referrerWalletKeys(wallet, chain);
  if (keys.length === 1) {
    return supabase.from('referrals').select(select).eq('referrer_wallet', keys[0]);
  }
  return supabase
    .from('referrals')
    .select(select)
    .or(keys.map((k) => `referrer_wallet.eq.${k}`).join(','));
}
