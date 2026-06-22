import type { ChainId } from '@/lib/chains/registry';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { inferChainFromWallet, normalizeWalletForChain } from '@/lib/server/referrals';
import { fetchDepositsForWallet, walletLookupKeys } from '@/lib/server/profileLedger';
import { aptcPriceUsd } from '@/lib/server/referralAptc';
import { APTC_SPL_MINT, transferTokenFromTreasury } from '@/lib/solana/backend-client';

const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function getDepositBonusBps(): number {
  const n = Number(process.env.DEPOSIT_APTC_BONUS_BPS ?? 500);
  return Number.isFinite(n) && n >= 0 && n <= 10_000 ? Math.floor(n) : 500;
}

export function getDepositBonusLockDays(): number {
  const n = Number(process.env.DEPOSIT_APTC_LOCK_DAYS ?? 14);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 14;
}

export function computeDepositBonusUnlockAt(fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  d.setUTCDate(d.getUTCDate() + getDepositBonusLockDays());
  return d.toISOString();
}

/** APTC tokens = (depositNative × nativeUsd × bonusBps/10000) / aptcUsd */
export async function computeDepositAptcBonus(
  depositNative: number,
  nativeUsdPrice: number,
): Promise<number> {
  if (!Number.isFinite(depositNative) || depositNative <= 0) return 0;
  if (!Number.isFinite(nativeUsdPrice) || nativeUsdPrice <= 0) return 0;
  const usdValue = depositNative * nativeUsdPrice * (getDepositBonusBps() / 10_000);
  const price = await aptcPriceUsd();
  if (!price || price <= 0) return 0;
  return Math.max(0, usdValue / price);
}

export async function fetchNativeUsdPrice(chain: ChainId): Promise<number> {
  const override =
    chain === 'solana'
      ? process.env.SOL_USD_PRICE_OVERRIDE
      : process.env.APT_USD_PRICE_OVERRIDE;
  if (override) {
    const n = Number(override);
    if (Number.isFinite(n) && n > 0) return n;
  }
  try {
    const id = chain === 'solana' ? 'solana' : 'aptos';
    const pr = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      { next: { revalidate: 120 } },
    );
    if (pr.ok) {
      const j = await pr.json();
      const v = Number(j?.[id]?.usd);
      if (Number.isFinite(v) && v > 0) return v;
    }
  } catch {
    /* ignore */
  }
  return chain === 'solana' ? 150 : 8;
}

export async function accrueDepositAptcBonus(params: {
  wallet: string;
  chain: ChainId;
  depositTxHash: string;
  depositNative: number;
  nativeUsdPrice?: number;
  extraAptc?: number;
}): Promise<{ rewardAptc: number; unlockAt: string } | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const wallet = normalizeWalletForChain(params.wallet, params.chain);
  if (!wallet || !params.depositTxHash) return null;

  const nativeUsd =
    params.nativeUsdPrice != null && params.nativeUsdPrice > 0
      ? params.nativeUsdPrice
      : await fetchNativeUsdPrice(params.chain);

  const baseRewardAptc = await computeDepositAptcBonus(params.depositNative, nativeUsd);
  const rewardAptc = baseRewardAptc + Math.max(0, Number(params.extraAptc || 0));
  if (rewardAptc <= 0) {
    console.warn(
      '[depositAptcBonus] skip accrue — reward is 0 (set APTC_USD_PRICE_OVERRIDE or DEPOSIT_APTC_USD_FALLBACK)',
    );
    return null;
  }

  const unlockAt = computeDepositBonusUnlockAt();
  const depositUsd = params.depositNative * nativeUsd;

  const { error } = await db.from('deposit_aptc_rewards').upsert(
    {
      wallet,
      chain: params.chain,
      deposit_tx_hash: params.depositTxHash,
      deposit_native: params.depositNative,
      deposit_usd: depositUsd,
      reward_aptc: rewardAptc,
      status: 'locked',
      unlock_at: unlockAt,
    },
    { onConflict: 'deposit_tx_hash', ignoreDuplicates: true },
  );

  if (error) {
    console.warn('[depositAptcBonus] accrue failed:', error.message);
    return null;
  }

  return { rewardAptc, unlockAt };
}

/** Backfill rows from deposits_log when accrual was skipped (e.g. missing APTC price). */
async function syncMissingDepositAptcBonuses(
  db: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  walletInput: string,
  chain: ChainId,
): Promise<void> {
  const { data: deposits, error } = await fetchDepositsForWallet(db, walletInput, chain);
  if (error || !deposits?.length) return;

  for (const d of deposits) {
    const tx = String(d.user_tx_hash || '').trim();
    if (!tx) continue;
    const depositNative =
      chain === 'solana'
        ? Number(d.amount_native ?? 0)
        : Number(
            d.amount_native ??
              Number(d.amount_octas ?? 0) /
                (chain === 'aptos' ? 100_000_000 : 1_000_000_000),
          );
    if (!Number.isFinite(depositNative) || depositNative <= 0) continue;

    await accrueDepositAptcBonus({
      wallet: walletInput,
      chain,
      depositTxHash: tx,
      depositNative,
    });
  }
}

export type DepositAptcBonusStatus = {
  bonusBps: number;
  lockDays: number;
  aptcPriceUsd: number | null;
  accrualEnabled: boolean;
  lockedAptc: number;
  claimableAptc: number;
  claimedAptc: number;
  nextUnlockAt: string | null;
  recent: Array<{
    id: string;
    depositNative: number;
    depositUsd: number;
    rewardAptc: number;
    status: string;
    unlockAt: string;
    claimedAt: string | null;
    createdAt: string;
    chain: string;
  }>;
};

