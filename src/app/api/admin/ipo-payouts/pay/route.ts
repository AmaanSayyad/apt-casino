import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  payAffiliateRewards,
  payStakingRewards,
  processAffiliateWithdrawal,
} from '@/lib/server/ipo/payouts';

export const dynamic = 'force-dynamic';

type PayBody = {
  type?: 'staking_reward' | 'affiliate_reward' | 'affiliate_withdrawal';
  ids?: number[];
  withdrawalId?: number;
  action?: 'pay' | 'reject';
  txHash?: string;
  adminNote?: string;
};

export async function POST(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body: PayBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = body.type;
  const opts = { txHash: body.txHash, adminNote: body.adminNote };

  try {
    if (type === 'affiliate_withdrawal') {
      const withdrawalId = Number(body.withdrawalId ?? body.ids?.[0]);
      if (!Number.isFinite(withdrawalId)) {
        return NextResponse.json({ error: 'withdrawalId required' }, { status: 400 });
      }
      const action = body.action === 'reject' ? 'reject' : 'pay';
      const result = await processAffiliateWithdrawal(db, withdrawalId, action, opts);
      return NextResponse.json({ success: true, ...result });
    }

    const ids = (body.ids || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
    if (!ids.length) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 });
    }

    if (type === 'staking_reward') {
      const result = await payStakingRewards(db, ids, opts);
      return NextResponse.json({ success: true, ...result });
    }

    if (type === 'affiliate_reward') {
      const result = await payAffiliateRewards(db, ids, opts);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { error: 'type must be staking_reward, affiliate_reward, or affiliate_withdrawal' },
      { status: 400 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Payout record failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
