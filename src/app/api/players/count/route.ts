import { NextResponse } from 'next/server';
import { aggregatePlayEventsSince } from '@/lib/server/gamePlayEvents';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

/** Total unique players — matches Platform Intelligence "Unique Traders". */
export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ totalPlayers: 0, supabaseConfigured: false });
  }

  const [{ count: trackedCount, error: trackedErr }, allPlay] = await Promise.all([
    supabase.from('tracked_wallets').select('*', { count: 'exact', head: true }),
    aggregatePlayEventsSince(null),
  ]);

  if (trackedErr) {
    console.error('tracked_wallets count:', trackedErr);
  }

  const fromTracked = trackedCount ?? 0;
  const fromPlay = allPlay.uniqueWallets;
  const totalPlayers = fromPlay > 0 ? fromPlay : fromTracked;

  return NextResponse.json({ totalPlayers, supabaseConfigured: true });
}
