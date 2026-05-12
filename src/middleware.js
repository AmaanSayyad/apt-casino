import { NextResponse } from 'next/server';
import { isValidReferralCode } from '@/lib/server/referrals';

/**
 * Short referral links `/r/CODE`: set first-party cookie, then page renders OG tags
 * and client-redirects to home (crawlers see metadata without following a 302).
 */
export function middleware(request) {
  const match = request.nextUrl.pathname.match(/^\/r\/([^/]+)\/?$/i);
  if (!match) return NextResponse.next();

  const code = match[1].trim().toUpperCase();
  if (!isValidReferralCode(code)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const res = NextResponse.next();
  res.cookies.set('apt_casino_ref', code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
    sameSite: 'lax',
    httpOnly: false,
  });
  return res;
}

export const config = {
  matcher: ['/r/:path*'],
};
