import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { loadBannedWalletKeys } from '@/lib/bans/walletBan';
import { purgeWalletPlatformData } from '@/lib/bans/purgeWalletData';

export const dynamic = 'force-dynamic';

/** Purge platform data for every globally banned wallet (idempotent cleanup). */
export async function POST(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const banned = await loadBannedWalletKeys();
  const results = [];

  for (const wallet of banned) {
    results.push(await purgeWalletPlatformData(db, wallet));
  }

  return NextResponse.json({ success: true, purged: results.length, results });
}
