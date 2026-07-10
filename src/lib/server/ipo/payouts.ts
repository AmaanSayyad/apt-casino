import type { SupabaseClient } from '@supabase/supabase-js';

export type PayoutRecordOptions = {
  txHash: string;
  adminNote?: string;
};

function requireTxHash(txHash?: string): string {
  const h = txHash?.trim() || '';
  if (!h || h.length < 32) {
    throw new Error('Solana transaction signature is required — record the Payout tx hash.');
  }
  return h;
}

export type StakingRewardQueueItem = {
  id: number;
  userAddress: string;
  poolKey: string;
  amount: number;
  rewardAmount: number;
  unlockAt: string;
  createdAt: string;
  purchaseId: number | null;
  due: boolean;
};

export type AffiliateRewardQueueItem = {
  id: number;
  beneficiaryWallet: string;
  level: number;
  aptcAmount: number;
  status: string;
  withdrawableAt: string;
  purchaseId: number;
  createdAt: string;
  due: boolean;
};

export type AffiliateWithdrawalQueueItem = {
  id: number;
  wallet: string;
  aptcAmount: number;
  status: string;
  rewardIds: number[];
  requestedAt: string;
  adminNote: string | null;
};

export async function fetchStakingRewardQueue(db: SupabaseClient): Promise<StakingRewardQueueItem[]> {
  const now = new Date().toISOString();
  const { data: positions } = await db
    .from('staking_positions')
    .select('id, user_address, pool_key, amount, reward_amount, unlock_at, created_at, tx_hash')
    .eq('pool_key', 'IPO_30D')
    .eq('status', 'active')
    .is('reward_paid_at', null)
    .gt('reward_amount', 0)
    .order('unlock_at', { ascending: true })
    .limit(500);

  const positionIds = (positions || []).map((p) => p.id);
  const purchaseByPosition = new Map<number, number>();
  if (positionIds.length) {
    const { data: purchases } = await db
      .from('ipo_purchases')
      .select('id, staking_position_id')
      .in('staking_position_id', positionIds);
    for (const row of purchases || []) {
      if (row.staking_position_id) purchaseByPosition.set(row.staking_position_id, row.id);
    }
  }

  return (positions || []).map((p) => ({
    id: p.id,
    userAddress: p.user_address,
    poolKey: p.pool_key,
    amount: Number(p.amount),
    rewardAmount: Number(p.reward_amount),
    unlockAt: p.unlock_at,
    createdAt: p.created_at,
    purchaseId: purchaseByPosition.get(p.id) ?? null,
    due: p.unlock_at <= now,
  }));
}

export async function fetchAffiliateRewardQueue(db: SupabaseClient): Promise<AffiliateRewardQueueItem[]> {
  const now = new Date().toISOString();
  const { data: rows } = await db
    .from('ipo_affiliate_rewards')
    .select('id, beneficiary_wallet, level, aptc_amount, status, withdrawable_at, purchase_id, created_at')
    .in('status', ['accrued', 'withdrawal_requested'])
    .order('withdrawable_at', { ascending: true })
    .limit(500);

  return (rows || []).map((r) => ({
    id: r.id,
    beneficiaryWallet: r.beneficiary_wallet,
    level: r.level,
    aptcAmount: Number(r.aptc_amount),
    status: r.status,
    withdrawableAt: r.withdrawable_at,
    purchaseId: r.purchase_id,
    createdAt: r.created_at,
    due: r.withdrawable_at <= now,
  }));
}

export async function fetchAffiliateWithdrawalQueue(
  db: SupabaseClient,
): Promise<AffiliateWithdrawalQueueItem[]> {
  const { data: rows } = await db
    .from('ipo_affiliate_withdrawals')
    .select('id, wallet, aptc_amount, status, reward_ids, requested_at, admin_note')
    .in('status', ['pending', 'approved'])
    .order('requested_at', { ascending: true })
    .limit(200);

  return (rows || []).map((r) => ({
    id: r.id,
    wallet: r.wallet,
    aptcAmount: Number(r.aptc_amount),
    status: r.status,
    rewardIds: Array.isArray(r.reward_ids) ? r.reward_ids.map(Number) : [],
    requestedAt: r.requested_at,
    adminNote: r.admin_note,
  }));
}

