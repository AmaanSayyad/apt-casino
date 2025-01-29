/**
 * Shared Open Graph / Twitter Card metadata for link previews (X, Discord, Telegram).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://aptcasino.com).
 */

const DEFAULT_SITE_URL = 'https://aptcasino.com';

export const SITE_NAME = 'APT Casino';

/** Public path — same asset as `public/APT-Casino-Logo.png` and `src/app/icon.png`. */
export const SITE_ICON_PATH = '/APT-Casino-Logo.png';

export const siteIcons = {
  icon: [
    { url: SITE_ICON_PATH, type: 'image/png' },
    { url: SITE_ICON_PATH, sizes: '32x32', type: 'image/png' },
    { url: SITE_ICON_PATH, sizes: '16x16', type: 'image/png' },
  ],
  shortcut: [{ url: SITE_ICON_PATH, type: 'image/png' }],
  apple: [{ url: SITE_ICON_PATH, type: 'image/png' }],
};

export const DEFAULT_TITLE = 'APT Casino';

export const DEFAULT_DESCRIPTION =
  'Provably fair casino games on Solana and Aptos. Deposit, play roulette, mines, plinko & more — earn APTC via referrals.';

export function getSiteUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const raw = (fromEnv || DEFAULT_SITE_URL).trim().replace(/\/$/, '');
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Canonical origin for social share links (never localhost when env is set). */
export function getPublicShareOrigin() {
  return getSiteUrl();
}

export function buildReferralShortLink(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return '';
  return `${getPublicShareOrigin()}/r/${c}`;
}

/** @param {{ title?: string; description?: string; path?: string }} opts */
export function buildPageMetadata(opts = {}) {
  const siteUrl = getSiteUrl();
  const title = opts.title ?? DEFAULT_TITLE;
  const description = opts.description ?? DEFAULT_DESCRIPTION;
  const path = opts.path ?? '/';
  const canonical = new URL(path.startsWith('/') ? path : `/${path}`, siteUrl).toString();

  const ogImage = new URL('/opengraph-image', siteUrl).toString();

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    icons: siteIcons,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export const rootMetadata = buildPageMetadata();
