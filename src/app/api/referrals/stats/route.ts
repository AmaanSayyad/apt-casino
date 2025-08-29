import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  findReferralCodeRow,
  referralsByReferrerQuery,
} from '@/lib/server/referralWalletLookup';
import { refreshReferralUnlockStates } from '@/lib/server/referralAptc';
import { resolveReferralChain } from '@/lib/server/referrals';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  const walletInput = req.nextUrl.searchParams.get('wallet');
  const chain = resolveReferralChain(walletInput, req.nextUrl.searchParams.get('chain'));
  const { wallet } = await findReferralCodeRow(supabase, walletInput, chain);
  const walletKey = wallet || (chain === 'solana' ? String(walletInput || '').trim() : null);

  if (!walletKey) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  await refreshReferralUnlockStates(walletKey, chain);

  const referralSelect =
    'referee_wallet, attributed_at, source, is_valid, first_deposit_at, first_deposit_octas, referrer_reward_aptc, reward_status, unlock_at, referee_volume_usd';
  const summarySelect = 'is_valid, reward_status, referrer_reward_aptc';

  const [codeRes, rankRes, recentRes, allRes] = await Promise.all([
    supabase
      .from('referral_codes')
      .select('code, created_at')
      .eq('wallet', walletKey)
      .maybeSingle(),
    supabase
      .from('referral_leaderboard')
      .select('referrals, rank, earned_octas')
      .eq('wallet', walletKey)
      .maybeSingle(),
    referralsByReferrerQuery(supabase, walletKey, chain, referralSelect)
      .order('attributed_at', { ascending: false })
      .limit(50),
    referralsByReferrerQuery(supabase, walletKey, chain, summarySelect),
  ]);

  const rows = allRes.data ?? [];
  const total = rows.length;
  const valid = rows.filter((r) => r.is_valid).length;
  const pending = total - valid;

  let lockedAptc = 0;
  let unlockedAptc = 0;
  let paidAptc = 0;
  for (const r of rows) {
    if (!r.is_valid) continue;
    const amt = Number(r.referrer_reward_aptc || 0);
    if (r.reward_status === 'locked') lockedAptc += amt;
    else if (r.reward_status === 'unlocked') unlockedAptc += amt;
    else if (r.reward_status === 'paid') paidAptc += amt;
  }

  return NextResponse.json({
    wallet: walletKey,
    code: codeRes.data?.code ?? null,
    codeCreatedAt: codeRes.data?.created_at ?? null,
    totalReferrals: total,
    validReferrals: valid,
    pendingReferrals: pending,
    rank: rankRes.data?.rank ?? null,
    lockedAptc,
    unlockedAptc,
    paidAptc,
    earnedAptc: paidAptc,
    pendingAptc: lockedAptc,
    claimableAptc: unlockedAptc,
    recent:
      recentRes.data?.map((row) => ({
        refereeWallet: row.referee_wallet,
        attributedAt: row.attributed_at,
        source: row.source,
        isValid: !!row.is_valid,
        firstDepositAt: row.first_deposit_at,
        rewardAptc: Number(row.referrer_reward_aptc || 0),
        rewardStatus: row.reward_status,
        unlockAt: row.unlock_at,
        refereeVolumeUsd: Number(row.referee_volume_usd || 0),
      })) ?? [],
  });
}
