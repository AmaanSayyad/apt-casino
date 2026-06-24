import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { filterBannedWalletRows, loadBannedWalletKeys } from '@/lib/bans/walletBan';
import { getPlayChainConfig } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured', transactions: [] }, { status: 503 });
  }

  const limit = Math.min(200, Math.max(10, Number(new URL(request.url).searchParams.get('limit')) || 80));

  const [{ data: deposits }, { data: withdrawals }, bannedWallets] = await Promise.all([
    db
      .from('deposits_log')
      .select('id, chain, wallet, amount_native, fee_octas, net_credited_octas, user_tx_hash, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    db
      .from('withdrawal_requests')
      .select(
        'id, chain, wallet, gross_apt, usd_estimate, fee_octas, user_payout_octas, status, user_tx_hash, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit),
    loadBannedWalletKeys(),
  ]);

  const tx: {
    id: string;
    type: 'deposit' | 'withdrawal';
    wallet: string;
    chain: string;
    amount: number;
    currency: string;
    status: string;
    txHash: string | null;
    createdAt: string;
  }[] = [];

  for (const d of filterBannedWalletRows(deposits ?? [], bannedWallets, (r) => r.wallet)) {
    const sym = getPlayChainConfig(String(d.chain))?.nativeSymbol ?? String(d.chain).toUpperCase();
    tx.push({
      id: `dep-${d.id}`,
      type: 'deposit',
      wallet: d.wallet,
      chain: d.chain,
      amount: Number(d.amount_native),
      currency: sym,
      status: 'completed',
      txHash: d.user_tx_hash,
      createdAt: d.created_at,
    });
  }

  for (const w of filterBannedWalletRows(withdrawals ?? [], bannedWallets, (r) => r.wallet)) {
    const sym = getPlayChainConfig(String(w.chain))?.nativeSymbol ?? String(w.chain).toUpperCase();
    tx.push({
      id: `wd-${w.id}`,
      type: 'withdrawal',
      wallet: w.wallet,
      chain: w.chain,
      amount: Number(w.gross_apt),
      currency: sym,
      status: w.status,
      txHash: w.user_tx_hash,
      createdAt: w.created_at,
    });
  }

  tx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ transactions: tx.slice(0, limit) });
}
