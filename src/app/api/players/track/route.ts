import { NextRequest, NextResponse } from 'next/server';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ tracked: false, reason: 'Supabase admin not configured' });
  }

  let body: { wallet?: string; chain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const chain = (body.chain && typeof body.chain === 'string' ? body.chain : 'aptos').toLowerCase();
  const wallet = normalizeWalletForChain(body.wallet, chain);
  if (!wallet) {
    return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('tracked_wallets')
    .upsert(
      { wallet, chain, last_seen_at: now },
      { onConflict: 'wallet', ignoreDuplicates: false },
    );

  if (error) {
    console.error('tracked_wallets upsert:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tracked: true });
}
