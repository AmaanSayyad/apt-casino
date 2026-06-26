import { NextRequest, NextResponse } from 'next/server';
import type { ChainId } from '@/lib/chains/registry';
import { claimDepositAptcBonus } from '@/lib/server/depositAptcBonus';
import { normalizeWalletForChain, resolveReferralChain } from '@/lib/server/referrals';
import { walletGuardResponse } from '@/lib/server/walletGuard';
import { assertWalletAuth, readWalletAuthFromBody, walletAuthRateLimitResponse } from '@/lib/server/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { wallet?: string; chain?: string; solanaPayoutWallet?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const chain: ChainId = resolveReferralChain(body.wallet, body.chain);
  const wallet = normalizeWalletForChain(body.wallet, chain);
  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  const rateErr = walletAuthRateLimitResponse(req, wallet);
  if (rateErr) return rateErr;

  const guard = await walletGuardResponse(wallet);
  if (guard) return guard;

  const authErr = await assertWalletAuth(wallet, chain, readWalletAuthFromBody(body), {
    consume: true,
    purpose: 'deposit_bonus_claim',
  });
  if (authErr) return authErr;

  const result = await claimDepositAptcBonus(wallet, chain);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    claimedAptc: result.claimedAptc,
    claimTxHash: result.claimTxHash,
    payoutWallet: result.payoutWallet,
  });
}
