import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { normalizeWalletForBanKey } from '@/lib/admin/walletAddressVariants';
import { purgeWalletPlatformData } from '@/lib/bans/purgeWalletData';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { userAddress?: string; status?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const userAddress = String(body.userAddress || '').trim();
  const status = body.status;
  if (!userAddress || !status) {
    return NextResponse.json({ error: 'userAddress and status required' }, { status: 400 });
  }
  if (!['active', 'frozen', 'banned'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const key = normalizeWalletForBanKey(userAddress);
  const reason = typeof body.reason === 'string' ? body.reason.trim() : null;

  const { error } = await db.from('wallet_account_status').upsert(
    { wallet: key, status, reason, updated_at: new Date().toISOString() },
    { onConflict: 'wallet' },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (status === 'banned') {
    await db
      .from('banned_wallets')
      .upsert(
        { wallet_address: key, reason: reason || 'Banned via account status' },
        { onConflict: 'wallet_address' },
      );

    const purge = await purgeWalletPlatformData(db, userAddress);
    return NextResponse.json({ success: true, status, wallet: key, purge });
  }

  if (status === 'active') {
    await db.from('banned_wallets').delete().eq('wallet_address', key);
  }

  return NextResponse.json({ success: true, status, wallet: key });
}
