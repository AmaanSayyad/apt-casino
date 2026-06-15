import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  const userAddress = req.nextUrl.searchParams.get('userAddress');
  if (!userAddress) {
    return NextResponse.json({ error: 'userAddress is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('staking_positions')
    .select(
      'id, pool_key, lock_days, apy_bps, amount, start_at, unlock_at, status, reward_amount, total_payout, claimed_at, tx_hash',
    )
    .eq('user_address', userAddress)
    .not('tx_hash', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: 'Failed to load positions.' }, { status: 500 });
  }

  return NextResponse.json({ positions: data ?? [] });
}
