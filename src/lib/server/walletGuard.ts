import { NextResponse } from 'next/server';
import { assertWalletCanPlay } from '@/lib/bans/walletBan';

export async function walletGuardResponse(wallet: string): Promise<NextResponse | null> {
  const msg = await assertWalletCanPlay(wallet);
  if (msg) return NextResponse.json({ error: msg }, { status: 403 });
  return null;
}
