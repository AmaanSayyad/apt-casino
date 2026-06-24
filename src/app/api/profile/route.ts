import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { getPlayChainConfig, type ChainId } from '@/lib/chains/registry';
import { getAptosForServer, octasToApt } from '@/lib/server/aptTreasury';
import {
  fetchDepositsForWallet,
  fetchWithdrawalsForWallet,
  mapDepositRow,
  mapWithdrawalRow,
} from '@/lib/server/profileLedger';
import { getCashbackStatus } from '@/lib/server/cashback';
import { getDepositAptcBonusStatus } from '@/lib/server/depositAptcBonus';
import { getDailyStreakStatus } from '@/lib/server/dailyStreak';
import { getFeeTiersPublicPayload } from '@/lib/server/feeTiers';
import { resolveReferralChain } from '@/lib/server/referrals';
import { getWalletPromotionSummary } from '@/lib/server/promotions';
import {
  buildDemoProfilePayload,
  isDemoPlayWallet,
} from '@/lib/play/demoPlay';
import { resolvePlayerAvatarUrl, xAvatarUrlFromHandle, isXDerivedAvatarUrl, resolveLinkedTwitterHandle } from '@/lib/xProfile';

export const dynamic = 'force-dynamic';

/**
 * Aggregated profile payload for `/profile`. One round-trip → everything the UI needs:
 *   - profile metadata (handle, avatar, bio, twitter) from user_profiles
 *   - on-chain native balance (live from chain RPC)
 *   - deposits + withdrawals summary + history (Supabase)
 *   - staking summary (Supabase)
 *   - referral summary (Supabase)
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  const walletInput = req.nextUrl.searchParams.get('wallet');
  const chainId: ChainId = resolveReferralChain(walletInput, req.nextUrl.searchParams.get('chain'));
  const wallet = normalizeWalletForChain(walletInput, chainId);
  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  if (isDemoPlayWallet(wallet)) {
    return NextResponse.json(buildDemoProfilePayload(chainId));
  }

  const [
    profileRes,
    depositsFetch,
    withdrawalsFetch,
    stakingRes,
    referralsRes,
    refCodeRes,
    refRewardsRes,
    onChainBalanceNative,
    cashbackStatus,
    depositAptcBonus,
    dailyStreakStatus,
    promotionsSummary,
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('handle, avatar_url, bio, twitter_handle, created_at, updated_at')
      .eq('wallet', wallet)
      .maybeSingle(),
    fetchDepositsForWallet(supabase, wallet, chainId),
    fetchWithdrawalsForWallet(supabase, wallet, chainId),
    supabase
      .from('staking_positions')
      .select('id, pool_key, lock_days, apy_bps, amount, start_at, unlock_at, status, reward_amount, total_payout')
      .eq('user_address', wallet)
      .order('created_at', { ascending: false }),
    supabase
      .from('referrals')
      .select('is_valid, referrer_reward_octas')
      .eq('referrer_wallet', wallet),
    supabase
      .from('referral_codes')
      .select('code')
      .eq('wallet', wallet)
      .maybeSingle(),
    supabase
      .from('referral_rewards_log')
      .select('reward_octas, status')
      .eq('referrer_wallet', wallet),
    fetchOnChainNativeBalance(chainId, wallet),
    chainId === 'solana' ? getCashbackStatus(wallet, chainId) : Promise.resolve(null),
    getDepositAptcBonusStatus(wallet, chainId),
    getDailyStreakStatus(wallet, chainId),
    getWalletPromotionSummary(wallet, chainId),
  ]);

  if (depositsFetch.error) {
    console.warn('[profile] deposits_log:', depositsFetch.error.message);
  }
  if (withdrawalsFetch.error) {
    console.warn('[profile] withdrawal_requests:', withdrawalsFetch.error.message);
  }

  const chainCfg = getPlayChainConfig(chainId);
  const deposits = depositsFetch.data ?? [];
  const depositRows = deposits.map((d) => mapDepositRow(d, chainId));
  const totalDepositedNative = depositRows.reduce((s, d) => s + d.amountApt, 0);
  const totalFeesNative = depositRows.reduce((s, d) => s + d.feeApt, 0);
  const totalNetCreditedNative = depositRows.reduce((s, d) => s + d.netCreditedApt, 0);

  const withdrawals = withdrawalsFetch.data ?? [];
  const isSent = (s: string) => s === 'sent' || s === 'auto' || s === 'completed';
  const isPending = (s: string) =>
    s === 'pending' || s === 'manual_pending' || s === 'queued' || s === 'approved';
  const sentWithdrawals = withdrawals.filter((w) => isSent(String(w.status)));
  const pendingWithdrawals = withdrawals.filter((w) => isPending(String(w.status)));
  const withdrawalRows = withdrawals.map((w) => mapWithdrawalRow(w, chainId));
  const totalWithdrawnNative = sentWithdrawals.reduce(
    (s, w) => s + mapWithdrawalRow(w, chainId).netApt,
    0,
  );
  const pendingWithdrawNative = pendingWithdrawals.reduce(
    (s, w) => s + Number(w.gross_apt ?? 0),
    0,
  );

  const stakingPositions = stakingRes.data ?? [];
  const activeStakes = stakingPositions.filter((p) => p.status === 'active');
  const claimableStakes = activeStakes.filter((p) => new Date(p.unlock_at).getTime() <= Date.now());
  const totalStakedAptc = activeStakes.reduce((s, p) => s + Number(p.amount || 0), 0);

  const referrals = referralsRes.data ?? [];
  const validReferrals = referrals.filter((r) => r.is_valid).length;
  const pendingReferrals = referrals.length - validReferrals;
  const refRewards = refRewardsRes.data ?? [];
  const earnedReferralOctas = refRewards
    .filter((r) => r.status === 'paid')
    .reduce((s, r) => s + Number(r.reward_octas || 0), 0);

  const rawProfile = profileRes.data ?? null;
  const linkedTwitter = rawProfile
    ? resolveLinkedTwitterHandle({
        twitterHandle: rawProfile.twitter_handle,
        avatarUrl: rawProfile.avatar_url,
      })
    : null;

  if (rawProfile && linkedTwitter && !rawProfile.twitter_handle) {
    const nowIso = new Date().toISOString();
    void supabase
      .from('user_profiles')
      .update({ twitter_handle: linkedTwitter, updated_at: nowIso })
      .eq('wallet', wallet);
    rawProfile.twitter_handle = linkedTwitter;
  }

  return NextResponse.json({
    wallet,
    chain: chainId,
    nativeSymbol: chainCfg?.nativeSymbol ?? (chainId === 'solana' ? 'SOL' : 'APT'),
    profile: rawProfile,
    resolvedAvatarUrl: resolvePlayerAvatarUrl({
      avatarUrl: rawProfile?.avatar_url,
      twitterHandle: linkedTwitter ?? rawProfile?.twitter_handle,
    }),
    onChainBalanceApt: onChainBalanceNative,
    onChainBalanceNative,
    deposits: {
      count: deposits.length,
      totalApt: totalDepositedNative,
      totalFeesApt: totalFeesNative,
      totalNetCreditedApt: totalNetCreditedNative,
      recent: depositRows.slice(0, 10),
    },
    withdrawals: {
      count: withdrawals.length,
      totalApt: totalWithdrawnNative,
      pendingCount: pendingWithdrawals.length,
      pendingApt: pendingWithdrawNative,
      recent: withdrawalRows.slice(0, 10),
    },
    staking: {
      activeCount: activeStakes.length,
      claimableCount: claimableStakes.length,
      totalActiveAptc: totalStakedAptc,
      positions: stakingPositions.map((p) => ({
        id: p.id,
        poolKey: p.pool_key,
        lockDays: p.lock_days,
        apyBps: p.apy_bps,
        amount: Number(p.amount),
        startAt: p.start_at,
        unlockAt: p.unlock_at,
        status: p.status,
        rewardAmount: p.reward_amount != null ? Number(p.reward_amount) : null,
        totalPayout: p.total_payout != null ? Number(p.total_payout) : null,
      })),
    },
    referrals: {
      code: refCodeRes.data?.code ?? null,
      validReferrals,
      pendingReferrals,
      totalReferrals: referrals.length,
      earnedApt: octasToApt(earnedReferralOctas),
    },
    cashback: cashbackStatus
      ? {
          depositsNetNative: cashbackStatus.depositsNetNative,
          capNative: cashbackStatus.capNative,
          unlockedNative: cashbackStatus.unlockedNative,
          claimedNative: cashbackStatus.claimedNative,
          claimableNative: cashbackStatus.claimableNative,
          progressPct: cashbackStatus.progressPct,
          totalBetsCount: cashbackStatus.totalBetsCount,
          canClaim: cashbackStatus.canClaim,
          isBusted: cashbackStatus.isBusted,
          houseBalanceNative: cashbackStatus.houseBalanceNative,
        }
      : null,
    depositAptcBonus: depositAptcBonus
      ? {
          bonusBps: depositAptcBonus.bonusBps,
          bonusPct: depositAptcBonus.bonusBps / 100,
          lockDays: depositAptcBonus.lockDays,
          aptcPriceUsd: depositAptcBonus.aptcPriceUsd,
          accrualEnabled: depositAptcBonus.accrualEnabled,
          lockedAptc: depositAptcBonus.lockedAptc,
          claimableAptc: depositAptcBonus.claimableAptc,
          claimedAptc: depositAptcBonus.claimedAptc,
          nextUnlockAt: depositAptcBonus.nextUnlockAt,
          recent: depositAptcBonus.recent,
        }
      : null,
    dailyStreak: dailyStreakStatus,
    promotions: promotionsSummary,
    feeTiers: getFeeTiersPublicPayload(),
  });
}

// ----------------------------------------------------------------------------------

const HANDLE_RE = /^[a-zA-Z0-9_]{2,24}$/;
const URL_RE = /^https?:\/\/[^\s]{4,512}$/i;
const TWITTER_RE = /^@?[A-Za-z0-9_]{1,15}$/;

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  let body: {
    wallet?: string;
    chain?: string;
    handle?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    twitterHandle?: string | null;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const chainParam = (body.chain || 'aptos').toLowerCase();
  const chainId: ChainId = chainParam === 'solana' ? 'solana' : 'aptos';
  const wallet = normalizeWalletForChain(body.wallet, chainId);
  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  if (isDemoPlayWallet(wallet)) {
    return NextResponse.json(
      { error: 'Profile edits are disabled in demo mode. Connect a wallet to save a profile.' },
      { status: 403 },
    );
  }

  const patch: Record<string, string | null> = {};
  if ('handle' in body) {
    if (body.handle === null || body.handle === '') {
      patch.handle = null;
    } else if (typeof body.handle === 'string' && HANDLE_RE.test(body.handle.trim())) {
      patch.handle = body.handle.trim();
    } else {
      return NextResponse.json(
        { error: 'handle must be 2–24 chars, letters/numbers/underscores only' },
        { status: 400 },
      );
    }
  }
  if ('avatarUrl' in body) {
    if (body.avatarUrl === null || body.avatarUrl === '') {
      patch.avatar_url = null;
    } else if (typeof body.avatarUrl === 'string' && URL_RE.test(body.avatarUrl.trim())) {
      patch.avatar_url = body.avatarUrl.trim();
    } else {
      return NextResponse.json(
        { error: 'avatarUrl must be a valid http(s) URL up to 512 chars' },
        { status: 400 },
      );
    }
  }
  if ('bio' in body) {
    if (body.bio === null || body.bio === '') {
      patch.bio = null;
    } else if (typeof body.bio === 'string' && body.bio.length <= 280) {
      patch.bio = body.bio;
    } else {
      return NextResponse.json({ error: 'bio must be ≤ 280 chars' }, { status: 400 });
    }
  }
  if ('twitterHandle' in body) {
    if (body.twitterHandle === null || body.twitterHandle === '') {
      patch.twitter_handle = null;
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('wallet', wallet)
        .maybeSingle();
      if (isXDerivedAvatarUrl(existing?.avatar_url)) {
        patch.avatar_url = null;
      }
    } else if (typeof body.twitterHandle === 'string' && TWITTER_RE.test(body.twitterHandle.trim())) {
      patch.twitter_handle = body.twitterHandle.trim().replace(/^@/, '');
    } else {
      return NextResponse.json(
        { error: 'twitterHandle must be a valid X / Twitter handle' },
        { status: 400 },
      );
    }
  }

  // When X is linked, default avatar to the live X profile photo unless a custom URL was sent.
  if (patch.twitter_handle && !('avatar_url' in patch)) {
    const explicitAvatar =
      'avatarUrl' in body ? (body.avatarUrl === null || body.avatarUrl === '' ? null : body.avatarUrl) : undefined;
    if (explicitAvatar === undefined) {
      patch.avatar_url = xAvatarUrlFromHandle(patch.twitter_handle);
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ wallet, ...patch, updated_at: nowIso }, { onConflict: 'wallet' })
    .select('handle, avatar_url, bio, twitter_handle, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Failed to save profile', detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    profile: data,
    resolvedAvatarUrl: resolvePlayerAvatarUrl({
      avatarUrl: data?.avatar_url,
      twitterHandle: data?.twitter_handle,
    }),
  });
}

async function fetchOnChainNativeBalance(chainId: ChainId, wallet: string): Promise<number | null> {
  if (chainId === 'solana') {
    try {
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      const { getSolanaRpcEndpoint } = await import('@/lib/solana/config');
      const connection = new Connection(getSolanaRpcEndpoint(), 'confirmed');
      const lamports = await connection.getBalance(new PublicKey(wallet));
      return lamports / LAMPORTS_PER_SOL;
    } catch {
      return null;
    }
  }

  try {
    const aptos = getAptosForServer();
    const balance = await aptos.getAccountAPTAmount({ accountAddress: wallet });
    return octasToApt(Number(balance));
  } catch {
    return null;
  }
}
