import { NextRequest, NextResponse } from 'next/server';
import {
  changeKolPortalPassword,
  formatKolAllocationPublic,
  normalizeKolSlug,
} from '@/lib/server/kolAllocations';
import { readKolSessionFromCookies } from '@/lib/server/kolPortalAuth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeKolSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: 'Invalid partner link' }, { status: 400 });
  }

  const session = await readKolSessionFromCookies();
  if (!session || session.slug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const newPassword = String(body.newPassword || '').trim();
  const confirmPassword = String(body.confirmPassword || '').trim();
  if (!newPassword) {
    return NextResponse.json({ error: 'New password is required' }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
  }

  try {
    const row = await changeKolPortalPassword({
      slug,
      allocationId: session.allocationId,
      currentPassword: String(body.currentPassword || ''),
      newPassword,
    });
    return NextResponse.json({
      success: true,
      allocation: formatKolAllocationPublic(row, request.nextUrl.origin),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Password update failed';
    const status = message.includes('incorrect') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
