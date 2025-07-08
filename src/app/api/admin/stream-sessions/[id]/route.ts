import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { formatStreamAdmin, type StreamRewardStatus, type StreamRow } from '@/lib/server/streamSessions';

export const dynamic = 'force-dynamic';

type PatchBody = {
  rewardStatus?: StreamRewardStatus;
  adminRewardNotes?: string | null;
  isApproved?: boolean;
};

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: PatchBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.rewardStatus) {
    const allowed: StreamRewardStatus[] = ['pending', 'approved', 'paid', 'ineligible'];
    if (!allowed.includes(body.rewardStatus)) {
      return NextResponse.json({ error: 'Invalid rewardStatus' }, { status: 400 });
    }
    patch.reward_status = body.rewardStatus;
    if (body.rewardStatus === 'paid') {
      patch.reward_paid_at = new Date().toISOString();
    }
  }

  if (body.adminRewardNotes !== undefined) {
    patch.admin_reward_notes =
      typeof body.adminRewardNotes === 'string' ? body.adminRewardNotes.slice(0, 2000) : null;
  }

  if (typeof body.isApproved === 'boolean') {
    patch.is_approved = body.isApproved;
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('streams')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: formatStreamAdmin(data as StreamRow) });
}
