import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

/** List recent withdrawal requests for a wallet (pending + completed). */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ requests: [], note: 'Supabase admin not configured' });
  }

  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet query param required' }, { status: 400 });
  }

  const trimmed = wallet.trim();
  const normalized = trimmed.startsWith('0x')
    ? `0x${trimmed.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`
    : trimmed;

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('id, chain, status, gross_apt, usd_estimate, created_at, processed_at, user_tx_hash')
    .eq('wallet', normalized)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
