import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { isValidSolanaWallet } from '@/lib/server/ipo/affiliate';
import { estimateStakingReward } from '@/lib/server/ipo/pricing';
import { getIpoServerConfig } from '@/lib/server/ipo/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')?.trim() || '';
  if (!wallet) {
    return NextResponse.json({ error: 'wallet query param is required' }, { status: 400 });
  }
  if (!isValidSolanaWallet(wallet)) {
    return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const cfg = getIpoServerConfig();

  const { data: purchases, error: pErr } = await db
    .from('ipo_purchases')
    .select('*')
    .eq('buyer_wallet', wallet)
    .order('created_at', { ascending: false });

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const fulfilled = (purchases || []).filter((p) => p.status === 'fulfilled');
  const pending = (purchases || []).filter(
    (p) => p.status === 'pending' || p.status === 'pending_supply',
  );

  const totalSol = fulfilled.reduce((s, p) => s + Number(p.sol_amount), 0);
  const totalAptc = fulfilled.reduce((s, p) => s + Number(p.aptc_amount), 0);
  const totalUsd = fulfilled.reduce((s, p) => s + Number(p.usd_value), 0);

  const positionIds = fulfilled
    .map((p) => p.staking_position_id)
    .filter((id): id is number => id != null);

  let positions: Array<Record<string, unknown>> = [];
  if (positionIds.length) {
    const { data: posRows } = await db
      .from('staking_positions')
      .select('*')
      .in('id', positionIds)
      .order('created_at', { ascending: false });
    positions = (posRows || []).map((pos) => {
      const amount = Number(pos.amount);
      const estReward =
        pos.reward_amount != null
          ? Number(pos.reward_amount)
          : estimateStakingReward(amount, Number(pos.apy_bps), Number(pos.lock_days));
      return {
        id: pos.id,
        amount,
        lockDays: pos.lock_days,
        apyPct: Number(pos.apy_bps) / 100,
        startAt: pos.start_at,
        unlockAt: pos.unlock_at,
        status: pos.status,
        estimatedRewardAptc: estReward,
        txHash: pos.tx_hash,
      };
    });
  }

  const { data: affiliateRewards } = await db
    .from('ipo_affiliate_rewards')
    .select('aptc_amount, status, withdrawable_at, level')
    .eq('beneficiary_wallet', wallet);

  const affiliateAccrued = (affiliateRewards || [])
    .filter((r) => r.status === 'accrued' || r.status === 'withdrawal_requested')
    .reduce((s, r) => s + Number(r.aptc_amount), 0);
  const affiliatePaid = (affiliateRewards || [])
    .filter((r) => r.status === 'paid')
    .reduce((s, r) => s + Number(r.aptc_amount), 0);

  const now = Date.now();
  const nextUnlock = positions
    .filter((p) => p.status === 'active' && p.unlockAt)
    .map((p) => Date.parse(String(p.unlockAt)))
    .filter((t) => t > now)
    .sort((a, b) => a - b)[0];

  return NextResponse.json({
    wallet,
    connected: true,
    summary: {
      totalSolDeposited: totalSol,
      totalAptcPurchased: totalAptc,
      totalUsdValue: totalUsd,
      purchaseCount: fulfilled.length,
      pendingPurchases: pending.length,
      nextUnlockAt: nextUnlock ? new Date(nextUnlock).toISOString() : null,
      stakingApyPct: cfg.stakingApyBps / 100,
      stakingLockDays: cfg.stakingLockDays,
    },
    purchases: (purchases || []).map((p) => ({
      id: p.id,
      solAmount: Number(p.sol_amount),
      aptcAmount: Number(p.aptc_amount),
      usdValue: Number(p.usd_value),
      status: p.status,
      solTxHash: p.sol_tx_hash,
      aptcTxHash: p.aptc_tx_hash,
      createdAt: p.created_at,
      fulfilledAt: p.fulfilled_at,
    })),
    stakingPositions: positions,
    affiliate: {
      accruedAptc: affiliateAccrued,
      paidAptc: affiliatePaid,
      withdrawMinDays: cfg.affiliateWithdrawMinDays,
    },
  });
}
