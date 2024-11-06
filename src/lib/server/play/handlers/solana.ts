import { NextResponse } from 'next/server';
import {
  verifySolanaDepositTx,
  sweepSolanaPlatformFee,
  assertSolanaTreasurySignerMatchesEscrow,
} from '@/lib/solana/backend-client';
import { getSolanaTreasuryAddress } from '@/lib/solana/config';
import { getResolvedFeeWalletAddress } from '@/lib/chains/registry';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  creditHouseBalance,
  debitHouseBalance,
  getHouseBalance,
} from '@/lib/server/houseBalance';
import { nativeToRaw, rawToNative } from '@/lib/server/play/amounts';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { getWithdrawFeeBps, feeFromGrossOctas } from '@/lib/server/platformFees';
import { quoteDepositFees } from '@/lib/server/feeTiers';
import { executeSolWithdrawal } from '@/lib/server/executeSolWithdrawal';
import {
  estimateWithdrawalUsd,
  pendingWithdrawalMessage,
  queueWithdrawalRequest,
  requiresManualWithdrawalApproval,
} from '@/lib/server/withdrawalQueue';
import { walletGuardResponse } from '@/lib/server/walletGuard';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { syncCashbackCap } from '@/lib/server/cashback';
import {
  accrueDepositAptcBonus,
  getDepositBonusLockDays,
} from '@/lib/server/depositAptcBonus';

const CHAIN = 'solana' as const;

function limits() {
  const cfg = getPlayChainConfig(CHAIN)!;
  const minRaw = process.env[cfg.depositMinEnv || ''];
  const maxRaw = process.env[cfg.depositMaxEnv || ''];
  const minDeposit =
    minRaw != null && minRaw.trim() !== '' && Number.isFinite(parseFloat(minRaw))
      ? parseFloat(minRaw)
      : 0.01;
  const maxDeposit =
    maxRaw != null && maxRaw.trim() !== '' && Number.isFinite(parseFloat(maxRaw)) && parseFloat(maxRaw) > 0
      ? parseFloat(maxRaw)
      : null;
  return {
    minDeposit,
    maxDeposit,
    minWithdraw: parseFloat(process.env[cfg.withdrawMinEnv || ''] || '0.01'),
  };
}

export async function solanaBalanceGET(wallet: string) {
  const cfg = getPlayChainConfig(CHAIN)!;
  const raw = await getHouseBalance(wallet, CHAIN, cfg.dbCurrency);
  return NextResponse.json({
    wallet,
    chain: CHAIN,
    currency: cfg.dbCurrency,
    balanceRaw: raw.toString(),
    balanceNative: rawToNative(CHAIN, raw),
  });
}

