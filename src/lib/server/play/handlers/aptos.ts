import { NextResponse } from 'next/server';
import { getPlayChainConfig, getResolvedFeeWalletAddress, getResolvedTreasuryAddress } from '@/lib/chains/registry';
import { getSiteUrl } from '@/lib/siteMetadata';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  creditHouseBalance,
  debitHouseBalance,
  getHouseBalance,
} from '@/lib/server/houseBalance';
import { nativeToRaw, rawToNative } from '@/lib/server/play/amounts';
import {
  feeFromGrossOctas,
  getReferrerFeeShareBpsOfDeposit,
  getWithdrawFeeBps,
} from '@/lib/server/platformFees';
import { quoteDepositFees } from '@/lib/server/feeTiers';
import {
  getAptosForServer,
  transferAptFromTreasury,
} from '@/lib/server/aptTreasury';
import { executeAptWithdrawal } from '@/lib/server/executeAptWithdrawal';
import {
  estimateWithdrawalUsd,
  pendingWithdrawalMessage,
  queueWithdrawalRequest,
} from '@/lib/server/withdrawalQueue';
import {
  consumePendingStakeForCredit,
  recordPendingStake,
} from '@/lib/server/play/pendingStakes';
import { assertWithdrawalAllowed } from '@/lib/server/withdrawalGuards';
import { walletGuardResponse } from '@/lib/server/walletGuard';
import { isValidReferralCode, normalizeWalletForChain } from '@/lib/server/referrals';
import { syncCashbackCap } from '@/lib/server/cashback';
import {
  accrueDepositAptcBonus,
  getDepositBonusLockDays,
} from '@/lib/server/depositAptcBonus';
import { getDepositDealBoost } from '@/lib/server/promotions';
import {
  computeReferrerAptcReward,
  computeUnlockAt,
} from '@/lib/server/referralAptc';

const CHAIN = 'aptos' as const;

function limits() {
  const cfg = getPlayChainConfig(CHAIN)!;
  const minRaw = process.env[cfg.depositMinEnv || ''];
  const maxRaw = process.env[cfg.depositMaxEnv || ''];
  const minDeposit =
    minRaw != null && minRaw.trim() !== '' && Number.isFinite(parseFloat(minRaw))
      ? parseFloat(minRaw)
      : 1;
  const maxDeposit =
    maxRaw != null && maxRaw.trim() !== '' && Number.isFinite(parseFloat(maxRaw)) && parseFloat(maxRaw) > 0
      ? parseFloat(maxRaw)
      : null;
  return {
    minDeposit,
    maxDeposit,
    minWithdraw: parseFloat(process.env[cfg.withdrawMinEnv || ''] || '1'),
  };
}

function normalizeTreasuryAddress(addr: string): string {
  let hex = String(addr).trim().toLowerCase();
  hex = hex.startsWith('0x') ? hex.slice(2) : hex;
  hex = hex.padStart(64, '0');
  return `0x${hex}`;
}

async function verifyAptosDepositTx(
  transactionHash: string,
  treasuryAddress: string,
): Promise<boolean> {
  const aptos = getAptosForServer();
  const treasury = normalizeTreasuryAddress(treasuryAddress);
  const transaction = (await aptos.getTransactionByHash({ transactionHash })) as {
    success?: boolean;
    payload?: { type?: string; function?: string; arguments?: unknown[] };
  };
  if (!transaction.success) return false;

  const payload = transaction.payload as
    | { type?: string; function?: string; arguments?: unknown[] }
    | undefined;
  if (!payload || payload.type !== 'entry_function_payload') return false;

  if (
    payload.function !== '0x1::aptos_account::transfer' &&
    payload.function !== '0x1::coin::transfer'
  ) {
    return false;
  }

  const recipient = normalizeTreasuryAddress(String(payload.arguments?.[0] ?? ''));
  return recipient === treasury;
}

