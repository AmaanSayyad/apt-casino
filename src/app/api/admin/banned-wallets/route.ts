import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { normalizeWalletForBanKey } from '@/lib/bans/walletBan';
import { purgeWalletPlatformData } from '@/lib/bans/purgeWalletData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured', bans: [] }, { status: 503 });
  }

  const { data, error } = await db
    .from('banned_wallets')
    .select('wallet_address, reason, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bans: data ?? [] });
}

export async function POST(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { walletAddress?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const walletAddress = String(body.walletAddress || '').trim();
  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
  }

  const key = normalizeWalletForBanKey(walletAddress);
  const reason =
    typeof body.reason === 'string' && body.reason.trim()
      ? body.reason.trim()
      : 'Banned by administrator';

  const { data, error } = await db
    .from('banned_wallets')
    .upsert({ wallet_address: key, reason }, { onConflict: 'wallet_address' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db
    .from('wallet_account_status')
    .upsert({ wallet: key, status: 'banned', reason, updated_at: new Date().toISOString() }, { onConflict: 'wallet' });

  const purge = await purgeWalletPlatformData(db, walletAddress);

  return NextResponse.json({ success: true, ban: data, purge });
}

export async function DELETE(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const walletAddress = new URL(request.url).searchParams.get('walletAddress')?.trim();
  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress query required' }, { status: 400 });
  }

  const key = normalizeWalletForBanKey(walletAddress);
  const { error } = await db.from('banned_wallets').delete().eq('wallet_address', key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
