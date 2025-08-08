import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { formatOtcEntry } from '@/lib/server/otcLottery';

export const dynamic = 'force-dynamic';

function checkAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || '';
  const expected = process.env.DASHBOARD_ADMIN_TOKEN || process.env.OTC_LOTTERY_ADMIN_BEARER;
  return Boolean(expected && token === expected);
}

type ReviewBody = {
  entryId?: string;
  action?: 'approve' | 'reject';
  rejectReason?: string;
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

  let body: ReviewBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const entryId = body.entryId;
  const action = body.action;
  if (!entryId || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'entryId and action (approve|reject) required' }, { status: 400 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from('otc_lottery_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  if (row.status !== 'pending_review') {
    return NextResponse.json({ error: `Entry is not pending (status=${row.status})` }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'admin',
    admin_notes: body.adminNotes?.trim() || row.admin_notes,
    updated_at: new Date().toISOString(),
  };

  if (action === 'approve') {
    updates.status = 'approved';
    updates.reject_reason = null;
  } else {
    updates.status = 'rejected';
    updates.reject_reason = body.rejectReason?.trim() || 'Rejected by admin';
  }

  const { data, error } = await supabase
    .from('otc_lottery_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    entry: formatOtcEntry(data),
    message:
      action === 'approve'
        ? 'Approved. User receives APTC when the 10-day timer ends (fulfill manually).'
        : 'Entry rejected.',
  });
}
