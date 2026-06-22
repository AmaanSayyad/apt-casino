import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { transferBynomoFromStakingVault } from '@/lib/solana/backend-client';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { assertWalletAuth, readWalletAuthFromBody } from '@/lib/server/walletAuth';

export const dynamic = 'force-dynamic';

/**
 * Claims a matured staking position and sends principal + reward from the staking vault.
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  let body: { userAddress?: string; positionId?: number | string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const userAddress = normalizeWalletForChain(String(body.userAddress || '').trim(), 'solana');
  const positionId = Number(body.positionId);

  if (!userAddress) {
    return NextResponse.json({ error: 'userAddress is required' }, { status: 400 });
  }

  const authErr = assertWalletAuth(userAddress, 'solana', readWalletAuthFromBody(body));
  if (authErr) return authErr;
  if (!Number.isFinite(positionId) || positionId <= 0) {
    return NextResponse.json({ error: 'positionId is required' }, { status: 400 });
  }

  const { data: pos, error: posErr } = await supabase
    .from('staking_positions')
    .select(
      'id, user_address, status, amount, apy_bps, lock_days, unlock_at',
    )
    .eq('id', positionId)
    .single();

  if (posErr || !pos) {
    return NextResponse.json({ error: 'Position not found.' }, { status: 404 });
  }
  if (pos.user_address !== userAddress) {
    return NextResponse.json({ error: 'Position does not belong to this wallet.' }, { status: 403 });
  }
  if (pos.status !== 'active') {
    return NextResponse.json({ error: 'Position is not claimable.' }, { status: 400 });
  }
  if (new Date(pos.unlock_at).getTime() > Date.now()) {
    return NextResponse.json(
      { error: 'Position is still locked.', unlockAt: pos.unlock_at },
      { status: 400 },
    );
  }

  const amount = Number(pos.amount);
  const apyBps = Number(pos.apy_bps);
  const lockDays = Number(pos.lock_days);
  const reward = Math.round(amount * (apyBps / 10_000) * (lockDays / 365) * 1e8) / 1e8;
  const payout = Math.round((amount + reward) * 1e8) / 1e8;

  let payoutTxHash: string | null = null;
  try {
    payoutTxHash = await transferBynomoFromStakingVault(userAddress, payout);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to send APTC payout from the staking vault.',
        detail,
      },
      { status: 503 },
    );
  }

  const nowIso = new Date().toISOString();
  const { error: updErr } = await supabase
    .from('staking_positions')
    .update({
      status: 'claimed',
      reward_amount: reward,
      total_payout: payout,
      claimed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', positionId);

  if (updErr) {
    return NextResponse.json(
      { error: 'Failed to mark position as claimed.', detail: updErr.message },
      { status: 500 },
    );
  }

  await supabase.from('staking_ledger').insert({
    user_address: userAddress,
    position_id: positionId,
    currency: 'APTC',
    operation: 'claim',
    amount: payout,
    reward_amount: reward,
    tx_hash: payoutTxHash,
  });

  return NextResponse.json({
    success: true,
    positionId,
    reward,
    payout,
    txHash: payoutTxHash,
  });
}
