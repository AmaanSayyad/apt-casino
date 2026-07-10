import { NextResponse } from 'next/server';
import { enrichStakingPool, isUserFacingStakingPool } from '@/lib/staking/pools';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from('staking_pools')
    .select('pool_key, lock_days, apy_bps, min_stake, max_stake, is_active')
    .eq('is_active', true)
    .order('lock_days', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load staking pools.' }, { status: 500 });
  }

  // Hide IPO_30D (auto-stake only) — it was showing as a second "30 Days" card
  const pools = (data ?? [])
    .filter((row) => isUserFacingStakingPool(row.pool_key))
    .map((row) => enrichStakingPool(row));

  return NextResponse.json({ pools });
}