export async function aptosBalanceGET(wallet: string) {
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

export async function aptosBetPOST(request: Request) {
  try {
    const body = await request.json();
    const wallet = normalizeWalletForChain(String(body.wallet || '').trim(), CHAIN);
    if (!wallet) {
      return NextResponse.json({ error: 'Invalid Aptos wallet address' }, { status: 400 });
    }
    const guard = await walletGuardResponse(wallet);
    if (guard) return guard;
    const action = body.action === 'credit' ? 'credit' : 'debit';
    const amountNative = parseFloat(body.amountNative ?? body.amountApt);
    const game = typeof body.game === 'string' ? body.game.trim().slice(0, 32) : null;

    if (!Number.isFinite(amountNative) || amountNative <= 0) {
      return NextResponse.json({ error: 'wallet and positive amountNative required' }, { status: 400 });
    }

    const cfg = getPlayChainConfig(CHAIN)!;
    const amountRaw = nativeToRaw(CHAIN, amountNative);

    if (action === 'credit') {
      await consumePendingStakeForCredit({ wallet, chain: CHAIN, creditRaw: amountRaw });
      const newBalance = await creditHouseBalance({
        wallet,
        chain: CHAIN,
        currency: cfg.dbCurrency,
        amountRaw,
      });
      return NextResponse.json({
        success: true,
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
    await recordPendingStake({ wallet, chain: CHAIN, betRaw: amountRaw, game });

    return NextResponse.json({
      success: true,
      balanceRaw: newBalance.toString(),
      balanceNative: rawToNative(CHAIN, newBalance),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bet update failed';
    const status =
      msg.includes('Insufficient') || msg.includes('stake') || msg.includes('Payout')
        ? 400
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function aptosDepositPOST(request: Request) {
  try {
    const body = await request.json();
    const wallet = normalizeWalletForChain(
      String(body.wallet || body.userAddress || '').trim(),
      CHAIN,
    );
    if (!wallet) {
      return NextResponse.json({ error: 'Invalid Aptos wallet address' }, { status: 400 });
    }
    const guard = await walletGuardResponse(wallet);
    if (guard) return guard;

    const amountNative = parseFloat(body.amountNative ?? body.amount);
    const txHash = String(body.txSignature || body.transactionHash || '').trim();
    const referralCode =
      typeof body.referralCode === 'string' ? body.referralCode.trim().toUpperCase() : null;
    const { minDeposit, maxDeposit } = limits();

    if (!txHash || !Number.isFinite(amountNative) || amountNative <= 0) {
      return NextResponse.json(
        { error: 'wallet, positive amountNative, and txSignature required' },
        { status: 400 },
      );
    }

    if (amountNative < minDeposit) {
      return NextResponse.json({ error: `Minimum deposit is ${minDeposit} APT.` }, { status: 400 });
    }
    if (maxDeposit != null && amountNative > maxDeposit) {
      return NextResponse.json({ error: `Maximum deposit is ${maxDeposit} APT.` }, { status: 400 });
    }

    const treasuryAddress = getResolvedTreasuryAddress(CHAIN);
    if (!treasuryAddress) {
      return NextResponse.json({ error: 'Aptos treasury not configured' }, { status: 503 });
    }

    const cfg = getPlayChainConfig(CHAIN)!;
    const amountRaw = nativeToRaw(CHAIN, amountNative);
    const feeQuote = await quoteDepositFees(CHAIN, amountNative);
    const depositFeeBps = feeQuote.depositFeeBps;
    const nativeUsd = Number(feeQuote.nativeUsd || 0);
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

    const db = getSupabaseAdmin();
    if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { data: existing } = await db
      .from('deposits_log')
      .select('id, platform_fee_tx_hash')
      .eq('user_tx_hash', txHash)
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
        netCreditedOctas: String(netRaw),
        platformFeeBps: depositFeeBps,
        platformFeeNative: feeNative,
        platformFeeTxHash: existing.platform_fee_tx_hash ?? null,
      });
    }

    const ok = await verifyAptosDepositTx(txHash, treasuryAddress);
    if (!ok) {
      return NextResponse.json(
        { error: 'Could not verify APT transfer to treasury. Wait a few seconds and retry.' },
        { status: 400 },
      );
    }

    const newBalance = await creditHouseBalance({
      wallet,
      chain: CHAIN,
      currency: cfg.dbCurrency,
      amountRaw: netRaw,
    });

    const depositOctas = Number(amountRaw);
    const feeOctas = Number(feeRaw);
    const referrerShareBps = getReferrerFeeShareBpsOfDeposit(depositFeeBps);
    let pendingReferral: {
      referrerWallet: string;
      refereeWallet: string;
      code: string;
    } | null = null;
    let referrerRewardOctas = 0;
    let referrerRewardAptc = 0;

    const { data: existingReferral } = await db
      .from('referrals')
      .select('referrer_wallet, referee_wallet, code, is_valid')
      .eq('referee_wallet', wallet)
      .maybeSingle();

    if (existingReferral && !existingReferral.is_valid) {
      pendingReferral = {
        referrerWallet: existingReferral.referrer_wallet,
        refereeWallet: existingReferral.referee_wallet,
        code: existingReferral.code,
      };
    } else if (
      !existingReferral &&
      referralCode &&
      isValidReferralCode(referralCode)
    ) {
      const { data: codeRow } = await db
        .from('referral_codes')
        .select('wallet, code')
        .eq('code', referralCode)
        .maybeSingle();
      if (codeRow && codeRow.wallet !== wallet) {
        const { data: inserted, error: insErr } = await db
          .from('referrals')
          .insert({
            referrer_wallet: codeRow.wallet,
            referee_wallet: wallet,
            code: referralCode,
            source: 'deposit_inline',
          })
          .select('referrer_wallet, referee_wallet, code')
          .single();
        if (!insErr && inserted) {
          pendingReferral = {
            referrerWallet: inserted.referrer_wallet,
            refereeWallet: inserted.referee_wallet,
            code: inserted.code,
          };
        }
      }
    }

    if (pendingReferral) {
      referrerRewardOctas = Math.min(
        feeOctas,
        Math.floor((depositOctas * referrerShareBps) / 10_000),
      );
      referrerRewardAptc = await computeReferrerAptcReward(amountNative, nativeUsd);
    }

    let platformFeeTx: string | null = null;
    const feeWallet = getResolvedFeeWalletAddress(CHAIN);
    if (feeOctas > 0 && feeWallet?.trim()) {
      try {
        platformFeeTx = await transferAptFromTreasury(feeWallet.trim(), feeOctas);
      } catch (e) {
        console.error('[chains/aptos/deposit] platform fee sweep failed:', e);
      }
    }

    await db.from('deposits_log').insert({
      chain: CHAIN,
      wallet,
      amount_octas: depositOctas,
      amount_native: amountNative,
      fee_octas: feeOctas,
      net_credited_octas: Number(netRaw),
      user_tx_hash: txHash,
      platform_fee_tx_hash: platformFeeTx,
    });

    await syncCashbackCap(wallet, CHAIN).catch((e) =>
      console.warn('[chains/aptos/deposit] cashback cap sync', e),
    );

    const dealBoost = await getDepositDealBoost({
      wallet,
      chain: CHAIN,
      depositTxHash: txHash,
      depositUsd: amountNative * nativeUsd,
    });

    const depositBonusResult = await accrueDepositAptcBonus({
      wallet,
      chain: CHAIN,
      depositTxHash: txHash,
      depositNative: amountNative,
      nativeUsdPrice: nativeUsd,
      extraAptc: dealBoost.extraAptc,
    });

    if (pendingReferral) {
      await db
        .from('referrals')
        .update({
          is_valid: true,
          first_deposit_at: new Date().toISOString(),
          first_deposit_octas: depositOctas,
          first_deposit_tx_hash: txHash,
          referrer_reward_octas: 0,
          referrer_reward_aptc: referrerRewardAptc,
          reward_status: referrerRewardAptc > 0 ? 'locked' : 'none',
          unlock_at: referrerRewardAptc > 0 ? computeUnlockAt() : null,
        })
        .eq('referee_wallet', pendingReferral.refereeWallet)
        .eq('is_valid', false);

      await db.from('referral_rewards_log').upsert(
        {
          referrer_wallet: pendingReferral.referrerWallet,
          referee_wallet: pendingReferral.refereeWallet,
          code: pendingReferral.code,
          deposit_tx_hash: txHash,
          deposit_octas: depositOctas,
          fee_octas: feeOctas,
          reward_octas: referrerRewardOctas,
          reward_aptc: referrerRewardAptc,
          reward_currency: 'APTC',
          status: referrerRewardAptc > 0 ? 'locked' : 'pending',
          payout_tx_hash: null,
          error: null,
        },
        { onConflict: 'deposit_tx_hash', ignoreDuplicates: false },
      );
    }

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
      netCreditedOctas: String(netRaw),
      platformFeeBps: depositFeeBps,
      platformFeeNative: feeNative,
      platformFeeApt: feeNative,
      platformFeeTxHash: platformFeeTx,
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
    console.error('[chains/aptos/deposit]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Deposit failed' },
      { status: 500 },
    );
  }
}

export async function aptosWithdrawPOST(request: Request) {
  try {
    const body = await request.json();
    const wallet = normalizeWalletForChain(String(body.wallet || body.userAddress || '').trim(), CHAIN);
    if (!wallet) {
      return NextResponse.json({ error: 'Invalid Aptos wallet address' }, { status: 400 });
    }
    const guard = await walletGuardResponse(wallet);
    if (guard) return guard;

    const amountNative = parseFloat(body.amountNative ?? body.amount);
    const { minWithdraw } = limits();

    if (!Number.isFinite(amountNative) || amountNative < minWithdraw) {
      return NextResponse.json(
        { error: `Invalid amount (min ${minWithdraw} APT)` },
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
    const grossOctas = Number(amountRaw);
    const feeRaw = feeFromGrossOctas(grossOctas, withdrawFeeBps);
    const userPayoutRaw = Math.max(0, grossOctas - feeRaw);
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
        grossOctas,
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

    const result = await executeAptWithdrawal({
      userAddress: wallet,
      grossOctas,
      withdrawFeeBps,
      chainId: CHAIN,
    });

    const db = getSupabaseAdmin();
    if (db) {
      await db.from('withdrawal_requests').insert({
        chain: CHAIN,
        wallet,
        gross_octas: grossOctas,
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
      transactionHash: result.userTxHash,
      feeTxHash: result.feeTxHash,
      balanceRaw: newBalance.toString(),
      balanceNative: rawToNative(CHAIN, newBalance),
      platformFeeNative: rawToNative(CHAIN, result.feeOctas),
      netAfterFeeNative: rawToNative(CHAIN, result.userPayoutOctas),
    });
  } catch (e) {
    console.error('[chains/aptos/withdraw]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Withdrawal failed' },
      { status: 500 },
    );
  }
}
