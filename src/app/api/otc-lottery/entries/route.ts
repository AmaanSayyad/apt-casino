import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { formatOtcEntry } from '@/lib/server/otcLottery';
import { normalizeSolWallet } from '@/lib/server/otcLottery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet query required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const normalized = normalizeSolWallet(wallet);

  const { data, error } = await supabase
    .from('otc_lottery_entries')
    .select('*')
    .or(`sol_sender_wallet.eq.${normalized},aptc_receive_wallet.eq.${normalized}`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    entries: (data || []).map(formatOtcEntry),
  });
}
