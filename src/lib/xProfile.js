const TWITTER_HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/;

export function normalizeTwitterHandle(input) {
  if (input == null || input === '') return null;
  const h = String(input).trim().replace(/^@/, '');
  if (!TWITTER_HANDLE_RE.test(h)) return null;
  return h;
}

/** Recover X handle when avatar_url was saved but twitter_handle was cleared. */
export function inferTwitterHandleFromAvatarUrl(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;
  const m = avatarUrl.trim().match(/unavatar\.io\/x\/([^/?#]+)/i);
  if (!m?.[1]) return null;
  try {
    return normalizeTwitterHandle(decodeURIComponent(m[1]));
  } catch {
    return normalizeTwitterHandle(m[1]);
  }
}

export function isXDerivedAvatarUrl(avatarUrl) {
  return !!inferTwitterHandleFromAvatarUrl(avatarUrl);
}

/** Effective linked X handle from stored fields (handles legacy partial saves). */
export function resolveLinkedTwitterHandle({ twitterHandle, avatarUrl } = {}) {
  return normalizeTwitterHandle(twitterHandle) || inferTwitterHandleFromAvatarUrl(avatarUrl);
}

/** Public X profile photo via unavatar.io (no OAuth / API key required). */
export function xAvatarUrlFromHandle(handle) {
  const h = normalizeTwitterHandle(handle);
  if (!h) return null;
  return `https://unavatar.io/x/${encodeURIComponent(h)}`;
}

export function isSafeAvatarUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Prefer stored avatar; fall back to live X profile photo when handle is linked. */
export function resolvePlayerAvatarUrl({ avatarUrl, twitterHandle } = {}) {
  if (isSafeAvatarUrl(avatarUrl)) return avatarUrl.trim();
  const x = resolveLinkedTwitterHandle({ twitterHandle, avatarUrl });
  return xAvatarUrlFromHandle(x);
}

export function resolvePlayerDisplayName({ handle, twitterHandle, wallet, avatarUrl } = {}) {
  if (handle && String(handle).trim()) return String(handle).trim();
  const x = resolveLinkedTwitterHandle({ twitterHandle, avatarUrl });
  if (x) return `@${x}`;
  if (wallet) {
    const s = String(wallet);
    if (s.length > 14) {
      return s.startsWith('0x') ? `${s.slice(0, 6)}…${s.slice(-4)}` : `${s.slice(0, 4)}…${s.slice(-4)}`;
    }
    return s;
  }
  return 'Player';
}
