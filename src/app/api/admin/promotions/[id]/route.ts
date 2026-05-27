import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { deletePromotion, updatePromotion } from '@/lib/server/promotions';

export const dynamic = 'force-dynamic';

type PatchBody = {
  title?: string;
  description?: string | null;
  active?: boolean;
  rewardSol?: number;
  minDepositUsd?: number;
  bonusUsdAptc?: number;
  bonusBps?: number;
  maxClaims?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  const { id } = await context.params;
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const promotion = await updatePromotion(id, body);
    return NextResponse.json({ success: true, promotion });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  const { id } = await context.params;
  try {
    await deletePromotion(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
