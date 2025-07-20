import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { creditHouseBalance } from '@/lib/server/houseBalance';
import { getPlayChainConfig } from '@/lib/chains/registry';
import type { ChainId } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

/** Reject a pending withdrawal and restore house balance debited at queue time. */
export async function POST(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 503 });
  }

  let body: { requestId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const requestId = body.requestId;
  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (row.status !== 'pending') {
    return NextResponse.json({ error: `Cannot reject request in status: ${row.status}` }, { status: 400 });
  }

  const chain = String(row.chain || 'aptos') as ChainId;
  const cfg = getPlayChainConfig(chain);
  if (!cfg) {
    return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
  }

  try {
    await creditHouseBalance({
      wallet: row.wallet,
      chain,
      currency: cfg.dbCurrency,
      amountRaw: BigInt(String(row.gross_octas ?? 0)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to restore balance';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: updErr } = await supabase
    .from('withdrawal_requests')
    .update({
      status: 'rejected',
      processed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
