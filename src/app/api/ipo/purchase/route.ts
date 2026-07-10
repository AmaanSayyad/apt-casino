import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  accrueAffiliateRewards,
  attributeIpoReferrer,
  isValidSolanaWallet,
} from '@/lib/server/ipo/affiliate';
import { getIpoPhaseAt, getIpoServerConfig } from '@/lib/server/ipo/config';
import { estimateStakingReward, getSolUsdPrice, solToAptc } from '@/lib/server/ipo/pricing';
import { sendIpoAptcToStakingVault, verifyIpoSolDeposit } from '@/lib/server/ipo/settlement';
import { fulfillPendingSupplyPurchases } from '@/lib/server/ipo/fulfillment';

export const dynamic = 'force-dynamic';

async function verifyWithRetries(
  txHash: string,
  wallet: string,
  solAmount: number,
): Promise<boolean> {
  for (let i = 0; i < 12; i++) {
    const ok = await verifyIpoSolDeposit(txHash, wallet, solAmount);
    if (ok) return true;
    if (i < 11) await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export async function POST(req: NextRequest) {
  const cfg = getIpoServerConfig();
  if (!cfg.enabled) {
    return NextResponse.json({ error: 'IPO is not enabled.' }, { status: 503 });
  }

  const phase = getIpoPhaseAt(Date.now(), cfg.startAt, cfg.endAt);
  if (phase !== 'live') {
    return NextResponse.json(
      { error: phase === 'upcoming' ? 'IPO has not started yet.' : 'IPO sale has ended.' },
      { status: 400 },
    );
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  let body: { wallet?: string; solAmount?: number | string; txHash?: string; referrerWallet?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const wallet = String(body.wallet || '').trim();
  const txHash = String(body.txHash || '').trim();
  const solAmount = Number(body.solAmount);
  const referrerWallet = body.referrerWallet ? String(body.referrerWallet).trim() : null;

  if (!isValidSolanaWallet(wallet)) {
    return NextResponse.json({ error: 'Valid wallet address is required' }, { status: 400 });
  }
  if (!txHash || txHash.length < 32) {
    return NextResponse.json({ error: 'txHash is required' }, { status: 400 });
  }
  if (!Number.isFinite(solAmount) || solAmount <= 0) {
    return NextResponse.json({ error: 'solAmount must be positive' }, { status: 400 });
  }

  const { data: existing } = await db
    .from('ipo_purchases')
    .select('id, status, aptc_tx_hash, aptc_amount, staking_position_id')
    .eq('sol_tx_hash', txHash)
    .maybeSingle();

  if (existing?.status === 'fulfilled') {
    return NextResponse.json({
      success: true,
      alreadyProcessed: true,
      purchaseId: existing.id,
      aptcTxHash: existing.aptc_tx_hash,
      aptcAmount: Number(existing.aptc_amount),
      stakingPositionId: existing.staking_position_id,
    });
  }

  if (existing?.status === 'pending_supply') {
    await fulfillPendingSupplyPurchases(db);
    const { data: refreshed } = await db
      .from('ipo_purchases')
      .select('id, status, aptc_tx_hash, aptc_amount, staking_position_id')
      .eq('id', existing.id)
      .maybeSingle();
    if (refreshed?.status === 'fulfilled') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        purchaseId: refreshed.id,
        aptcTxHash: refreshed.aptc_tx_hash,
        aptcAmount: Number(refreshed.aptc_amount),
        stakingPositionId: refreshed.staking_position_id,
      });
    }
  }

  await fulfillPendingSupplyPurchases(db);

  if (referrerWallet && isValidSolanaWallet(referrerWallet) && referrerWallet !== wallet) {
    await attributeIpoReferrer(db, wallet, referrerWallet);
  }

  const verified = await verifyWithRetries(txHash, wallet, solAmount);
  if (!verified) {
    return NextResponse.json(
      {
        error:
          'Could not verify SOL transfer to IPO treasury. Wait a few seconds and retry, or check Solscan.',
      },
      { status: 400 },
    );
  }

  let solUsd: number;
  try {
    solUsd = await getSolUsdPrice();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Price oracle unavailable' },
      { status: 503 },
    );
  }

  const aptcAmount = solToAptc(solAmount, solUsd, cfg.aptcPriceUsd);
  if (aptcAmount <= 0) {
    return NextResponse.json({ error: 'Purchase amount too small.' }, { status: 400 });
  }

  const usdValue = solAmount * solUsd;

  const { data: chain } = await db
    .from('ipo_referral_attribution')
    .select('referrer_wallet')
    .eq('wallet', wallet)
    .maybeSingle();

  let purchaseId: number;
  if (existing?.id) {
    purchaseId = existing.id;
    await db
      .from('ipo_purchases')
      .update({
        buyer_wallet: wallet,
        sol_amount: solAmount,
        sol_usd_price: solUsd,
        usd_value: usdValue,
        aptc_amount: aptcAmount,
        aptc_price_usd: cfg.aptcPriceUsd,
        referrer_wallet: chain?.referrer_wallet ?? null,
        status: 'pending',
        error_message: null,
      })
      .eq('id', purchaseId);
  } else {
    const { data: inserted, error: insErr } = await db
      .from('ipo_purchases')
      .insert({
        buyer_wallet: wallet,
        sol_amount: solAmount,
        sol_usd_price: solUsd,
        usd_value: usdValue,
        aptc_amount: aptcAmount,
        aptc_price_usd: cfg.aptcPriceUsd,
        sol_tx_hash: txHash,
        referrer_wallet: chain?.referrer_wallet ?? null,
        status: 'pending',
      })
      .select('id')
      .single();
    if (insErr || !inserted) {
      return NextResponse.json(
        { error: 'Failed to record purchase', detail: insErr?.message },
        { status: 500 },
      );
    }
    purchaseId = inserted.id;
  }

  let aptcTxHash: string | null = null;
  let finalStatus: 'fulfilled' | 'pending_supply' = 'fulfilled';
  let stakingVault: string | null = null;

  try {
    const sent = await sendIpoAptcToStakingVault(aptcAmount, cfg.mint);
    aptcTxHash = sent.signature;
    stakingVault = sent.stakingVault;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'APTC transfer failed';
    const queued = /insufficient token balance|insufficient APTC/i.test(msg);
    if (queued) {
      finalStatus = 'pending_supply';
      await db
        .from('ipo_purchases')
        .update({
          status: 'pending_supply',
          error_message:
            'Queued — APTC will be locked in the staking vault automatically when treasury inventory is replenished.',
        })
        .eq('id', purchaseId);

      try {
        await accrueAffiliateRewards(db, purchaseId, aptcAmount, wallet);
      } catch (e) {
        console.error('[ipo/purchase] affiliate accrual failed (queued)', e);
      }

      return NextResponse.json({
        success: true,
        queued: true,
        purchaseId,
        solAmount,
        aptcAmount,
        usdValue,
        aptcPriceUsd: cfg.aptcPriceUsd,
        solUsdPrice: solUsd,
        status: 'pending_supply',
        message:
          'SOL received. APTC is queued — your locked allocation will be funded in the staking vault once inventory is replenished.',
      });
    }

    await db
      .from('ipo_purchases')
      .update({ status: 'failed', error_message: msg })
      .eq('id', purchaseId);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (finalStatus !== 'fulfilled' || !aptcTxHash) {
    return NextResponse.json({ error: 'Unexpected settlement state' }, { status: 500 });
  }

  const startAt = new Date();
  const unlockAt = new Date(startAt.getTime() + cfg.stakingLockDays * 86_400_000);
  const estReward = estimateStakingReward(aptcAmount, cfg.stakingApyBps, cfg.stakingLockDays);

  const { data: stakePos, error: stakeErr } = await db
    .from('staking_positions')
    .insert({
      user_address: wallet,
      currency: 'APTC',
      pool_key: 'IPO_30D',
      lock_days: cfg.stakingLockDays,
      apy_bps: cfg.stakingApyBps,
      amount: aptcAmount,
      start_at: startAt.toISOString(),
      unlock_at: unlockAt.toISOString(),
      status: 'active',
      reward_amount: estReward,
      tx_hash: aptcTxHash,
    })
    .select('id, unlock_at')
    .single();

  if (stakeErr || !stakePos) {
    console.error('[ipo/purchase] staking position insert failed', stakeErr);
  }

  await db
    .from('ipo_purchases')
    .update({
      status: 'fulfilled',
      aptc_tx_hash: aptcTxHash,
      staking_position_id: stakePos?.id ?? null,
      fulfilled_at: new Date().toISOString(),
    })
    .eq('id', purchaseId);

  if (stakePos) {
    await db.from('staking_ledger').insert({
      user_address: wallet,
      position_id: stakePos.id,
      currency: 'APTC',
      operation: 'stake',
      amount: aptcAmount,
      reward_amount: estReward,
      tx_hash: aptcTxHash,
    });
  }

  try {
    await accrueAffiliateRewards(db, purchaseId, aptcAmount, wallet);
  } catch (e) {
    console.error('[ipo/purchase] affiliate accrual failed', e);
  }

  return NextResponse.json({
    success: true,
    purchaseId,
    solAmount,
    aptcAmount,
    usdValue,
    aptcPriceUsd: cfg.aptcPriceUsd,
    solUsdPrice: solUsd,
    aptcTxHash,
    stakingVault,
    locked: true,
    unlockAt: stakePos?.unlock_at ?? unlockAt.toISOString(),
    estimatedRewardAptc: estReward,
    stakingApyPct: cfg.stakingApyBps / 100,
    message:
      'APTC locked in the staking vault for 30 days. Track your position under My position — tokens unlock to your wallet after the lock.',
  });
}
