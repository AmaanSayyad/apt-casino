import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { formatOtcEntry } from '@/lib/server/otcLottery';

export const dynamic = 'force-dynamic';

function checkAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || '';
  const expected = process.env.DASHBOARD_ADMIN_TOKEN || process.env.OTC_LOTTERY_ADMIN_BEARER;
  return Boolean(expected && token === expected);
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const status = request.nextUrl.searchParams.get('status');
  let q = supabase.from('otc_lottery_entries').select('*').order('created_at', { ascending: false });

  if (status && status !== 'all') {
    q = q.eq('status', status);
  }

  const { data, error } = await q.limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const entries = (data || []).map((row) => {
    const formatted = formatOtcEntry(row);
    const unlockMs = formatted.unlockAt ? new Date(String(formatted.unlockAt)).getTime() : 0;
    return {
      ...formatted,
      isUnlocked: unlockMs > 0 && unlockMs <= now,
      msUntilUnlock: unlockMs > now ? unlockMs - now : 0,
    };
  });

  return NextResponse.json({ entries, count: entries.length });
}
