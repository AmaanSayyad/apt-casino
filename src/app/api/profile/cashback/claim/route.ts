import { NextRequest, NextResponse } from 'next/server';
import { claimCashback } from '@/lib/server/cashback';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { walletGuardResponse } from '@/lib/server/walletGuard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { wallet?: string; chain?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const chain = (body.chain || 'solana').toLowerCase() === 'solana' ? 'solana' : 'aptos';
  if (chain !== 'solana') {
    return NextResponse.json({ error: 'Cashback is only available for Solana play' }, { status: 400 });
  }

  const wallet = normalizeWalletForChain(body.wallet, chain);
  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  const guard = await walletGuardResponse(wallet);
  if (guard) return guard;

  const result = await claimCashback(wallet, chain);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    creditedNative: result.creditedNative,
    balanceNative: result.balanceNative,
  });
}
