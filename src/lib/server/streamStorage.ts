import type { SupabaseClient } from '@supabase/supabase-js';

export const STREAM_THUMBNAILS_BUCKET = 'stream-thumbnails';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Ensure the public thumbnails bucket exists (creates via service role if missing). */
export async function ensureStreamThumbnailsBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.warn('[streamStorage] listBuckets', listErr.message);
  } else if (buckets?.some((b) => b.id === STREAM_THUMBNAILS_BUCKET || b.name === STREAM_THUMBNAILS_BUCKET)) {
    return;
  }

  const { error: createErr } = await supabase.storage.createBucket(STREAM_THUMBNAILS_BUCKET, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ALLOWED_MIME,
  });

  if (createErr && !/already exists/i.test(createErr.message)) {
    throw new Error(createErr.message || 'Could not create stream-thumbnails bucket');
  }
}
