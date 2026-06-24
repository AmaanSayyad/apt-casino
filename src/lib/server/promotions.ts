import { createHash } from 'crypto';
import type { ChainId } from '@/lib/chains/registry';
import { lamportsToSol, solToLamports } from '@/lib/server/houseBalance';
import { aptcPriceUsd } from '@/lib/server/referralAptc';
import { fetchSolUsdPrice } from '@/lib/server/otcLottery';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { getWalletNetDepositedNative } from '@/lib/server/withdrawalGuards';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export type PromotionType = 'coupon' | 'deposit_deal';

type PromotionRow = {
  id: string;
  promo_type: PromotionType;
  title: string;
  description: string | null;
  code: string | null;
  active: boolean;
  reward_sol: number | string | null;
  min_deposit_usd: number | string | null;
  bonus_usd_aptc: number | string | null;
  bonus_bps: number | null;
  max_claims: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for') || '';
  if (xff) return xff.split(',')[0]?.trim() || '';
  return headers.get('x-real-ip') || headers.get('cf-connecting-ip') || '';
}

export function hashPromotionSignal(raw: string): string {
  const secret = process.env.PROMO_HASH_SECRET?.trim() || process.env.DASHBOARD_ADMIN_TOKEN?.trim() || 'promo';
  return createHash('sha256').update(`${secret}:${raw}`).digest('hex');
}

function isPromotionLive(row: PromotionRow, now = Date.now()): boolean {
  if (!row.active) return false;
  const starts = row.starts_at ? new Date(row.starts_at).getTime() : 0;
  const ends = row.ends_at ? new Date(row.ends_at).getTime() : 0;
  if (starts && starts > now) return false;
  if (ends && ends < now) return false;
  return true;
}

export function toPublicPromotion(row: PromotionRow) {
  return {
    id: row.id,
    promoType: row.promo_type,
    title: row.title,
    description: row.description,
    code: row.code,
    active: row.active,
    rewardSol: Number(row.reward_sol ?? 0),
    minDepositUsd: Number(row.min_deposit_usd ?? 0),
    bonusUsdAptc: Number(row.bonus_usd_aptc ?? 0),
    bonusBps: Number(row.bonus_bps ?? 0),
    maxClaims: row.max_claims,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isLive: isPromotionLive(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPromotionsAdmin() {
  const db = getSupabaseAdmin();
  if (!db) return { promotions: [], couponClaims: [], dealHits: [] };
  const [{ data: promos }, { data: couponClaims }, { data: dealHits }] = await Promise.all([
    db.from('promo_campaigns').select('*').order('created_at', { ascending: false }),
    db.from('promo_coupon_claims').select('*').order('created_at', { ascending: false }).limit(200),
    db.from('promo_deposit_deal_hits').select('*').order('created_at', { ascending: false }).limit(200),
  ]);
  return {
    promotions: (promos || []).map((r) => toPublicPromotion(r as PromotionRow)),
    couponClaims: couponClaims || [],
    dealHits: dealHits || [],
  };
}

export async function createPromotion(input: {
  promoType: PromotionType;
  title: string;
  description?: string;
  code?: string;
  rewardSol?: number;
  minDepositUsd?: number;
  bonusUsdAptc?: number;
  bonusBps?: number;
  maxClaims?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
}) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');
  const code = input.code?.trim().toUpperCase() || null;
  const row = {
    promo_type: input.promoType,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    code,
    active: input.active ?? true,
    reward_sol: input.rewardSol ?? 0,
    min_deposit_usd: input.minDepositUsd ?? 0,
    bonus_usd_aptc: input.bonusUsdAptc ?? 0,
    bonus_bps: input.bonusBps ?? 0,
    max_claims: input.maxClaims ?? null,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
  };
  const { data, error } = await db.from('promo_campaigns').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return toPublicPromotion(data as PromotionRow);
}

export async function updatePromotion(id: string, patch: Partial<{
  title: string;
  description: string | null;
  active: boolean;
  rewardSol: number;
  minDepositUsd: number;
  bonusUsdAptc: number;
  bonusBps: number;
  maxClaims: number | null;
  startsAt: string | null;
  endsAt: string | null;
}>) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title != null) updates.title = patch.title.trim();
  if (patch.description != null) updates.description = patch.description;
  if (patch.active != null) updates.active = patch.active;
  if (patch.rewardSol != null) updates.reward_sol = patch.rewardSol;
  if (patch.minDepositUsd != null) updates.min_deposit_usd = patch.minDepositUsd;
  if (patch.bonusUsdAptc != null) updates.bonus_usd_aptc = patch.bonusUsdAptc;
  if (patch.bonusBps != null) updates.bonus_bps = patch.bonusBps;
  if (patch.maxClaims !== undefined) updates.max_claims = patch.maxClaims;
  if (patch.startsAt !== undefined) updates.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) updates.ends_at = patch.endsAt;
  const { data, error } = await db.from('promo_campaigns').update(updates).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return toPublicPromotion(data as PromotionRow);
}

