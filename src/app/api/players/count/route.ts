import { NextRequest, NextResponse } from 'next/server';
import { aggregatePlayEventsSince } from '@/lib/server/gamePlayEvents';
import { rateLimitRequest } from '@/lib/server/requestRateLimit';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

let cached: { at: number; data: { totalPlayers: number; supabaseConfigured: boolean } } | null = null;
let inflight: Promise<{ totalPlayers: number; supabaseConfigured: boolean }> | null = null;

async function getPlayerCount() {
  const now = Date.now();
  if (cached && now - cached.at < 60_000) return cached.data;
  if (inflight) return inflight;

  inflight = (async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { totalPlayers: 0, supabaseConfigured: false };
    }

    const [{ count: trackedCount, error: trackedErr }, allPlay] = await Promise.all([
      supabase.from('tracked_wallets').select('*', { count: 'exact', head: true }),
      aggregatePlayEventsSince(null),
    ]);

    if (trackedErr) {
      console.error('tracked_wallets count:', trackedErr);
    }

    const fromTracked = trackedCount ?? 0;
    const fromPlay = allPlay.uniqueWallets;
    const totalPlayers = fromPlay > 0 ? fromPlay : fromTracked;

    return { totalPlayers, supabaseConfigured: true };
  })()
    .then((data) => {
      cached = { at: Date.now(), data };
      inflight = null;
      return data;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });

  return inflight;
}

/** Total unique players — matches Platform Intelligence "Unique Traders". */
export async function GET(request: NextRequest) {
  if (rateLimitRequest(request, { key: 'players-count', limit: 30, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: 'Too many requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': '60', ...CACHE_HEADERS } },
    );
  }

  try {
    const data = await getPlayerCount();
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('[players/count] failed', e);
    return NextResponse.json(
      { error: 'Count temporarily unavailable' },
      { status: 503, headers: CACHE_HEADERS },
    );
  }
}
