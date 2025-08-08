import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { formatOtcEntry } from '@/lib/server/otcLottery';

export const dynamic = 'force-dynamic';

function checkAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || '';
  const expected = process.env.DASHBOARD_ADMIN_TOKEN || process.env.OTC_LOTTERY_ADMIN_BEARER;
  return Boolean(expected && token === expected);
}

type FulfillBody = {
  entryId?: string;
  fulfillmentTxHash?: string;
  actualAptcSent?: number;
  adminNotes?: string;
};

export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  let body: FulfillBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const entryId = body.entryId;
  if (!entryId) {
    return NextResponse.json({ error: 'entryId required' }, { status: 400 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from('otc_lottery_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  if (row.status !== 'approved') {
    return NextResponse.json({ error: 'Only approved entries can be fulfilled' }, { status: 400 });
  }

  const unlockMs = new Date(String(row.unlock_at)).getTime();
  if (unlockMs > Date.now()) {
    return NextResponse.json(
      { error: '10-day lock has not ended yet', unlockAt: row.unlock_at },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('otc_lottery_entries')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      fulfillment_tx_hash: body.fulfillmentTxHash?.trim() || null,
      actual_aptc_sent: body.actualAptcSent ?? row.estimated_aptc,
      admin_notes: body.adminNotes?.trim() || row.admin_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, entry: formatOtcEntry(data) });
}
