import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ totalPlayers: 0, supabaseConfigured: false });
  }

  const { count, error } = await supabase
    .from('tracked_wallets')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('tracked_wallets count:', error);
    return NextResponse.json({ totalPlayers: 0, error: error.message });
  }

  return NextResponse.json({ totalPlayers: count ?? 0, supabaseConfigured: true });
}