export async function solanaBetPOST(request: Request) {
  try {
    const body = await request.json();
    const wallet = String(body.wallet || '').trim();
    const guard = await walletGuardResponse(wallet);
    if (guard) return guard;

    const action = body.action === 'credit' ? 'credit' : 'debit';
    const amountNative = parseFloat(body.amountNative ?? body.amountSol);

    if (!wallet || !Number.isFinite(amountNative) || amountNative <= 0) {
      return NextResponse.json({ error: 'wallet and positive amountNative required' }, { status: 400 });
    }

    const cfg = getPlayChainConfig(CHAIN)!;
    const amountRaw = nativeToRaw(CHAIN, amountNative);
    const newBalance =
      action === 'credit'
        ? await creditHouseBalance({ wallet, chain: CHAIN, currency: cfg.dbCurrency, amountRaw })
        : await debitHouseBalance({ wallet, chain: CHAIN, currency: cfg.dbCurrency, amountRaw });

    return NextResponse.json({
      success: true,
      balanceRaw: newBalance.toString(),
      balanceNative: rawToNative(CHAIN, newBalance),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bet update failed';
    return NextResponse.json({ error: msg }, { status: msg.includes('Insufficient') ? 400 : 500 });
  }
}

export async function solanaDepositPOST(request: Request) {
  try {
    const body = await request.json();
    const wallet = normalizeWalletForChain(String(body.wallet || '').trim(), CHAIN);
    if (!wallet) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }
    const guard = await walletGuardResponse(wallet);
    if (guard) return guard;
    const amountNative = parseFloat(body.amountNative ?? body.amountSol);
    const txSignature = String(body.txSignature || '').trim();
    const { minDeposit, maxDeposit } = limits();

    if (!txSignature || !Number.isFinite(amountNative) || amountNative <= 0) {
      return NextResponse.json({ error: 'wallet, positive amountNative, and txSignature required' }, { status: 400 });
    }

    const cfg = getPlayChainConfig(CHAIN)!;
    const amountRaw = nativeToRaw(CHAIN, amountNative);
    const feeQuote = await quoteDepositFees(CHAIN, amountNative);
    const depositFeeBps = feeQuote.depositFeeBps;
    const feeRaw = BigInt(feeFromGrossOctas(Number(amountRaw), depositFeeBps));
    const netRaw = amountRaw > feeRaw ? amountRaw - feeRaw : 0n;

    const feeNative = rawToNative(CHAIN, feeRaw);
    const netNative = rawToNative(CHAIN, netRaw);

    if (netRaw <= 0n) {
      return NextResponse.json(
        {
          error: `Deposit too small — after the ${depositFeeBps / 100}% platform fee nothing would credit to your balance.`,
        },
        { status: 400 },
      );
    }

    if (minDeposit > 0 && amountNative < minDeposit) {
      return NextResponse.json(
        { error: `Minimum deposit is ${minDeposit} SOL (optional server limit).` },
        { status: 400 },
      );
    }
    if (maxDeposit != null && amountNative > maxDeposit) {
      return NextResponse.json(
        { error: `Maximum deposit is ${maxDeposit} SOL.` },
        { status: 400 },
      );
    }

    const treasury = getSolanaTreasuryAddress();
    if (!treasury) {
      return NextResponse.json({ error: 'Solana escrow not configured' }, { status: 503 });
    }

    try {
      assertSolanaTreasurySignerMatchesEscrow();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Treasury misconfigured';
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const db = getSupabaseAdmin();
    if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { data: existing } = await db
      .from('deposits_log')
      .select('id, platform_fee_tx_hash')
      .eq('user_tx_hash', txSignature)
      .maybeSingle();

    if (existing) {
      const raw = await getHouseBalance(wallet, CHAIN, cfg.dbCurrency);
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        balanceRaw: raw.toString(),
        balanceNative: rawToNative(CHAIN, raw),
        grossNative: amountNative,
        creditedNative: netNative,
        netCreditedNative: netNative,
        platformFeeBps: depositFeeBps,
        platformFeeNative: feeNative,
        platformFeeTxHash: existing.platform_fee_tx_hash ?? null,
      });
    }

    const ok = await verifySolanaDepositTx(txSignature, wallet, amountNative);
    if (!ok) {
      return NextResponse.json(
        { error: 'Could not verify SOL transfer to escrow. Wait a few seconds and retry.' },
        { status: 400 },
      );
    }

    const newBalance = await creditHouseBalance({
      wallet,
      chain: CHAIN,
      currency: cfg.dbCurrency,
      amountRaw: netRaw,
    });

    await db.from('deposits_log').insert({
      chain: CHAIN,
      wallet,
      amount_octas: Number(amountRaw),
      amount_native: amountNative,
      fee_octas: Number(feeRaw),
      net_credited_octas: Number(netRaw),
      user_tx_hash: txSignature,
      platform_fee_tx_hash: null,
    });

    await syncCashbackCap(wallet, CHAIN).catch((e) =>
      console.warn('[chains/solana/deposit] cashback cap sync', e),
    );

    const depositBonusResult = await accrueDepositAptcBonus({
      wallet,
      chain: CHAIN,
      depositTxHash: txSignature,
      depositNative: amountNative,
    });

    let platformFeeTx: string | null = null;
    let feeSweepPending = false;
    if (feeRaw > 0n) {
      const feeWallet = getResolvedFeeWalletAddress(CHAIN);
      if (feeWallet?.trim()) {
        try {
          platformFeeTx = await sweepSolanaPlatformFee(feeWallet.trim(), feeNative);
          if (platformFeeTx) {
            await db
              .from('deposits_log')
              .update({ platform_fee_tx_hash: platformFeeTx })
              .eq('user_tx_hash', txSignature);
          }
        } catch (e) {
          feeSweepPending = true;
          console.error('[chains/solana/deposit] platform fee sweep deferred (balance credited):', e);
        }
      } else {
        console.warn(
          '[chains/solana/deposit] NEXT_PUBLIC_PLATFORM_FEE_WALLET_SOL not set — fee remains in treasury',
        );
      }
    }

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/players/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, chain: CHAIN }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      balanceRaw: newBalance.toString(),
      balanceNative: rawToNative(CHAIN, newBalance),
      grossNative: amountNative,
      creditedNative: netNative,
      netCreditedNative: netNative,
      platformFeeBps: depositFeeBps,
      platformFeeNative: feeNative,
      platformFeeTxHash: platformFeeTx,
      feeSweepPending,
      depositBonus: depositBonusResult
        ? {
            rewardAptc: depositBonusResult.rewardAptc,
            unlockAt: depositBonusResult.unlockAt,
            lockDays: getDepositBonusLockDays(),
          }
        : null,
      feeTier: {
        id: feeQuote.tier.id,
        label: feeQuote.tier.label,
        depositFeeBps,
        depositFeePct: feeQuote.tier.depositPct,
        depositUsd: feeQuote.depositUsd,
      },
    });
  } catch (e) {
    console.error('[chains/solana/deposit]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Deposit failed' },
      { status: 500 },
    );
  }
}

