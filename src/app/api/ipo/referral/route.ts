import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { attributeIpoReferrer, isValidSolanaWallet } from '@/lib/server/ipo/affiliate';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  let body: { wallet?: string; referrerWallet?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const wallet = String(body.wallet || '').trim();
  const referrerWallet = String(body.referrerWallet || '').trim();

  if (!isValidSolanaWallet(wallet) || !isValidSolanaWallet(referrerWallet)) {
    return NextResponse.json({ error: 'Valid wallet and referrerWallet required' }, { status: 400 });
  }
  if (wallet === referrerWallet) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
  }

  await attributeIpoReferrer(db, wallet, referrerWallet);

  return NextResponse.json({ success: true });
}
