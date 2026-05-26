/**
 * Validates that a Livepeer playback ID or HLS URL is reachable (HEAD on manifest).
 * YouTube URLs are validated separately (client-side embed + oEmbed); do not call this for YouTube.
 */

const LIVEPEER_CDN_ORIGIN = 'https://livepeercdn.com';

const ALLOWED_HLS_HOSTS = new Set([
  'livepeercdn.com',
  'cdn.livepeer.com',
  'livepeercdn.studio',
]);

const PLAYBACK_ID_RE = /^[a-zA-Z0-9_-]+$/;
const HLS_MANIFEST_PATH_RE = /^\/hls\/([a-zA-Z0-9_-]+)\/index\.m3u8$/;

/** Block private/link-local hosts and non-HTTPS fetches (SSRF mitigation). */
function assertSafeHlsHost(hostname: string): string {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host === '127.0.0.1' ||
    host.startsWith('127.') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.internal')
  ) {
    throw new Error('Invalid stream host');
  }
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 169) {
      throw new Error('Invalid stream host');
    }
  }
  if (!ALLOWED_HLS_HOSTS.has(host)) {
    throw new Error('Stream host is not on the allowlist');
  }
  return host;
}

/** Build fetch URL from a fixed origin + validated playback id (never pass user URL string to fetch). */
function manifestUrlForPlaybackId(playbackId: string, origin: string = LIVEPEER_CDN_ORIGIN): string {
  if (!PLAYBACK_ID_RE.test(playbackId)) {
    throw new Error('Invalid playback id');
  }
  return `${origin}/hls/${encodeURIComponent(playbackId)}/index.m3u8`;
}

/**
 * Parse user input into a safe manifest URL. User-provided URL strings are only used to
 * extract a validated playback id; fetch always uses a constant-origin template.
 */
function resolveSafeHlsManifestUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Empty playback id');

  if (!/^https?:\/\//i.test(trimmed)) {
    const id = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
    return manifestUrlForPlaybackId(id);
  }

  const parsed = new URL(trimmed);
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS stream URLs are allowed');
  }
  const host = assertSafeHlsHost(parsed.hostname);
  const match = HLS_MANIFEST_PATH_RE.exec(parsed.pathname);
  if (!match?.[1]) {
    throw new Error('Invalid HLS manifest path');
  }
  const origin =
    host === 'livepeercdn.com'
      ? LIVEPEER_CDN_ORIGIN
      : host === 'cdn.livepeer.com'
        ? 'https://cdn.livepeer.com'
        : 'https://livepeercdn.studio';
  return manifestUrlForPlaybackId(match[1], origin);
}

export async function validateLivepeerOrHls(
  playbackId: string,
): Promise<{ ok: boolean; url: string; status: number }> {
  let hls: string;
  try {
    hls = resolveSafeHlsManifestUrl(playbackId);
  } catch {
    return { ok: false, url: '', status: 0 };
  }
  try {
    const res = await fetch(hls, { method: 'HEAD', cache: 'no-store', redirect: 'error' });
    return { ok: res.ok, url: hls, status: res.status };
  } catch {
    return { ok: false, url: hls, status: 0 };
  }
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);

export function isYouTubeStreamUrl(input: string): boolean {
  try {
    const raw = input.trim();
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return YOUTUBE_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function streamSourceType(playbackId: string): 'youtube' | 'hls' | 'livepeer' {
  const id = playbackId.trim();
  if (isYouTubeStreamUrl(id)) return 'youtube';
  if (/^https?:\/\//i.test(id)) return 'hls';
  return 'livepeer';
}
