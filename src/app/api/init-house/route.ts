import { NextRequest, NextResponse } from 'next/server';
import { Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';
import { getAptosForServer, normalizeEd25519PrivateKeyHex } from '@/lib/server/aptTreasury';

const aptos = getAptosForServer();

export async function POST(_request: NextRequest) {
  try {
    const rawPk = process.env.TREASURY_PRIVATE_KEY;
    if (!rawPk) {
      return NextResponse.json({ error: 'TREASURY_PRIVATE_KEY missing' }, { status: 500 });
    }
    const pkHex = normalizeEd25519PrivateKeyHex(rawPk);
    const privateKey = new Ed25519PrivateKey(pkHex);
    const admin = Account.fromPrivateKey({ privateKey });

    // Check if House exists
    const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS!;
    try {
      const res = await aptos.getAccountResource({
        accountAddress: moduleAddr,
        resourceType: `${moduleAddr}::user_balance::House`,
      });
      return NextResponse.json({ message: 'House already initialized', admin: (res as any).data?.admin });
    } catch { }

    const tx = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${moduleAddr}::user_balance::init`,
        functionArguments: [],
      },
      options: {
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      },
    });

    const committed = await aptos.signAndSubmitTransaction({ signer: admin, transaction: tx });
    await aptos.waitForTransaction({ transactionHash: committed.hash });

    return NextResponse.json({ success: true, transactionHash: committed.hash });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Init failed' }, { status: 500 });
  }
}