/** Record manual staking reward payout (admin sends APTC off-dashboard, then logs tx). */
export async function payStakingRewards(
  db: SupabaseClient,
  positionIds: number[],
  options: PayoutRecordOptions,
): Promise<{ paid: Array<{ id: number; txHash: string; amount: number; wallet: string }> }> {
  const txHash = requireTxHash(options.txHash);
  const now = new Date().toISOString();
  const paid: Array<{ id: number; txHash: string; amount: number; wallet: string }> = [];

  for (const positionId of positionIds) {
    const { data: pos, error } = await db
      .from('staking_positions')
      .select('*')
      .eq('id', positionId)
      .single();
    if (error || !pos) throw new Error(`Staking position ${positionId} not found`);
    if (pos.pool_key !== 'IPO_30D') throw new Error(`Position ${positionId} is not an IPO stake`);
    if (pos.reward_paid_at) throw new Error(`Position ${positionId} reward already paid`);
    if (pos.status !== 'active') throw new Error(`Position ${positionId} is not active`);
    if (new Date(pos.unlock_at).getTime() > Date.now()) {
      throw new Error(`Position ${positionId} is still locked until ${pos.unlock_at}`);
    }

    const reward = Number(pos.reward_amount);
    if (!Number.isFinite(reward) || reward <= 0) {
      throw new Error(`Position ${positionId} has no reward amount`);
    }

    const { error: updErr } = await db
      .from('staking_positions')
      .update({
        reward_paid_at: now,
        reward_paid_tx_hash: txHash,
        updated_at: now,
      })
      .eq('id', positionId)
      .is('reward_paid_at', null);

    if (updErr) throw new Error(updErr.message);

    await db.from('staking_ledger').insert({
      user_address: pos.user_address,
      position_id: positionId,
      currency: 'APTC',
      operation: 'claim',
      amount: reward,
      reward_amount: reward,
      tx_hash: txHash,
    });

    paid.push({ id: positionId, txHash, amount: reward, wallet: pos.user_address });
  }

  return { paid };
}

/** Record manual affiliate reward payout. */
export async function payAffiliateRewards(
  db: SupabaseClient,
  rewardIds: number[],
  options: PayoutRecordOptions,
): Promise<{ paid: Array<{ id: number; txHash: string; amount: number; wallet: string }> }> {
  const txHash = requireTxHash(options.txHash);
  const now = new Date().toISOString();
  const paid: Array<{ id: number; txHash: string; amount: number; wallet: string }> = [];

  for (const rewardId of rewardIds) {
    const { data: row, error } = await db
      .from('ipo_affiliate_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();
    if (error || !row) throw new Error(`Affiliate reward ${rewardId} not found`);
    if (row.status === 'paid') throw new Error(`Affiliate reward ${rewardId} already paid`);
    if (row.status === 'cancelled') throw new Error(`Affiliate reward ${rewardId} was cancelled`);
    if (new Date(row.withdrawable_at).getTime() > Date.now()) {
      throw new Error(`Affiliate reward ${rewardId} not withdrawable until ${row.withdrawable_at}`);
    }

    const { error: updErr } = await db
      .from('ipo_affiliate_rewards')
      .update({
        status: 'paid',
        paid_tx_hash: txHash,
        paid_at: now,
      })
      .eq('id', rewardId)
      .in('status', ['accrued', 'withdrawal_requested']);

    if (updErr) throw new Error(updErr.message);

    paid.push({
      id: rewardId,
      txHash,
      amount: Number(row.aptc_amount),
      wallet: row.beneficiary_wallet,
    });
  }

  return { paid };
}

export async function processAffiliateWithdrawal(
  db: SupabaseClient,
  withdrawalId: number,
  action: 'pay' | 'reject',
  options: Partial<PayoutRecordOptions> = {},
): Promise<{ success: boolean; txHash?: string }> {
  const { data: wd, error } = await db
    .from('ipo_affiliate_withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .single();
  if (error || !wd) throw new Error('Withdrawal request not found');
  if (!['pending', 'approved'].includes(wd.status)) {
    throw new Error(`Withdrawal ${withdrawalId} is not actionable (${wd.status})`);
  }

  if (action === 'reject') {
    await db
      .from('ipo_affiliate_withdrawals')
      .update({
        status: 'rejected',
        admin_note: options.adminNote?.trim() || wd.admin_note,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    if (wd.reward_ids?.length) {
      await db
        .from('ipo_affiliate_rewards')
        .update({ status: 'accrued' })
        .in('id', wd.reward_ids)
        .eq('status', 'withdrawal_requested');
    }
    return { success: true };
  }

  const rewardIds = (wd.reward_ids || []).map(Number).filter(Boolean);
  if (!rewardIds.length) throw new Error('Withdrawal has no linked rewards');

  const { paid } = await payAffiliateRewards(db, rewardIds, {
    txHash: requireTxHash(options.txHash),
    adminNote: options.adminNote,
  });
  const txHash = paid[0]?.txHash;

  await db
    .from('ipo_affiliate_withdrawals')
    .update({
      status: 'paid',
      tx_hash: txHash,
      admin_note: options.adminNote?.trim() || wd.admin_note,
      processed_at: new Date().toISOString(),
    })
    .eq('id', withdrawalId);

  return { success: true, txHash };
}
