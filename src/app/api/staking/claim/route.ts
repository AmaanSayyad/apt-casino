import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { transferBynomoFromStakingVault } from '@/lib/solana/backend-client';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { assertWalletAuth, readWalletAuthFromBody, walletAuthRateLimitResponse } from '@/lib/server/walletAuth';
import { rateLimitRequest } from '@/lib/server/requestRateLimit';

export const dynamic = 'force-dynamic';

/**
 * Claims a matured staking position and sends principal + reward from the staking vault.
 */
export async function POST(req: NextRequest) {
  if (rateLimitRequest(req, { key: 'staking-claim', limit: 6, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many claim requests. Please try again shortly.' }, { status: 429 });
  }

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

  const rateErr = walletAuthRateLimitResponse(req, userAddress);
  if (rateErr) return rateErr;

  const authErr = await assertWalletAuth(userAddress, 'solana', readWalletAuthFromBody(body), {
    consume: true,
    purpose: 'staking_claim',
  });
  if (authErr) return authErr;
  if (!Number.isFinite(positionId) || positionId <= 0) {
    return NextResponse.json({ error: 'positionId is required' }, { status: 400 });
  }

  const { data: claimRows, error: claimErr } = await supabase.rpc('claim_staking_position_atomic', {
    p_position_id: positionId,
    p_user_address: userAddress,
  });

  if (claimErr) {
    const msg = claimErr.message || 'Claim failed';
    if (/position_not_found/i.test(msg)) {
      return NextResponse.json({ error: 'Position not found.' }, { status: 404 });
    }
    if (/position_owner_mismatch/i.test(msg)) {
      return NextResponse.json({ error: 'Position does not belong to this wallet.' }, { status: 403 });
    }
    if (/position_still_locked/i.test(msg)) {
      return NextResponse.json({ error: 'Position is still locked.' }, { status: 400 });
    }
    if (/position_not_claimable|claim_staking_position_atomic|does not exist/i.test(msg)) {
      return NextResponse.json({ error: 'Position is not claimable.' }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
  const reward = Number(claim?.reward ?? 0);
  const payout = Number(claim?.payout ?? 0);

  let payoutTxHash: string | null = null;
  try {
    payoutTxHash = await transferBynomoFromStakingVault(userAddress, payout);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to send APTC payout from the staking vault.',
        detail,
        note: 'Position marked claimed in database; contact support if payout did not arrive.',
      },
      { status: 503 },
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
