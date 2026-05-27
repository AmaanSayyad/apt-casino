import { NextResponse } from 'next/server';
import { getPublicPromotionSnapshot } from '@/lib/server/promotions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getPublicPromotionSnapshot();
    return NextResponse.json(snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed loading promotions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
