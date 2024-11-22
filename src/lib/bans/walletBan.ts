import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { normalizeWalletForBanKey } from '@/lib/admin/walletAddressVariants';

export { normalizeWalletForBanKey };

export function isBannedViaEnv(address: string): boolean {
  const raw = process.env.BANNED_WALLET_ADDRESSES || '';
  if (!raw.trim()) return false;
  const key = normalizeWalletForBanKey(address);
  return raw
    .split(',')
    .map((s) => normalizeWalletForBanKey(s.trim()))
    .filter(Boolean)
    .includes(key);
}

export async function isWalletGloballyBanned(address: string): Promise<boolean> {
  if (isBannedViaEnv(address)) return true;
  const db = getSupabaseAdmin();
  if (!db) return isBannedViaEnv(address);

  const key = normalizeWalletForBanKey(address);
  const { data, error } = await db
    .from('banned_wallets')
    .select('wallet_address')
    .eq('wallet_address', key)
    .maybeSingle();

  if (error) {
    console.warn('[walletBan] banned_wallets lookup failed:', error.message);
    return isBannedViaEnv(address);
  }
  return !!data;
}

export type AccountStatus = 'active' | 'frozen' | 'banned';

export async function getWalletAccountStatus(address: string): Promise<AccountStatus> {
  if (await isWalletGloballyBanned(address)) return 'banned';

  const db = getSupabaseAdmin();
  if (!db) return 'active';

  const variants = [address.trim(), normalizeWalletForBanKey(address)];
  const { data } = await db
    .from('wallet_account_status')
    .select('status')
    .in('wallet', [...new Set(variants)])
    .limit(1);

  const row = data?.[0];
  if (row?.status === 'frozen' || row?.status === 'banned') return row.status;
  return 'active';
}

export async function assertWalletCanPlay(address: string): Promise<string | null> {
  const status = await getWalletAccountStatus(address);
  if (status === 'banned') return 'This wallet is banned from the platform.';
  if (status === 'frozen') return 'This wallet account is frozen. Contact support.';
  return null;
}
