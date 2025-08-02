import { NextResponse } from 'next/server';
import { validateLivepeerOrHls } from '@/lib/server/streamValidation';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });

    const { ok, url, status } = await validateLivepeerOrHls(id);
    const contentType = ok ? 'application/vnd.apple.mpegurl' : undefined;
    return NextResponse.json({ ok, url, status, contentType });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