export async function solanaWithdrawPOST(request: Request) {
  try {
    const body = await request.json();
    const walletRaw = String(body.wallet || '').trim();
    const wallet = normalizeWalletForChain(walletRaw, CHAIN);
    if (!wallet) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }
    const guard = await walletGuardResponse(wallet);
    if (guard) return guard;
    const amountNative = parseFloat(body.amountNative ?? body.amountSol);
    const { minWithdraw } = limits();

    if (!wallet || !Number.isFinite(amountNative) || amountNative < minWithdraw) {
      return NextResponse.json(
        { error: `Invalid amount (min ${minWithdraw} SOL)` },
        { status: 400 },
      );
    }

    const cfg = getPlayChainConfig(CHAIN)!;
    const amountRaw = nativeToRaw(CHAIN, amountNative);
    const current = await getHouseBalance(wallet, CHAIN, cfg.dbCurrency);
    if (current < amountRaw) {
      return NextResponse.json({ error: 'Insufficient play balance' }, { status: 400 });
    }

    const withdrawFeeBps = getWithdrawFeeBps();
    const grossLamports = Number(amountRaw);
    const feeRaw = feeFromGrossOctas(grossLamports, withdrawFeeBps);
    const userPayoutRaw = Math.max(0, grossLamports - feeRaw);

    const usdEstimate = await estimateWithdrawalUsd(CHAIN, amountNative);

    if (requiresManualWithdrawalApproval(usdEstimate)) {
      const newBalance = await debitHouseBalance({
        wallet,
        chain: CHAIN,
        currency: cfg.dbCurrency,
        amountRaw,
      });

      const { requestId, thresholdUsd } = await queueWithdrawalRequest({
        chain: CHAIN,
        wallet,
        grossOctas: grossLamports,
        grossNative: amountNative,
        usdEstimate,
        feeOctas: feeRaw,
        userPayoutOctas: userPayoutRaw,
      });

      return NextResponse.json({
        success: true,
        pendingApproval: true,
        requestId,
        message: pendingWithdrawalMessage(thresholdUsd),
        grossNative: amountNative,
        estimatedUsd: usdEstimate,
        platformFeeNative: rawToNative(CHAIN, feeRaw),
        netAfterFeeNative: rawToNative(CHAIN, userPayoutRaw),
        balanceRaw: newBalance.toString(),
        balanceNative: rawToNative(CHAIN, newBalance),
      });
    }

    const newBalance = await debitHouseBalance({
      wallet,
      chain: CHAIN,
      currency: cfg.dbCurrency,
      amountRaw,
    });

    const result = await executeSolWithdrawal({
      wallet,
      grossNative: amountNative,
      withdrawFeeBps,
    });

    const db = getSupabaseAdmin();
    if (db) {
      await db.from('withdrawal_requests').insert({
        chain: CHAIN,
        wallet,
        gross_octas: grossLamports,
        gross_apt: amountNative,
        usd_estimate: usdEstimate,
        fee_octas: feeRaw,
        user_payout_octas: userPayoutRaw,
        status: 'auto',
        user_tx_hash: result.userTxHash,
        fee_tx_hash: result.feeTxHash,
        processed_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      txSignature: result.userTxHash,
      feeTxHash: result.feeTxHash,
      balanceRaw: newBalance.toString(),
      balanceNative: rawToNative(CHAIN, newBalance),
      platformFeeNative: result.feeNative,
      netAfterFeeNative: result.userPayoutNative,
    });
  } catch (e) {
    console.error('[chains/solana/withdraw]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Withdrawal failed' },
      { status: 500 },
    );
  }
}
