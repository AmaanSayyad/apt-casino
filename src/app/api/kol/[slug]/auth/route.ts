import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateKolPortal,
  formatKolAllocationPublic,
  normalizeKolSlug,
} from '@/lib/server/kolAllocations';
import {
  createKolSessionToken,
  KOL_SESSION_COOKIE,
  kolSessionCookieOptions,
} from '@/lib/server/kolPortalAuth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeKolSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: 'Invalid partner link' }, { status: 400 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const password = String(body.password || '');
  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  try {
    const row = await authenticateKolPortal(slug, password);
    if (!row) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = createKolSessionToken(row.id, row.kol_slug);
    const allocation = formatKolAllocationPublic(row, request.nextUrl.origin);
    const res = NextResponse.json({ success: true, allocation });
    res.cookies.set(KOL_SESSION_COOKIE, token, kolSessionCookieOptions());
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  await context.params;
  const res = NextResponse.json({ success: true });
  res.cookies.set(KOL_SESSION_COOKIE, '', { ...kolSessionCookieOptions(0), maxAge: 0 });
  return res;
}
