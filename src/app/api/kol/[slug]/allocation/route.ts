import { NextRequest, NextResponse } from 'next/server';
import {
  formatKolAllocationPublic,
  getKolAllocationBySlug,
  normalizeKolSlug,
  syncKolReadyStatus,
} from '@/lib/server/kolAllocations';
import { readKolSessionFromCookies } from '@/lib/server/kolPortalAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeKolSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: 'Invalid partner link' }, { status: 404 });
  }

  const session = await readKolSessionFromCookies();
  if (!session || session.slug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let row = await getKolAllocationBySlug(slug);
    if (!row || row.id !== session.allocationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (row.status === 'revoked') {
      return NextResponse.json({ error: 'Allocation revoked' }, { status: 403 });
    }

    row = await syncKolReadyStatus(row);
    return NextResponse.json({
      allocation: formatKolAllocationPublic(row, request.nextUrl.origin),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Load failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
