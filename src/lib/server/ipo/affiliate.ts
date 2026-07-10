import type { SupabaseClient } from '@supabase/supabase-js';
import { IPO_SALE } from '@/lib/config/ipo';
import { getIpoServerConfig } from './config';

const SOLANA_ADDR_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidSolanaWallet(addr: string): boolean {
  return SOLANA_ADDR_RE.test(addr?.trim() || '');
}

/** Record first-touch IPO referrer (?ref=wallet). Immutable once set. */
export async function attributeIpoReferrer(
  db: SupabaseClient,
  wallet: string,
  referrerWallet: string,
): Promise<void> {
  const w = wallet.trim();
  const r = referrerWallet.trim();
  if (!isValidSolanaWallet(w) || !isValidSolanaWallet(r) || w === r) return;

  const { data: existing } = await db
    .from('ipo_referral_attribution')
    .select('wallet')
    .eq('wallet', w)
    .maybeSingle();
  if (existing) return;

  await db.from('ipo_referral_attribution').insert({ wallet: w, referrer_wallet: r });
}

/** Walk upline for 3-level affiliate rewards */
export async function resolveReferrerChain(
  db: SupabaseClient,
  buyerWallet: string,
): Promise<string[]> {
  const chain: string[] = [];
  let current = buyerWallet.trim();
  for (let i = 0; i < 3; i++) {
    const { data } = await db
      .from('ipo_referral_attribution')
      .select('referrer_wallet')
      .eq('wallet', current)
      .maybeSingle();
    const ref = data?.referrer_wallet?.trim();
    if (!ref || !isValidSolanaWallet(ref) || chain.includes(ref)) break;
    chain.push(ref);
    current = ref;
  }
  return chain;
}

export async function accrueAffiliateRewards(
  db: SupabaseClient,
  purchaseId: number,
  aptcAmount: number,
  buyerWallet: string,
): Promise<void> {
  const cfg = getIpoServerConfig();
  const upline = await resolveReferrerChain(db, buyerWallet);
  const withdrawableAt = new Date(
    Date.now() + cfg.affiliateWithdrawMinDays * 86_400_000,
  ).toISOString();

  for (let i = 0; i < upline.length && i < cfg.affiliateLevels.length; i++) {
    const levelCfg = cfg.affiliateLevels[i];
    const rewardAptc = aptcAmount * (levelCfg.bps / 10_000);
    if (rewardAptc <= 0) continue;
    await db.from('ipo_affiliate_rewards').insert({
      beneficiary_wallet: upline[i],
      purchase_id: purchaseId,
      level: levelCfg.level,
      aptc_amount: rewardAptc,
      status: 'accrued',
      withdrawable_at: withdrawableAt,
    });
  }
}

export function getAffiliateTotalBps(): number {
  return IPO_SALE.affiliateLevels.reduce((s, l) => s + l.bps, 0);
}
