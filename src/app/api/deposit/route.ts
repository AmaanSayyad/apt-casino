import { NextRequest, NextResponse } from 'next/server';
import { TREASURY_ADDRESS as FRONT_TREASURY_ADDRESS } from '@/lib/aptos';
import { getResolvedFeeWalletAddress } from '@/lib/chains';
import { getAptosForServer, transferAptFromTreasury, aptToOctas, octasToApt } from '@/lib/server/aptTreasury';
import {
  feeFromGrossOctas,
  getReferrerFeeShareBpsOfDeposit,
} from '@/lib/server/platformFees';
import { quoteDepositFees } from '@/lib/server/feeTiers';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { isValidReferralCode } from '@/lib/server/referrals';
import {
  computeReferrerAptcReward,
  computeUnlockAt,
} from '@/lib/server/referralAptc';
import {
  accrueDepositAptcBonus,
  getDepositBonusLockDays,
} from '@/lib/server/depositAptcBonus';

function normalizeWallet(input: string): string | null {
  if (!input) return null;
  let hex = String(input).trim().toLowerCase();
  hex = hex.replace(/^0x/, '');
  if (!/^[0-9a-f]+$/.test(hex)) return null;
  hex = hex.padStart(64, '0');
  return `0x${hex}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, amount, transactionHash, referralCode } = body as {
      userAddress?: string;
      amount?: number | string;
      transactionHash?: string;
      referralCode?: string | null;
    };

    if (!userAddress || !amount || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, amount, transactionHash' },
        { status: 400 },
      );
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0 || !Number.isFinite(depositAmount)) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }
    if (depositAmount < 10) {
      return NextResponse.json({ error: 'Minimum deposit is 10 APT.' }, { status: 400 });
    }

    const aptos = getAptosForServer();

    const normalize = (addr: string) => {
      try {
        if (!addr) return '';
        let hex = String(addr).toLowerCase();
        hex = hex.startsWith('0x') ? hex.slice(2) : hex;
        hex = hex.padStart(64, '0');
        return `0x${hex}`;
      } catch {
        return '';
      }
    };

    const treasuryEnv =
      process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
      process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS ||
      FRONT_TREASURY_ADDRESS;
    const treasuryAddress = normalize(treasuryEnv || '');

    let isValidTransfer = false;
    try {
      const transaction = await aptos.getTransactionByHash({
        transactionHash,
      });

      if (!transaction.success) {
        return NextResponse.json({ error: 'Transaction failed or not found' }, { status: 400 });
      }

      if (transaction.payload && transaction.payload.type === 'entry_function_payload') {
        const payload = transaction.payload as {
          function?: string;
          arguments?: unknown[];
        };
        if (
          payload.function === '0x1::aptos_account::transfer' ||
          payload.function === '0x1::coin::transfer'
        ) {
          const recipientRaw = payload.arguments?.[0];
          const recipient = normalize(String(recipientRaw));
          if (recipient === treasuryAddress) {
            isValidTransfer = true;
          }
        }
      }

      if (!isValidTransfer) {
        return NextResponse.json(
          { error: 'Invalid transaction: not a transfer to treasury' },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 400 });
    }

    const depositOctas = aptToOctas(depositAmount);
    const feeQuote = await quoteDepositFees('aptos', depositAmount);
    const aptUsd = feeQuote.nativeUsd;
    const depositFeeBps = feeQuote.depositFeeBps;
    const feeOctas = feeFromGrossOctas(depositOctas, depositFeeBps);
    const netOctas = Math.max(0, depositOctas - feeOctas);
    const feeWallet = getResolvedFeeWalletAddress('aptos');

    const wallet = normalizeWallet(String(userAddress)) || String(userAddress);
    const supabase = getSupabaseAdmin();

    // -------- Referral resolution (BEFORE fee sweep so we can split the fee) -----------
    // A referral that's still pending validation can either already exist (created by
    // /api/referrals/attribute on wallet connect) OR can be passed inline via
    // `referralCode` on the deposit body — the latter rescues a small race-condition
    // where a freshly-connected wallet deposits before the attribute call lands.
    let pendingReferral: {
      referrerWallet: string;
      refereeWallet: string;
      code: string;
    } | null = null;
    let referrerRewardOctas = 0;
    let referrerRewardAptc = 0;
    const referrerShareBps = getReferrerFeeShareBpsOfDeposit(depositFeeBps);

    if (supabase) {
      // 1) Already attributed?
      const { data: existing } = await supabase
        .from('referrals')
        .select('referrer_wallet, referee_wallet, code, is_valid')
        .eq('referee_wallet', wallet)
        .maybeSingle();

      if (existing && !existing.is_valid) {
        pendingReferral = {
          referrerWallet: existing.referrer_wallet,
          refereeWallet: existing.referee_wallet,
          code: existing.code,
        };
      } else if (
        !existing &&
        typeof referralCode === 'string' &&
        isValidReferralCode(referralCode.trim().toUpperCase())
      ) {
        // 2) Backfill from inline code (race-safe path).
        const code = referralCode.trim().toUpperCase();
        const { data: codeRow } = await supabase
          .from('referral_codes')
          .select('wallet, code')
          .eq('code', code)
          .maybeSingle();

        if (codeRow && codeRow.wallet !== wallet) {
          const { data: inserted, error: insErr } = await supabase
            .from('referrals')
            .insert({
              referrer_wallet: codeRow.wallet,
              referee_wallet: wallet,
              code,
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
      }
    }

    // Referrer is paid in APTC (locked), not from the APT fee sweep.
    const netPlatformFeeOctas = feeOctas;

    // -------- Platform fee sweep (reduced by referrer reward, if any) -----------------
    let platformFeeTx: string | null = null;
    if (netPlatformFeeOctas > 0) {
      if (!feeWallet?.trim()) {
        return NextResponse.json(
          {
            error:
              'Configure NEXT_PUBLIC_PLATFORM_FEE_WALLET_APT (or NEXT_PUBLIC_FEE_RECIPIENT) for deposit fee collection.',
          },
          { status: 500 },
        );
      }
      try {
        platformFeeTx = await transferAptFromTreasury(feeWallet.trim(), netPlatformFeeOctas);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.error('Platform fee transfer failed:', e);
        return NextResponse.json(
          {
            error:
              'Deposit verified on-chain but moving the platform fee from treasury failed. Check treasury gas and balance.',
            detail: msg,
          },
          { status: 500 },
        );
      }
    }

    // -------- Referrer APTC accrual (locked; unlock via cliff or referee volume) -----
    let referrerPayoutTx: string | null = null;
    let referrerPayoutStatus: 'locked' | 'unlocked' | 'paid' | 'pending' | 'failed' | 'none' = 'none';
    let referrerPayoutError: string | null = null;

    if (pendingReferral) {
      referrerRewardAptc = await computeReferrerAptcReward(depositAmount, aptUsd);
      referrerPayoutStatus = referrerRewardAptc > 0 ? 'locked' : 'none';
    }

    // -------- Persist deposit + referral state + reward log ---------------------------
    let depositBonusResult: { rewardAptc: number; unlockAt: string } | null = null;
    if (supabase) {
      const { error: logErr } = await supabase
        .from('deposits_log')
        .upsert(
          {
            chain: 'aptos',
            wallet,
            amount_octas: depositOctas,
            amount_native: depositAmount,
            fee_octas: feeOctas,
            net_credited_octas: netOctas,
            user_tx_hash: transactionHash,
            platform_fee_tx_hash: platformFeeTx,
          },
          { onConflict: 'user_tx_hash', ignoreDuplicates: true },
        );
      if (logErr) {
        console.warn('deposits_log write failed:', logErr.message);
      }

      depositBonusResult = await accrueDepositAptcBonus({
        wallet,
        chain: 'aptos',
        depositTxHash: transactionHash,
        depositNative: depositAmount,
        nativeUsdPrice: aptUsd,
      });

      // Track the player too so unique counters move on first deposit.
      await supabase
        .from('tracked_wallets')
        .upsert(
          { wallet, chain: 'aptos', last_seen_at: new Date().toISOString() },
          { onConflict: 'wallet', ignoreDuplicates: false },
        );

      if (pendingReferral) {
        // Validate the referral once the first deposit landed — regardless of
        // whether the reward transfer succeeded (admin can retry payout).
        const { error: refUpdErr } = await supabase
          .from('referrals')
          .update({
            is_valid: true,
            first_deposit_at: new Date().toISOString(),
            first_deposit_octas: depositOctas,
            first_deposit_tx_hash: transactionHash,
            referrer_reward_octas: 0,
            referrer_reward_aptc: referrerRewardAptc,
            reward_status: referrerRewardAptc > 0 ? 'locked' : 'none',
            unlock_at: referrerRewardAptc > 0 ? computeUnlockAt() : null,
          })
          .eq('referee_wallet', pendingReferral.refereeWallet)
          .eq('is_valid', false);
        if (refUpdErr) {
          console.warn('referrals validate failed:', refUpdErr.message);
        }

        await supabase
          .from('referral_rewards_log')
          .upsert(
            {
              referrer_wallet: pendingReferral.referrerWallet,
              referee_wallet: pendingReferral.refereeWallet,
              code: pendingReferral.code,
              deposit_tx_hash: transactionHash,
              deposit_octas: depositOctas,
              fee_octas: feeOctas,
              reward_octas: referrerRewardOctas,
              reward_aptc: referrerRewardAptc,
              reward_currency: 'APTC',
              status: referrerRewardAptc > 0 ? 'locked' : 'pending',
              payout_tx_hash: referrerPayoutTx,
              error: referrerPayoutError,
            },
            { onConflict: 'deposit_tx_hash', ignoreDuplicates: false },
          );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        'Transfer verified. Platform fee collected from treasury; credit the net amount to the player balance.',
      userAddress,
      amount: depositAmount,
      grossApt: depositAmount,
      grossOctas: String(depositOctas),
      platformFeeBps: depositFeeBps,
      platformFeeApt: octasToApt(netPlatformFeeOctas),
      platformFeeOctas: String(netPlatformFeeOctas),
      totalFeeOctas: String(feeOctas),
      netCreditedApt: octasToApt(netOctas),
      netCreditedOctas: String(netOctas),
      userDepositTxHash: transactionHash,
      platformFeeTxHash: platformFeeTx,
      referral: pendingReferral
        ? {
            status: referrerPayoutStatus, // 'paid' | 'pending' | 'failed' | 'none'
            referrerWallet: pendingReferral.referrerWallet,
            code: pendingReferral.code,
            shareBps: referrerShareBps,
            rewardApt: octasToApt(referrerRewardOctas),
            rewardOctas: String(referrerRewardOctas),
            payoutTxHash: referrerPayoutTx,
            error: referrerPayoutError,
          }
        : null,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('DEPOSIT FAILED:', error);
    return NextResponse.json({ error: `Failed to process deposit: ${message}` }, { status: 500 });
  }
}
