import { getResolvedFeeWalletAddress } from '@/lib/chains';
import type { ChainId } from '@/lib/chains';
import { feeFromGrossOctas } from '@/lib/server/platformFees';
import { transferAptFromTreasury } from '@/lib/server/aptTreasury';

export type ExecuteAptWithdrawalInput = {
  userAddress: string;
  grossOctas: number;
  withdrawFeeBps: number;
  chainId?: ChainId;
};

export type ExecuteAptWithdrawalResult = {
  feeOctas: number;
  userPayoutOctas: number;
  feeTxHash: string | null;
  userTxHash: string;
};

function normalizeUserAddress(userAddress: string): string {
  if (typeof userAddress === 'object') {
    throw new Error('Invalid userAddress');
  }
  let s = String(userAddress).trim();
  if (!s.startsWith('0x')) s = `0x${s}`;
  let hex = s.toLowerCase().slice(2);
  hex = hex.padStart(64, '0');
  return `0x${hex}`;
}

export async function executeAptWithdrawal(
  input: ExecuteAptWithdrawalInput,
): Promise<ExecuteAptWithdrawalResult> {
  const { grossOctas, withdrawFeeBps } = input;
  const formattedUser = normalizeUserAddress(input.userAddress);
  const chainId = input.chainId || 'aptos';

  if (!Number.isFinite(grossOctas) || grossOctas <= 0) {
    throw new Error('Invalid withdrawal amount');
  }

  const feeWallet =
    getResolvedFeeWalletAddress(chainId) ||
    process.env.NEXT_PUBLIC_PLATFORM_FEE_WALLET_APT ||
    process.env.NEXT_PUBLIC_FEE_RECIPIENT;

  if (!feeWallet?.trim()) {
    throw new Error(
      'Platform fee wallet not configured (set NEXT_PUBLIC_PLATFORM_FEE_WALLET_APT or NEXT_PUBLIC_FEE_RECIPIENT)',
    );
  }

  const feeOctas = feeFromGrossOctas(grossOctas, withdrawFeeBps);
  const userPayoutOctas = Math.max(0, grossOctas - feeOctas);

  let feeTxHash: string | null = null;
  if (feeOctas > 0) {
    feeTxHash = await transferAptFromTreasury(feeWallet.trim(), feeOctas);
  }

  const userTxHash = await transferAptFromTreasury(formattedUser, userPayoutOctas);

  return { feeOctas, userPayoutOctas, feeTxHash, userTxHash };
}
