import { getResolvedFeeWalletAddress } from '@/lib/chains/registry';
import { feeFromGrossOctas } from '@/lib/server/platformFees';
import { sweepSolanaPlatformFee, transferSOLFromTreasury } from '@/lib/solana/backend-client';
import { nativeToRaw } from '@/lib/server/play/amounts';

const CHAIN = 'solana' as const;

export type ExecuteSolWithdrawalInput = {
  wallet: string;
  grossNative: number;
  withdrawFeeBps: number;
};

export type ExecuteSolWithdrawalResult = {
  feeNative: number;
  userPayoutNative: number;
  feeTxHash: string | null;
  userTxHash: string;
};

export async function executeSolWithdrawal(
  input: ExecuteSolWithdrawalInput,
): Promise<ExecuteSolWithdrawalResult> {
  const { wallet, grossNative, withdrawFeeBps } = input;

  if (!wallet?.trim() || !(grossNative > 0)) {
    throw new Error('Invalid withdrawal parameters');
  }

  const grossRaw = Number(nativeToRaw(CHAIN, grossNative));
  const feeRaw = feeFromGrossOctas(grossRaw, withdrawFeeBps);
  const payoutRaw = Math.max(0, grossRaw - feeRaw);

  const feeNative = feeRaw / 1e9;
  const userPayoutNative = payoutRaw / 1e9;

  const feeWallet = getResolvedFeeWalletAddress(CHAIN);
  if (!feeWallet?.trim()) {
    throw new Error('NEXT_PUBLIC_PLATFORM_FEE_WALLET_SOL is not configured');
  }

  let feeTxHash: string | null = null;
  if (feeNative > 0) {
    feeTxHash = await sweepSolanaPlatformFee(feeWallet.trim(), feeNative);
  }

  const userTxHash = await transferSOLFromTreasury(wallet.trim(), userPayoutNative);

  return { feeNative, userPayoutNative, feeTxHash, userTxHash };
}
