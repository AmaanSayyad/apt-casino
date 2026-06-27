import { NextResponse } from 'next/server';
import {
  verifySolanaDepositTx,
  sweepSolanaPlatformFee,
  assertSolanaTreasurySignerMatchesEscrow,
} from '@/lib/solana/backend-client';
import { getSolanaTreasuryAddress } from '@/lib/solana/config';
import { getResolvedFeeWalletAddress } from '@/lib/chains/registry';
import { getSiteUrl } from '@/lib/siteMetadata';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  creditHouseBalance,
  debitHouseBalance,
  getHouseBalance,
  claimDepositTx,
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
} from '@/lib/server/withdrawalQueue';
import { handlePlayBetAction } from '@/lib/server/play/betSettlement';
import {
  assertWithdrawalAllowed,
} from '@/lib/server/withdrawalGuards';
import { walletGuardResponse } from '@/lib/server/walletGuard';
import { assertWalletAuth, readWalletAuthFromBody } from '@/lib/server/walletAuth';
import { rateLimitRequest } from '@/lib/server/requestRateLimit';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { syncCashbackCap } from '@/lib/server/cashback';
import { incrementRefereeVolumeUsd } from '@/lib/server/referralAptc';
import {
  accrueDepositAptcBonus,
  getDepositBonusLockDays,
} from '@/lib/server/depositAptcBonus';
import { getDepositDealBoost } from '@/lib/server/promotions';

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
    const wallet = normalizeWalletForChain(String(body.wallet || '').trim(), CHAIN);
    if (!wallet) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }
    const guard = await walletGuardResponse(wallet);
    if (guard) return guard;

    const cfg = getPlayChainConfig(CHAIN)!;
    const result = await handlePlayBetAction({
      wallet,
      chain: CHAIN,
      currency: cfg.dbCurrency,
      body,
      debitHouseBalance: (amountRaw) =>
        debitHouseBalance({ wallet, chain: CHAIN, currency: cfg.dbCurrency, amountRaw }),
      creditHouseBalance: (amountRaw) =>
        creditHouseBalance({ wallet, chain: CHAIN, currency: cfg.dbCurrency, amountRaw }),
      getHouseBalance: () => getHouseBalance(wallet, CHAIN, cfg.dbCurrency),
    });

    const betAmountNative = parseFloat(body.betAmountNative ?? body.amountNative ?? body.amountSol);
    if (
      (body.action === 'settle' || body.action === 'debit' || !body.action) &&
      Number.isFinite(betAmountNative) &&
      betAmountNative > 0
    ) {
      const nativeUsd = Number(process.env.SOL_USD_PRICE_OVERRIDE) || 150;
      incrementRefereeVolumeUsd(wallet, betAmountNative, nativeUsd).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      balanceRaw: result.balanceRaw,
      balanceNative: result.balanceNative,
      roundId: result.roundId,
      serverSeedHash: result.serverSeedHash,
      payoutAmountNative: result.payoutAmountNative,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bet update failed';
    const status =
      msg.includes('Insufficient') ||
      msg.includes('stake') ||
      msg.includes('Payout') ||
      msg.includes('gameRound') ||
      msg.includes('fairness') ||
      msg.includes('verification') ||
      msg.includes('rejected')
        ? 400
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function solanaDepositPOST(request: Request) {
  try {
    if (rateLimitRequest(request, { key: 'solana-deposit', limit: 20, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many deposit requests. Please try again shortly.' }, { status: 429 });
    }
    const body = await request.json();
    const wallet = normalizeWalletForChain(String(body.wallet || '').trim(), CHAIN);
    if (!wallet) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }
    const guard = await walletGuardResponse(wallet);
    if (guard) return guard;
    const authErr = await assertWalletAuth(wallet, CHAIN, readWalletAuthFromBody(body));
    if (authErr) return authErr;
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
    const nativeUsd = Number(feeQuote.nativeUsd || 150);
    const feeRaw = BigInt(feeFromGrossOctas(Number(amountRaw), depositFeeBps));
    const netRaw = amountRaw > feeRaw ? amountRaw - feeRaw : BigInt(0);

    const feeNative = rawToNative(CHAIN, feeRaw);
    const netNative = rawToNative(CHAIN, netRaw);

    if (netRaw <= BigInt(0)) {
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

    const claimed = await claimDepositTx({
      txHash: txSignature,
      chain: CHAIN,
      wallet,
      amountOctas: Number(amountRaw),
      amountNative,
      feeOctas: Number(feeRaw),
      netCreditedOctas: Number(netRaw),
    });

    if (!claimed) {
      const raw = await getHouseBalance(wallet, CHAIN, cfg.dbCurrency);
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        balanceRaw: raw.toString(),
        balanceNative: rawToNative(CHAIN, raw),
      });
    }

    const newBalance = await creditHouseBalance({
      wallet,
      chain: CHAIN,
      currency: cfg.dbCurrency,
      amountRaw: netRaw,
    });

    let platformFeeTx: string | null = null;
    let feeSweepPending = false;
    if (feeRaw > BigInt(0)) {
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

    await syncCashbackCap(wallet, CHAIN).catch((e) =>
      console.warn('[chains/solana/deposit] cashback cap sync', e),
    );

    const dealBoost = await getDepositDealBoost({
      wallet,
      chain: CHAIN,
      depositTxHash: txSignature,
      depositUsd: amountNative * nativeUsd,
    });

    const depositBonusResult = await accrueDepositAptcBonus({
      wallet,
      chain: CHAIN,
      depositTxHash: txSignature,
      depositNative: amountNative,
      nativeUsdPrice: nativeUsd,
      extraAptc: dealBoost.extraAptc,
    });

    await fetch(`${getSiteUrl()}/api/players/track`, {
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
    if (rateLimitRequest(request, { key: 'solana-withdraw', limit: 8, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many withdrawal requests. Please try again shortly.' }, { status: 429 });
    }
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

    const withdrawalGuard = await assertWithdrawalAllowed({
      wallet,
      chain: CHAIN,
      amountNative,
      usdEstimate,
    });
    if (!withdrawalGuard.ok) {
      return NextResponse.json({ error: withdrawalGuard.error }, { status: 403 });
    }

    const needsManual = withdrawalGuard.forceManual;

    if (needsManual) {
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
        message: pendingWithdrawalMessage(CHAIN, thresholdUsd, withdrawalGuard.reason),
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
