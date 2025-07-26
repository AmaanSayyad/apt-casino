import { NextRequest, NextResponse } from 'next/server';
import { recordBuybackSnapshot } from '@/lib/server/ggrBuyback';

export const dynamic = 'force-dynamic';

function checkAdmin(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const expected = process.env.DASHBOARD_ADMIN_TOKEN || process.env.GGR_BUYBACK_ADMIN_BEARER;
  return !!expected && token === expected;
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const row = await recordBuybackSnapshot({
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      ggrUsd: Number(body.ggrUsd),
      buybackUsd: Number(body.buybackUsd),
      aptcBought: body.aptcBought != null ? Number(body.aptcBought) : undefined,
      aptcBurned: body.aptcBurned != null ? Number(body.aptcBurned) : undefined,
      txSignature: body.txSignature,
      notes: body.notes,
    });
    return NextResponse.json({ ok: true, snapshot: row });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to record snapshot' },
      { status: 500 },
    );
  }
}
