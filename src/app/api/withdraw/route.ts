import { NextResponse } from 'next/server';
import {
  getWithdrawFeeBps,
  feeFromGrossOctas,
} from '@/lib/server/platformFees';
import { aptToOctas, octasToApt, getTreasurySignerFromEnv } from '@/lib/server/aptTreasury';
import { executeAptWithdrawal } from '@/lib/server/executeAptWithdrawal';
import {
  estimateWithdrawalUsd,
  pendingWithdrawalMessage,
  queueWithdrawalRequest,
  requiresManualWithdrawalApproval,
} from '@/lib/server/withdrawalQueue';
import { assertWithdrawalAllowed } from '@/lib/server/withdrawalGuards';
import { walletGuardResponse } from '@/lib/server/walletGuard';

function normalizeAptAddress(userAddress: unknown): string {
  if (typeof userAddress === 'object' && userAddress !== null && 'data' in (userAddress as object)) {
    const bytes = Object.values((userAddress as { data: Record<string, number> }).data);
    return `0x${bytes.map((b) => Number(b).toString(16).padStart(2, '0')).join('')}`;
  }
  if (typeof userAddress !== 'string') {
    throw new Error('Invalid userAddress format');
  }
  let s = userAddress.startsWith('0x') ? userAddress : `0x${userAddress}`;
  let hex = s.toLowerCase().replace(/^0x/, '');
  hex = hex.padStart(64, '0');
  return `0x${hex}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userAddress, amount } = body as { userAddress?: string; amount?: number };

    if (!userAddress || amount == null || !(Number(amount) > 0)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const formattedUserAddress = normalizeAptAddress(userAddress);
    const guard = await walletGuardResponse(formattedUserAddress);
    if (guard) return guard;

    const grossOctas = aptToOctas(Number(amount));
    const withdrawFeeBps = getWithdrawFeeBps();
    const feeOctas = feeFromGrossOctas(grossOctas, withdrawFeeBps);
    const userPayoutOctas = Math.max(0, grossOctas - feeOctas);

    const usdEstimate = await estimateWithdrawalUsd('aptos', Number(amount));

    const withdrawalGuard = await assertWithdrawalAllowed({
      wallet: formattedUserAddress,
      chain: 'aptos',
      amountNative: Number(amount),
      usdEstimate,
    });
    if (!withdrawalGuard.ok) {
      return NextResponse.json({ error: withdrawalGuard.error }, { status: 403 });
    }

    const needsManual =
      requiresManualWithdrawalApproval(usdEstimate) || withdrawalGuard.forceManual;

    if (needsManual) {
      const { requestId, thresholdUsd } = await queueWithdrawalRequest({
        chain: 'aptos',
        wallet: formattedUserAddress,
        grossOctas,
        grossNative: Number(amount),
        usdEstimate,
        feeOctas,
        userPayoutOctas,
      });

      return NextResponse.json({
        success: true,
        pendingApproval: true,
        requestId,
        message: pendingWithdrawalMessage(thresholdUsd, withdrawalGuard.reason),
        grossApt: Number(amount),
        estimatedUsd: usdEstimate,
        platformFeeApt: octasToApt(feeOctas),
        netAfterFeeApt: octasToApt(userPayoutOctas),
      });
    }

    const result = await executeAptWithdrawal({
      userAddress: formattedUserAddress,
      grossOctas,
      withdrawFeeBps,
    });

    const signer = getTreasurySignerFromEnv();

    return NextResponse.json({
      success: true,
      amountRequested: amount,
      fee: octasToApt(result.feeOctas),
      userPayout: octasToApt(result.userPayoutOctas),
      feeTxHash: result.feeTxHash,
      transactionHash: result.userTxHash,
      userTxHash: result.userTxHash,
      userAddress: formattedUserAddress,
      treasuryAddress: signer.accountAddress.toString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Withdraw API error:', error);
    return NextResponse.json({ error: `Withdrawal failed: ${message}` }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { getTreasurySignerFromEnv, getAptBalanceNative } = await import('@/lib/server/aptTreasury');
    const signer = getTreasurySignerFromEnv();
    const addr = signer.accountAddress;
    const balanceNative = await getAptBalanceNative(addr.toString());
    const balanceOctas = BigInt(Math.round(balanceNative * 1e8));

    return NextResponse.json({
      treasuryAddress: addr.toString(),
      balance: balanceNative,
      balanceOctas: balanceOctas.toString(),
      status: balanceNative > 0 ? 'active' : 'empty',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to check treasury balance: ${message}` }, { status: 500 });
  }
}