export async function deletePromotion(id: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');
  const { error } = await db.from('promo_campaigns').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true as const };
}

export async function getPublicPromotionSnapshot() {
  const db = getSupabaseAdmin();
  if (!db) return { coupons: [], depositDeals: [] };
  const { data } = await db.from('promo_campaigns').select('*').eq('active', true).order('created_at', { ascending: false });
  const now = Date.now();
  const rows = (data || []).map((r) => r as PromotionRow).filter((r) => isPromotionLive(r, now));
  return {
    coupons: rows.filter((r) => r.promo_type === 'coupon').map(toPublicPromotion),
    depositDeals: rows.filter((r) => r.promo_type === 'deposit_deal').map(toPublicPromotion),
  };
}

export async function claimCouponPromotion(input: {
  wallet: string;
  chain: ChainId;
  code: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  userAgent?: string;
}) {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false as const, error: 'Database not configured' };
  if (input.chain !== 'solana') {
    return { ok: false as const, error: 'Coupon rewards are currently for Solana mainnet wallets only.' };
  }
  const wallet = normalizeWalletForChain(input.wallet, input.chain);
  if (!wallet) return { ok: false as const, error: 'Invalid wallet' };
  const code = String(input.code || '').trim().toUpperCase();
  if (!code) return { ok: false as const, error: 'Coupon code required' };

  const { data: promo, error: pErr } = await db
    .from('promo_campaigns')
    .select('*')
    .eq('promo_type', 'coupon')
    .eq('code', code)
    .maybeSingle();
  if (pErr) return { ok: false as const, error: pErr.message };
  if (!promo) return { ok: false as const, error: 'Invalid coupon code' };
  const row = promo as PromotionRow;
  if (!isPromotionLive(row)) return { ok: false as const, error: 'Coupon is not active' };
  const rewardSol = Number(row.reward_sol || 0);
  if (!(rewardSol > 0)) return { ok: false as const, error: 'Coupon reward is not configured' };

  const minDepositUsd = Number(row.min_deposit_usd ?? 0);
  if (minDepositUsd > 0) {
    const netNative = await getWalletNetDepositedNative(wallet, 'solana');
    const solUsd = await fetchSolUsdPrice();
    const depositedUsd = solUsd && netNative > 0 ? netNative * solUsd : 0;
    if (depositedUsd < minDepositUsd) {
      return {
        ok: false as const,
        error: `Minimum deposit of $${minDepositUsd.toFixed(2)} required before claiming this coupon.`,
      };
    }
  }

  const ipHash = input.ipAddress ? hashPromotionSignal(`ip:${input.ipAddress}`) : null;
  const deviceHash = input.deviceFingerprint ? hashPromotionSignal(`dev:${input.deviceFingerprint}`) : null;

  const rewardRaw = solToLamports(rewardSol);

  const { data: rpcBalance, error: rpcErr } = await db.rpc('claim_promo_coupon_atomic', {
    p_campaign_id: row.id,
    p_code: code,
    p_wallet: wallet,
    p_chain: input.chain,
    p_reward_raw: rewardRaw.toString(),
    p_ip_hash: ipHash,
    p_device_hash: deviceHash,
    p_user_agent: input.userAgent || null,
    p_max_claims: row.max_claims && row.max_claims > 0 ? row.max_claims : null,
  });

  if (rpcErr) {
    const msg = rpcErr.message || 'Claim failed';
    if (/already_claimed|unique/i.test(msg)) {
      return { ok: false as const, error: 'This wallet, device, or network already claimed this coupon.' };
    }
    if (/coupon_limit_reached/i.test(msg)) {
      return { ok: false as const, error: 'Coupon claim limit reached.' };
    }
    if (/claim_promo_coupon_atomic|function.*does not exist/i.test(msg)) {
      return { ok: false as const, error: 'Coupon claims are temporarily unavailable. Please try again shortly.' };
    }
    return { ok: false as const, error: msg };
  }

  const nextBalance = BigInt(rpcBalance ?? 0);

  return {
    ok: true as const,
    rewardSol,
    newBalanceSol: lamportsToSol(nextBalance),
    title: row.title,
  };
}

