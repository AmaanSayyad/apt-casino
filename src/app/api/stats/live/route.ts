import { NextRequest, NextResponse } from 'next/server';
import { rateLimitRequest } from '@/lib/server/requestRateLimit';
import { getLiveStatsCached } from '@/lib/server/statsLive';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
};

export async function GET(request: NextRequest) {
  if (rateLimitRequest(request, { key: 'stats-live', limit: 20, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: 'Too many requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': '60', ...CACHE_HEADERS } },
    );
  }

  try {
    const data = await getLiveStatsCached();
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('[stats/live] failed', e);
    return NextResponse.json(
      { error: 'Stats temporarily unavailable' },
      { status: 503, headers: CACHE_HEADERS },
    );
  }
}
