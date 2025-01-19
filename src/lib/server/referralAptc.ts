import { getReferrerFeeShareBpsOfDeposit } from '@/lib/server/platformFees';
import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { inferChainFromWallet, normalizeWallet, normalizeWalletForChain } from '@/lib/server/referrals';

export function getReferralCliffDays(): number {
  const n = Number(process.env.REFERRAL_APTC_CLIFF_DAYS ?? 14);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 14;
}

/** Referee must wager this much (USD equiv.) to unlock referrer APTC early. */
export function getRefereeVolumeUnlockUsd(): number {
  const n = Number(process.env.REFERRAL_REFEREE_VOLUME_UNLOCK_USD ?? 100);
  return Number.isFinite(n) && n > 0 ? n : 100;
}

export async function aptcPriceUsd(): Promise<number | null> {
  const override = process.env.APTC_USD_PRICE_OVERRIDE;
  if (override) {
    const n = Number(override);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const dex = await fetchAptcDexscreenerStats();
  if (dex.priceUsd != null && dex.priceUsd > 0) return dex.priceUsd;

  const fallback = Number(
    process.env.DEPOSIT_APTC_USD_FALLBACK ?? process.env.APTC_USD_FALLBACK ?? '',
  );
  if (Number.isFinite(fallback) && fallback > 0) return fallback;

  return null;
}

/**
 * Referrer reward in APTC = (deposit × referrer share bps) valued in USD / APTC price.
 */
export async function computeReferrerAptcReward(depositNative: number, nativeUsdPrice: number): Promise<number> {
  const shareBps = getReferrerFeeShareBpsOfDeposit();
  const usdValue = depositNative * nativeUsdPrice * (shareBps / 10_000);
  const price = await aptcPriceUsd();
  if (!price || price <= 0) return 0;
  return Math.max(0, usdValue / price);
}

export function computeUnlockAt(fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  d.setUTCDate(d.getUTCDate() + getReferralCliffDays());
  return d.toISOString();
}

export type ReferralRewardRow = {
  referee_wallet: string;
  referrer_wallet: string;
  reward_status: string;
  unlock_at: string | null;
  referrer_reward_aptc: number;
  referee_volume_usd: number;
  is_valid: boolean;
};

export function isRewardUnlocked(row: ReferralRewardRow, now = Date.now()): boolean {
  if (row.reward_status === 'unlocked' || row.reward_status === 'paid') return true;
  if (!row.is_valid || row.reward_status !== 'locked') return false;

  const cliffOk = row.unlock_at && new Date(row.unlock_at).getTime() <= now;
  const volumeOk = row.referee_volume_usd >= getRefereeVolumeUnlockUsd();
  return !!(cliffOk || volumeOk);
}

export async function refreshReferralUnlockStates(
  referrerWallet?: string,
  chain?: string,
): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) return;

  let q = db
    .from('referrals')
    .select(
      'referee_wallet, referrer_wallet, reward_status, unlock_at, referrer_reward_aptc, referee_volume_usd, is_valid',
    )
    .eq('reward_status', 'locked')
    .eq('is_valid', true);

  if (referrerWallet) {
    const c = chain || inferChainFromWallet(referrerWallet);
    const norm = normalizeWalletForChain(referrerWallet, c) || referrerWallet;
    if (c === 'solana') {
      const legacy = norm.toLowerCase();
      if (legacy !== norm) {
        q = q.or(`referrer_wallet.eq.${norm},referrer_wallet.eq.${legacy}`);
      } else {
        q = q.eq('referrer_wallet', norm);
      }
    } else {
      q = q.eq('referrer_wallet', norm);
    }
  }

  const { data } = await q;
  if (!data?.length) return;

  const threshold = getRefereeVolumeUnlockUsd();
  const now = Date.now();

  for (const row of data) {
    if (!isRewardUnlocked(row as ReferralRewardRow, now)) continue;
    await db
      .from('referrals')
      .update({ reward_status: 'unlocked' })
      .eq('referee_wallet', row.referee_wallet)
      .eq('reward_status', 'locked');
  }
}

export async function incrementRefereeVolumeUsd(refereeWallet: string, betNative: number, nativeUsd: number) {
  const db = getSupabaseAdmin();
  if (!db) return;
  const chain = inferChainFromWallet(refereeWallet);
  const wallet = normalizeWalletForChain(refereeWallet, chain);
  if (!wallet) return;

  const deltaUsd = Math.max(0, betNative * nativeUsd);
  if (deltaUsd <= 0) return;

  const { data: row } = await db
    .from('referrals')
    .select('referee_volume_usd, reward_status, is_valid')
    .eq('referee_wallet', wallet)
    .maybeSingle();

  if (!row?.is_valid) return;

  const next = Number(row.referee_volume_usd || 0) + deltaUsd;
  await db.from('referrals').update({ referee_volume_usd: next }).eq('referee_wallet', wallet);

  if (row.reward_status === 'locked' && next >= getRefereeVolumeUnlockUsd()) {
    await db.from('referrals').update({ reward_status: 'unlocked' }).eq('referee_wallet', wallet);
  }
}
