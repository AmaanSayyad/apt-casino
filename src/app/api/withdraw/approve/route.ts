import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { executeAptWithdrawal } from '@/lib/server/executeAptWithdrawal';
import { getWithdrawFeeBps } from '@/lib/server/platformFees';

/**
 * Operator-only: completes a queued withdrawal after manual review.
 * Authorization: Bearer WITHDRAW_APPROVAL_BEARER (server env)
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  const expected = process.env.WITHDRAW_APPROVAL_BEARER;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  const grossOctas = Number(row.gross_octas);
  const wallet = String(row.wallet);

  try {
    const withdrawFeeBps = getWithdrawFeeBps();
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
      requestId,
      feeTxHash: result.feeTxHash,
      userTxHash: result.userTxHash,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('approve withdraw failed:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
