import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeWalletForBanKey,
  walletAddressSearchVariants,
} from '@/lib/admin/walletAddressVariants';

export type PurgeWalletResult = {
  wallet: string;
  variants: string[];
  deleted: Record<string, number>;
};

function walletVariants(walletAddress: string): string[] {
  const trimmed = walletAddress.trim();
  const key = normalizeWalletForBanKey(trimmed);
  return [...new Set([...walletAddressSearchVariants(trimmed), trimmed, key])];
}

async function deleteByColumn(
  db: SupabaseClient,
  table: string,
  column: string,
  variants: string[],
): Promise<number> {
  if (variants.length === 0) return 0;
  const { count, error } = await db.from(table).delete({ count: 'exact' }).in(column, variants);
  if (error) {
    console.warn(`[purgeWallet] ${table}.${column}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

/** Remove all platform records for a wallet (house ledger, play history, referrals, etc.). */
export async function purgeWalletPlatformData(
  db: SupabaseClient,
  walletAddress: string,
): Promise<PurgeWalletResult> {
  const key = normalizeWalletForBanKey(walletAddress);
  const variants = walletVariants(walletAddress);
  const deleted: Record<string, number> = {};

  const singleColumnTables: { table: string; column: string }[] = [
    { table: 'play_pending_stakes', column: 'wallet' },
    { table: 'game_sessions', column: 'wallet' },
    { table: 'game_play_events', column: 'wallet' },
    { table: 'user_house_balances', column: 'user_address' },
    { table: 'deposits_log', column: 'wallet' },
    { table: 'withdrawal_requests', column: 'wallet' },
    { table: 'tracked_wallets', column: 'wallet' },
    { table: 'wallet_daily_streaks', column: 'wallet' },
    { table: 'daily_streak_claims', column: 'wallet' },
    { table: 'wallet_cashback', column: 'wallet' },
    { table: 'cashback_accrual_log', column: 'wallet' },
    { table: 'promo_coupon_claims', column: 'wallet' },
    { table: 'promo_deposit_deal_hits', column: 'wallet' },
    { table: 'deposit_aptc_rewards', column: 'wallet' },
    { table: 'tournament_registrations', column: 'wallet' },
    { table: 'streams', column: 'wallet' },
    { table: 'user_profiles', column: 'wallet' },
    { table: 'user_sessions', column: 'wallet_address' },
    { table: 'chat_messages', column: 'wallet_address' },
    { table: 'referral_codes', column: 'wallet' },
    { table: 'staking_positions', column: 'user_address' },
    { table: 'kol_allocations', column: 'wallet_address' },
  ];

  for (const { table, column } of singleColumnTables) {
    deleted[table] = await deleteByColumn(db, table, column, variants);
  }

  for (const column of ['referrer_wallet', 'referee_wallet'] as const) {
    deleted[`referrals:${column}`] = await deleteByColumn(db, 'referrals', column, variants);
  }

  for (const column of ['referrer_wallet', 'referee_wallet'] as const) {
    deleted[`referral_rewards_log:${column}`] = await deleteByColumn(
      db,
      'referral_rewards_log',
      column,
      variants,
    );
  }

  for (const column of ['sol_sender_wallet', 'aptc_receive_wallet'] as const) {
    deleted[`otc_lottery_entries:${column}`] = await deleteByColumn(
      db,
      'otc_lottery_entries',
      column,
      variants,
    );
  }

  return { wallet: key, variants, deleted };
}
