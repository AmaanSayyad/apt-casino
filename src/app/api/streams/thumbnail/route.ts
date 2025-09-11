import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  ensureStreamThumbnailsBucket,
  STREAM_THUMBNAILS_BUCKET,
} from '@/lib/server/streamStorage';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Storage is not configured.' }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'file is required.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 2 MB.' }, { status: 400 });
  }

  const mime = file.type || 'image/jpeg';
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: 'Use JPEG, PNG, WebP, or GIF.' }, { status: 400 });
  }

  try {
    await ensureStreamThumbnailsBucket(supabase);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not prepare storage';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'image/gif' ? 'gif' : 'jpg';
  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let uploadErr = (
    await supabase.storage.from(STREAM_THUMBNAILS_BUCKET).upload(path, buffer, {
      contentType: mime,
      upsert: false,
    })
  ).error;

  if (uploadErr && /not found/i.test(uploadErr.message)) {
    try {
      await ensureStreamThumbnailsBucket(supabase);
      uploadErr = (
        await supabase.storage.from(STREAM_THUMBNAILS_BUCKET).upload(path, buffer, {
          contentType: mime,
          upsert: false,
        })
      ).error;
    } catch {
      /* retry upload result in uploadErr */
    }
  }

  if (uploadErr) {
    console.warn('[streams/thumbnail]', uploadErr.message);
    return NextResponse.json({ error: uploadErr.message || 'Upload failed.' }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(STREAM_THUMBNAILS_BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl, path });
}
