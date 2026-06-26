import { NextRequest, NextResponse } from 'next/server';
import type { ChainId } from '@/lib/chains/registry';
import {
  claimCouponPromotion,
  getClientIp,
} from '@/lib/server/promotions';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { walletGuardResponse } from '@/lib/server/walletGuard';
import { assertWalletAuth, readWalletAuthFromBody, walletAuthRateLimitResponse } from '@/lib/server/walletAuth';
import { rateLimitRequest } from '@/lib/server/requestRateLimit';

export const dynamic = 'force-dynamic';

type Body = {
  wallet?: string;
  chain?: ChainId;
  code?: string;
  deviceFingerprint?: string;
  walletAuth?: unknown;
};

export async function POST(request: NextRequest) {
  if (rateLimitRequest(request, { key: 'promo-coupon-claim', limit: 12, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const chain = body.chain === 'aptos' ? 'aptos' : 'solana';
  const wallet = normalizeWalletForChain(String(body.wallet || '').trim(), chain);
  const code = String(body.code || '').trim();
  if (!wallet || !code) {
    return NextResponse.json({ error: 'wallet and code are required' }, { status: 400 });
  }

  const rateErr = walletAuthRateLimitResponse(request, wallet);
  if (rateErr) return rateErr;

  const guard = await walletGuardResponse(wallet);
  if (guard) return guard;

  const authErr = await assertWalletAuth(wallet, chain, readWalletAuthFromBody(body), {
    consume: true,
    purpose: 'coupon_claim',
  });
  if (authErr) return authErr;

  const result = await claimCouponPromotion({
    wallet,
    chain,
    code,
    ipAddress: getClientIp(request.headers),
    deviceFingerprint: body.deviceFingerprint?.trim(),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
