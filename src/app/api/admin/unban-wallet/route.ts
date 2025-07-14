import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { normalizeWalletForBanKey, walletAddressSearchVariants } from '@/lib/admin/walletAddressVariants';
import { getPlayChainConfig } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

/** Unban + zero all house balances for wallet variants. */
export async function POST(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { walletAddress?: string };
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
  const variants = walletAddressSearchVariants(walletAddress);

  await db.from('banned_wallets').delete().eq('wallet_address', key);

  await db.from('wallet_account_status').upsert(
    { wallet: key, status: 'active', reason: 'Unbanned by admin', updated_at: new Date().toISOString() },
    { onConflict: 'wallet' },
  );

  const searchList = [...new Set([...variants, key, walletAddress])];
  const { data: balances } = await db
    .from('user_house_balances')
    .select('user_address, chain, currency, balance_raw')
    .in('user_address', searchList);

  let wiped = 0;
  for (const row of balances ?? []) {
    if (Number(row.balance_raw) > 0) {
      await db
        .from('user_house_balances')
        .update({ balance_raw: 0, updated_at: new Date().toISOString() })
        .eq('user_address', row.user_address)
        .eq('chain', row.chain)
        .eq('currency', row.currency);
      wiped += 1;
    }
  }

  return NextResponse.json({
    success: true,
    wallet: key,
    balancesWiped: wiped,
    note: 'Global ban removed; house balances zeroed. On-chain treasury not reversed.',
  });
}
