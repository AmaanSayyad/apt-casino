import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const KOL_SESSION_COOKIE = 'kol_portal_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function sessionSecret(): string {
  const secret =
    process.env.KOL_PORTAL_SESSION_SECRET?.trim() ||
    process.env.DASHBOARD_ADMIN_TOKEN?.trim() ||
    '';
  if (!secret) throw new Error('KOL_PORTAL_SESSION_SECRET or DASHBOARD_ADMIN_TOKEN required');
  return secret;
}

export function hashPortalPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPortalPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64).toString('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
  } catch {
    return false;
  }
}

export function generatePortalPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[randomInt(chars.length)];
  }
  return out;
}

export function createKolSessionToken(allocationId: string, slug: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${allocationId}:${slug}:${exp}`;
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyKolSessionToken(
  token: string,
): { allocationId: string; slug: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;
    const [allocationId, slug, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!allocationId || !slug || !Number.isFinite(exp) || exp < Date.now()) return null;

    const payload = `${allocationId}:${slug}:${expStr}`;
    const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    return { allocationId, slug };
  } catch {
    return null;
  }
}

export function kolSessionCookieOptions(maxAgeSec = 86400) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  };
}

export async function readKolSessionFromCookies(): Promise<{
  allocationId: string;
  slug: string;
} | null> {
  const jar = await cookies();
  const token = jar.get(KOL_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyKolSessionToken(token);
}
