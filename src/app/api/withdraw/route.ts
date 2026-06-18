import { NextRequest } from 'next/server';
import { aptosWithdrawPOST } from '@/lib/server/play/handlers/aptos';

/** Legacy Aptos withdraw endpoint — delegates to unified /api/chains/aptos/withdraw handler. */
export async function POST(request: NextRequest) {
  return aptosWithdrawPOST(request);
}

export async function GET() {
  try {
    const { getTreasurySignerFromEnv, getAptBalanceNative } = await import('@/lib/server/aptTreasury');
    const signer = getTreasurySignerFromEnv();
    const addr = signer.accountAddress;
    const balanceNative = await getAptBalanceNative(addr.toString());
    const balanceOctas = BigInt(Math.round(balanceNative * 1e8));

    return Response.json({
      treasuryAddress: addr.toString(),
      balanceApt: balanceNative,
      balanceOctas: balanceOctas.toString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
