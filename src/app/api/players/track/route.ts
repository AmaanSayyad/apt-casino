import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

function normalizeWallet(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let hex = input.trim().toLowerCase();
  if (!hex) return null;
  hex = hex.replace(/^0x/, '');
  if (!/^[0-9a-f]+$/.test(hex)) return null;
  hex = hex.padStart(64, '0');
  return `0x${hex}`;
}

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

  const wallet = normalizeWallet(body.wallet);
  if (!wallet) {
    return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
  }

  const chain = (body.chain && typeof body.chain === 'string' ? body.chain : 'aptos').toLowerCase();
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
