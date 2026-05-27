import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { createPromotion, listPromotionsAdmin } from '@/lib/server/promotions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;
  try {
    const data = await listPromotionsAdmin();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load promotions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type CreateBody = {
  promoType?: 'coupon' | 'deposit_deal';
  title?: string;
  description?: string;
  code?: string;
  rewardSol?: number;
  minDepositUsd?: number;
  bonusUsdAptc?: number;
  bonusBps?: number;
  maxClaims?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
};

export async function POST(request: NextRequest) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const promoType = body.promoType;
  const title = String(body.title || '').trim();
  if (!promoType || !title) {
    return NextResponse.json({ error: 'promoType and title are required' }, { status: 400 });
  }

  try {
    const promotion = await createPromotion({
      promoType,
      title,
      description: body.description,
      code: body.code,
      rewardSol: Number(body.rewardSol || 0),
      minDepositUsd: Number(body.minDepositUsd || 0),
      bonusUsdAptc: Number(body.bonusUsdAptc || 0),
      bonusBps: Number(body.bonusBps || 0),
      maxClaims: body.maxClaims ?? null,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      active: body.active ?? true,
    });
    return NextResponse.json({ success: true, promotion });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed creating promotion';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
