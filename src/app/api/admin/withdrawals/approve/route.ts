import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { executeAptWithdrawal } from '@/lib/server/executeAptWithdrawal';
import { executeSolWithdrawal } from '@/lib/server/executeSolWithdrawal';
import { getWithdrawFeeBps } from '@/lib/server/platformFees';
import { rawToNative } from '@/lib/server/play/amounts';
import type { ChainId } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

/** Operator approve pending withdrawal (dashboard admin token) — Solana + Aptos. */
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
    return NextResponse.json({ error: `Request is not pending (status=${row.status})` }, { status: 400 });
  }

  const chain = String(row.chain || 'aptos') as ChainId;
  const wallet = String(row.wallet);
  const withdrawFeeBps = getWithdrawFeeBps();

  try {
    if (chain === 'solana') {
      const grossNative = Number(row.gross_apt);
      const result = await executeSolWithdrawal({
        wallet,
        grossNative,
        withdrawFeeBps,
      });

      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          fee_tx_hash: result.feeTxHash,
          user_tx_hash: result.userTxHash,
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      return NextResponse.json({
        success: true,
        chain,
        requestId,
        feeTxHash: result.feeTxHash,
        userTxHash: result.userTxHash,
        netNative: result.userPayoutNative,
      });
    }

    if (chain === 'aptos') {
      const grossOctas = Number(row.gross_octas);
      const result = await executeAptWithdrawal({
        userAddress: wallet,
        grossOctas,
        withdrawFeeBps,
      });

      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          fee_tx_hash: result.feeTxHash,
          user_tx_hash: result.userTxHash,
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      return NextResponse.json({
        success: true,
        chain,
        requestId,
        feeTxHash: result.feeTxHash,
        userTxHash: result.userTxHash,
        netNative: rawToNative('aptos', result.userPayoutOctas),
      });
    }

    return NextResponse.json({ error: `Chain "${chain}" is not supported for approval yet` }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[admin/withdrawals/approve]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
