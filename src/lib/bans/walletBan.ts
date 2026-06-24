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

/** All globally banned wallet keys (env + DB). Used to filter public leaderboards. */
export function bannedKeysFromEnv(): Set<string> {
  const keys = new Set<string>();
  const raw = process.env.BANNED_WALLET_ADDRESSES || '';
  for (const part of raw.split(',')) {
    const key = normalizeWalletForBanKey(part.trim());
    if (key) keys.add(key);
  }
  return keys;
}

export async function loadBannedWalletKeys(): Promise<Set<string>> {
  const keys = bannedKeysFromEnv();
  const db = getSupabaseAdmin();
  if (!db) return keys;

  const [bansRes, statusRes] = await Promise.all([
    db.from('banned_wallets').select('wallet_address'),
    db.from('wallet_account_status').select('wallet').eq('status', 'banned'),
  ]);

  for (const row of bansRes.data ?? []) {
    const key = normalizeWalletForBanKey(String(row.wallet_address ?? ''));
    if (key) keys.add(key);
  }
  for (const row of statusRes.data ?? []) {
    const key = normalizeWalletForBanKey(String(row.wallet ?? ''));
    if (key) keys.add(key);
  }

  return keys;
}

export function walletMatchesBanSet(wallet: string, banned: Set<string>): boolean {
  if (!wallet?.trim() || banned.size === 0) return false;
  const trimmed = wallet.trim();
  if (banned.has(trimmed)) return true;
  const key = normalizeWalletForBanKey(trimmed);
  return banned.has(key);
}

export function filterBannedWalletRows<T>(
  rows: T[],
  banned: Set<string>,
  getWallet: (row: T) => string | null | undefined,
): T[] {
  if (banned.size === 0) return rows;
  return rows.filter((row) => !walletMatchesBanSet(String(getWallet(row) ?? ''), banned));
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
