/**
 * Validates that a Livepeer playback ID or HLS URL is reachable (HEAD on manifest).
 * YouTube URLs are validated separately (client-side embed + oEmbed); do not call this for YouTube.
 */
export async function validateLivepeerOrHls(playbackId: string): Promise<{ ok: boolean; url: string; status: number }> {
  const trimmed = playbackId.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);
  const hls = isUrl ? trimmed : `https://livepeercdn.com/hls/${trimmed}/index.m3u8`;
  try {
    const res = await fetch(hls, { method: 'HEAD', cache: 'no-store' });
    const ok = res.ok;
    return { ok, url: hls, status: res.status };
  } catch {
    return { ok: false, url: hls, status: 0 };
  }
}

export function isYouTubeStreamUrl(input: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(input.trim());
}

export function streamSourceType(playbackId: string): 'youtube' | 'hls' | 'livepeer' {
  const id = playbackId.trim();
  if (isYouTubeStreamUrl(id)) return 'youtube';
  if (/^https?:\/\//i.test(id)) return 'hls';
  return 'livepeer';
}
