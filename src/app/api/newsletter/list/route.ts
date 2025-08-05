import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Internal dashboard list of newsletter subscribers.
 * Protected by header `x-admin-token` matching env `DASHBOARD_ADMIN_TOKEN`.
 * If the env var is not set, the route refuses to expose anything.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.DASHBOARD_ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: 'Set DASHBOARD_ADMIN_TOKEN in the server env to enable this endpoint.', subscribers: [] },
      { status: 503 },
    );
  }
  const provided = request.headers.get('x-admin-token') ?? '';
  if (!provided || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized', subscribers: [] }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ subscribers: [], supabaseConfigured: false });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 1000);

  const { count: totalCount } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true });

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, source, created_at, unsubscribed_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message, subscribers: [] }, { status: 500 });
  }

  return NextResponse.json({
    total: totalCount ?? data?.length ?? 0,
    subscribers: data ?? [],
    supabaseConfigured: true,
  });
}
