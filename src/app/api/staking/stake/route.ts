import { NextRequest, NextResponse } from 'next/server';
import { getMinStakeForPool, getPoolDefinition } from '@/lib/staking/pools';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { verifySolanaStakeToVaultTx } from '@/lib/solana/backend-client';
import { getSolanaStakingVaultConfig } from '@/lib/solana/config';

export const dynamic = 'force-dynamic';

async function verifyStakeWithRetries(
  txHash: string,
  userAddress: string,
  amount: number,
  vaultAddress: string,
): Promise<boolean> {
  const attempts = 10;
  for (let i = 0; i < attempts; i++) {
    const ok = await verifySolanaStakeToVaultTx(txHash, userAddress, amount, vaultAddress);
    if (ok) return true;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}

/**
 * Records a staking position after verifying an on-chain APTC transfer to the staking vault.
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  const stakingEnabled =
    (process.env.APTC_STAKING_ENABLED ||
      process.env.NEXT_PUBLIC_APTC_STAKING_ENABLED ||
      'false').toLowerCase() === 'true';

  if (!stakingEnabled) {
    return NextResponse.json(
      {
        error:
          'APTC staking is not yet open. It unlocks at TGE — set APTC_STAKING_ENABLED=true once the token is live on Solana.',
      },
      { status: 503 },
    );
  }

  let body: {
    userAddress?: string;
    poolKey?: string;
    amount?: number | string;
    txHash?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const userAddress = String(body.userAddress || '').trim();
  const poolKey = String(body.poolKey || '').trim();
  const amount = Number(body.amount);
  const txHash = body.txHash ? String(body.txHash).trim() : null;

  if (!userAddress) {
    return NextResponse.json({ error: 'userAddress is required' }, { status: 400 });
  }
  if (!poolKey) {
    return NextResponse.json({ error: 'poolKey is required' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
  }
  if (!txHash) {
    return NextResponse.json(
      { error: 'txHash is required — confirm the APTC transfer in your wallet first.' },
      { status: 400 },
    );
  }

  const vaultAddress = getSolanaStakingVaultConfig().address;
  if (!vaultAddress) {
    return NextResponse.json({ error: 'Staking vault is not configured on the server.' }, { status: 500 });
  }

  const verified = await verifyStakeWithRetries(txHash, userAddress, amount, vaultAddress);
  if (!verified) {
    return NextResponse.json(
      {
        error:
          'Could not verify APTC transfer to the staking vault. Wait a few seconds and try again, or check the transaction on Solscan.',
      },
      { status: 400 },
    );
  }

  const { data: existingTx } = await supabase
    .from('staking_positions')
    .select('id')
    .eq('tx_hash', txHash)
    .maybeSingle();
  if (existingTx) {
    return NextResponse.json(
      { error: 'This transaction was already used for staking.', positionId: existingTx.id },
      { status: 409 },
    );
  }

  const { data: pool, error: poolErr } = await supabase
    .from('staking_pools')
    .select('pool_key, lock_days, apy_bps, min_stake, max_stake, is_active')
    .eq('pool_key', poolKey)
    .single();

  if (poolErr || !pool || !pool.is_active) {
    return NextResponse.json({ error: 'Staking pool is not available.' }, { status: 400 });
  }

  const poolDef = getPoolDefinition(poolKey);
  const minStake = getMinStakeForPool(poolKey) ?? Number(pool.min_stake);
  if (amount < minStake) {
    const minLabel = poolDef
      ? `${poolDef.min_supply_pct}% of APTC supply (${minStake.toLocaleString()} APTC)`
      : `${minStake} APTC`;
    return NextResponse.json(
      { error: `Stake amount is below pool minimum (${minLabel}).` },
      { status: 400 },
    );
  }
  if (pool.max_stake !== null && amount > Number(pool.max_stake)) {
    return NextResponse.json(
      { error: `Stake amount exceeds pool maximum (${pool.max_stake}).` },
      { status: 400 },
    );
  }

  const startAt = new Date();
  const unlockAt = new Date(startAt.getTime() + Number(pool.lock_days) * 86_400 * 1000);

  const { data: inserted, error: insertErr } = await supabase
    .from('staking_positions')
    .insert({
      user_address: userAddress,
      currency: 'APTC',
      pool_key: pool.pool_key,
      lock_days: pool.lock_days,
      apy_bps: pool.apy_bps,
      amount,
      start_at: startAt.toISOString(),
      unlock_at: unlockAt.toISOString(),
      status: 'active',
      tx_hash: txHash,
    })
    .select('id, unlock_at')
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: 'Failed to record staking position.', detail: insertErr?.message },
      { status: 500 },
    );
  }

  await supabase.from('staking_ledger').insert({
    user_address: userAddress,
    position_id: inserted.id,
    currency: 'APTC',
    operation: 'stake',
    amount,
    tx_hash: txHash,
  });

  return NextResponse.json({
    success: true,
    positionId: inserted.id,
    unlockAt: inserted.unlock_at,
  });
}