export async function getDepositDealBoost(input: {
  wallet: string;
  chain: ChainId;
  depositTxHash: string;
  depositUsd: number;
}) {
  const db = getSupabaseAdmin();
  if (!db || !(input.depositUsd > 0)) return { extraAptc: 0, deal: null as null | ReturnType<typeof toPublicPromotion> };
  const snap = await getPublicPromotionSnapshot();
  const eligible = snap.depositDeals
    .filter((d) => input.depositUsd >= (d.minDepositUsd || 0))
    .sort((a, b) => (b.bonusUsdAptc + (b.bonusBps / 10_000) * input.depositUsd) - (a.bonusUsdAptc + (a.bonusBps / 10_000) * input.depositUsd));
  const deal = eligible[0];
  if (!deal) return { extraAptc: 0, deal: null };

  const { data: existing } = await db
    .from('promo_deposit_deal_hits')
    .select('id')
    .eq('deposit_tx_hash', input.depositTxHash)
    .maybeSingle();
  if (existing) return { extraAptc: 0, deal: null };

  const aptcUsd = await aptcPriceUsd();
  if (!aptcUsd || aptcUsd <= 0) return { extraAptc: 0, deal: null };
  const usdBonus = Number(deal.bonusUsdAptc || 0) + (input.depositUsd * Number(deal.bonusBps || 0)) / 10_000;
  const extraAptc = usdBonus > 0 ? usdBonus / aptcUsd : 0;
  if (!(extraAptc > 0)) return { extraAptc: 0, deal: null };

  const wallet = normalizeWalletForChain(input.wallet, input.chain) || input.wallet;
  const { error } = await db.from('promo_deposit_deal_hits').insert({
    campaign_id: deal.id,
    wallet,
    chain: input.chain,
    deposit_tx_hash: input.depositTxHash,
    deposit_usd: input.depositUsd,
    bonus_aptc: extraAptc,
  });
  if (error) return { extraAptc: 0, deal: null };

  return { extraAptc, deal };
}

export async function getWalletPromotionSummary(wallet: string, chain: ChainId) {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const normalized = normalizeWalletForChain(wallet, chain);
  if (!normalized) return null;
  const [publicSnap, couponRes, dealRes] = await Promise.all([
    getPublicPromotionSnapshot(),
    db.from('promo_coupon_claims').select('campaign_id, code, reward_native, created_at').eq('wallet', normalized).order('created_at', { ascending: false }).limit(20),
    db.from('promo_deposit_deal_hits').select('campaign_id, deposit_usd, bonus_aptc, created_at').eq('wallet', normalized).order('created_at', { ascending: false }).limit(20),
  ]);
  return {
    ...publicSnap,
    couponClaims: couponRes.data || [],
    depositDealHits: dealRes.data || [],
  };
}