export async function getDepositAptcBonusStatus(
  walletInput: string,
  chain: ChainId,
): Promise<DepositAptcBonusStatus | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const wallet = normalizeWalletForChain(walletInput, chain);
  if (!wallet) return null;

  const price = await aptcPriceUsd();
  const accrualEnabled = price != null && price > 0;

  if (accrualEnabled) {
    await syncMissingDepositAptcBonuses(db, walletInput, chain);
  }

  const walletKeys = walletLookupKeys(walletInput, chain);
  if (!walletKeys.length) return null;

  const { data: rows, error } = await db
    .from('deposit_aptc_rewards')
    .select(
      'id, chain, deposit_native, deposit_usd, reward_aptc, status, unlock_at, claimed_at, created_at',
    )
    .in('wallet', walletKeys)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('[depositAptcBonus] status query failed:', error.message);
    if (/deposit_aptc_rewards|does not exist/i.test(error.message)) {
      return {
        bonusBps: getDepositBonusBps(),
        lockDays: getDepositBonusLockDays(),
        aptcPriceUsd: price,
        accrualEnabled,
        lockedAptc: 0,
        claimableAptc: 0,
        claimedAptc: 0,
        nextUnlockAt: null,
        recent: [],
      };
    }
    return null;
  }

  const now = Date.now();
  let lockedAptc = 0;
  let claimableAptc = 0;
  let claimedAptc = 0;
  let nextUnlockAt: string | null = null;

  for (const r of rows ?? []) {
    const amt = Number(r.reward_aptc || 0);
    if (r.status === 'claimed') {
      claimedAptc += amt;
      continue;
    }
    const unlockMs = r.unlock_at ? new Date(r.unlock_at).getTime() : 0;
    if (unlockMs <= now) {
      claimableAptc += amt;
    } else {
      lockedAptc += amt;
      if (!nextUnlockAt || unlockMs < new Date(nextUnlockAt).getTime()) {
        nextUnlockAt = r.unlock_at;
      }
    }
  }

  return {
    bonusBps: getDepositBonusBps(),
    lockDays: getDepositBonusLockDays(),
    aptcPriceUsd: price,
    accrualEnabled,
    lockedAptc,
    claimableAptc,
    claimedAptc,
    nextUnlockAt,
    recent:
      rows?.slice(0, 8).map((r) => ({
        id: r.id,
        chain: r.chain,
        depositNative: Number(r.deposit_native),
        depositUsd: Number(r.deposit_usd),
        rewardAptc: Number(r.reward_aptc),
        status: r.status,
        unlockAt: r.unlock_at,
        claimedAt: r.claimed_at,
        createdAt: r.created_at,
      })) ?? [],
  };
}

function resolveAptcPayoutWallet(
  wallet: string,
  chain: ChainId,
  _solanaPayoutWallet?: string | null,
): string | null {
  if (chain === 'solana' && SOLANA_RE.test(wallet)) return wallet;
  if (inferChainFromWallet(wallet) === 'solana' && SOLANA_RE.test(wallet)) return wallet;
  return null;
}

export async function claimDepositAptcBonus(
  walletInput: string,
  chain: ChainId,
  solanaPayoutWallet?: string | null,
): Promise<
  | { ok: true; claimedAptc: number; claimTxHash: string | null; payoutWallet: string }
  | { ok: false; error: string }
> {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: 'Database not configured' };

  const wallet = normalizeWalletForChain(walletInput, chain);
  if (!wallet) return { ok: false, error: 'Invalid wallet' };

  const payoutWallet = resolveAptcPayoutWallet(wallet, chain, solanaPayoutWallet);
  if (!payoutWallet) {
    return {
      ok: false,
      error: 'Provide a Solana wallet address to receive APTC (SPL token).',
    };
  }

  const walletKeys = walletLookupKeys(walletInput, chain);
  if (!walletKeys.length) return { ok: false, error: 'Invalid wallet' };

  const nowIso = new Date().toISOString();
  const { data: claimableRows, error: qErr } = await db
    .from('deposit_aptc_rewards')
    .select('id, reward_aptc')
    .in('wallet', walletKeys)
    .eq('status', 'locked')
    .lte('unlock_at', nowIso);

  if (qErr) return { ok: false, error: qErr.message };
  if (!claimableRows?.length) {
    return { ok: false, error: 'No APTC deposit bonus ready to claim yet.' };
  }

  const totalAptc = claimableRows.reduce((s, r) => s + Number(r.reward_aptc || 0), 0);
  if (totalAptc <= 0) {
    return { ok: false, error: 'Nothing to claim.' };
  }

  let claimTxHash: string | null = null;

  if (APTC_SPL_MINT) {
    try {
      claimTxHash = await transferTokenFromTreasury(payoutWallet, totalAptc, APTC_SPL_MINT);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'APTC transfer failed';
      return { ok: false, error: msg };
    }
  } else {
    console.warn('[depositAptcBonus] APTC_SPL_MINT not set — marking claimed without on-chain tx');
  }

  const ids = claimableRows.map((r) => r.id);
  const { error: upErr } = await db
    .from('deposit_aptc_rewards')
    .update({
      status: 'claimed',
      claimed_at: nowIso,
      claim_tx_hash: claimTxHash,
    })
    .in('id', ids);

  if (upErr) return { ok: false, error: upErr.message };

  return { ok: true, claimedAptc: totalAptc, claimTxHash, payoutWallet };
}
