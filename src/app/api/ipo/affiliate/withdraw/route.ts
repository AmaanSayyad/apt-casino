import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { isValidSolanaWallet } from '@/lib/server/ipo/affiliate';
import { getIpoServerConfig } from '@/lib/server/ipo/config';

export const dynamic = 'force-dynamic';

/**
 * Request payout of all withdrawable IPO affiliate rewards for a wallet.
 * Admin fulfills via /dashboard → IPO payouts queue.
 */
export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  let body: { wallet?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const wallet = String(body.wallet || '').trim();
  if (!isValidSolanaWallet(wallet)) {
    return NextResponse.json({ error: 'Valid wallet address required' }, { status: 400 });
  }

  const cfg = getIpoServerConfig();
  const now = new Date().toISOString();

  const { data: rewards, error: rErr } = await db
    .from('ipo_affiliate_rewards')
    .select('id, aptc_amount, withdrawable_at, status')
    .eq('beneficiary_wallet', wallet)
    .eq('status', 'accrued')
    .lte('withdrawable_at', now);

  if (rErr) {
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }

  if (!rewards?.length) {
    return NextResponse.json(
      { error: 'No withdrawable affiliate rewards yet. 10-day cliff must pass after accrual.' },
      { status: 400 },
    );
  }

  const rewardIds = rewards.map((r) => r.id);
  const aptcAmount = rewards.reduce((s, r) => s + Number(r.aptc_amount), 0);

  const { data: pending } = await db
    .from('ipo_affiliate_withdrawals')
    .select('id')
    .eq('wallet', wallet)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (pending) {
    return NextResponse.json(
      { error: 'You already have a pending affiliate withdrawal request.', withdrawalId: pending.id },
      { status: 409 },
    );
  }

  const { data: withdrawal, error: wErr } = await db
    .from('ipo_affiliate_withdrawals')
    .insert({
      wallet,
      aptc_amount: aptcAmount,
      status: 'pending',
      reward_ids: rewardIds,
    })
    .select('id, aptc_amount, requested_at')
    .single();

  if (wErr || !withdrawal) {
    return NextResponse.json({ error: wErr?.message || 'Failed to create withdrawal request' }, { status: 500 });
  }

  await db
    .from('ipo_affiliate_rewards')
    .update({ status: 'withdrawal_requested' })
    .in('id', rewardIds)
    .eq('status', 'accrued');

  return NextResponse.json({
    success: true,
    withdrawalId: withdrawal.id,
    aptcAmount,
    rewardCount: rewardIds.length,
    requestedAt: withdrawal.requested_at,
    note: `Admin manual payout within ${cfg.affiliateWithdrawMinDays}+ days after accrual.`,
  });
}
