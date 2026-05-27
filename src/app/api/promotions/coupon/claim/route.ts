import { NextRequest, NextResponse } from 'next/server';
import type { ChainId } from '@/lib/chains/registry';
import {
  claimCouponPromotion,
  getClientIp,
} from '@/lib/server/promotions';

export const dynamic = 'force-dynamic';

type Body = {
  wallet?: string;
  chain?: ChainId;
  code?: string;
  deviceFingerprint?: string;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const wallet = String(body.wallet || '').trim();
  const code = String(body.code || '').trim();
  const chain = body.chain === 'aptos' ? 'aptos' : 'solana';
  if (!wallet || !code) {
    return NextResponse.json({ error: 'wallet and code are required' }, { status: 400 });
  }

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
