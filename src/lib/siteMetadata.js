/**
 * Shared Open Graph / Twitter Card metadata for link previews (X, Discord, Telegram).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://aptcasino.fun).
 */

export const DEFAULT_SITE_URL = 'https://aptcasino.fun';

/** In-app route for the litepaper page. */
export const LITEPAPER_PATH = '/litepaper';

/** Canonical litepaper URL on the production domain. */
export const DEFAULT_LITEPAPER_URL = `${DEFAULT_SITE_URL}${LITEPAPER_PATH}`;

export const SITE_NAME = 'APT Casino';

/** White spade on purple gradient — `public/` + `src/app/icon.png` + `src/app/apple-icon.png`. */
export const SITE_ICON_PATH = '/APT-Casino-Logo.png';

export const siteIcons = {
  icon: [
    { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { url: SITE_ICON_PATH, sizes: '512x512', type: 'image/png' },
  ],
  shortcut: [{ url: '/favicon-32x32.png', type: 'image/png' }],
  apple: [{ url: SITE_ICON_PATH, sizes: '180x180', type: 'image/png' }],
};

export const DEFAULT_TITLE = 'APT Casino';

export const DEFAULT_DESCRIPTION =
  'AptCasino.fun';

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

/** Canonical litepaper URL (honours NEXT_PUBLIC_SITE_URL). @param {string} [fragment] Section id, with or without `#`. */
export function getLitepaperUrl(fragment = '') {
  const hash = fragment ? (fragment.startsWith('#') ? fragment : `#${fragment}`) : '';
  return `${getSiteUrl()}${LITEPAPER_PATH}${hash}`;
}

/** Next.js Link href — path + optional section hash. */
export function litepaperPath(fragment = '') {
  const hash = fragment ? (fragment.startsWith('#') ? fragment : `#${fragment}`) : '';
  return `${LITEPAPER_PATH}${hash}`;
}

/** Default preview image shown on every page when sharing on Discord, Telegram, X, etc. */
export const DEFAULT_OG_IMAGE_PATH = '/Linkshare.jpg';

/**
 * @param {{ title?: string; description?: string; path?: string; ogImagePath?: string }} opts
 * `ogImagePath` defaults to `/Linkshare.jpg` so every page/link previews with the same
 * social card. Pass an explicit `null` to suppress the image on a specific page.
 */
export function buildPageMetadata(opts = {}) {
  const siteUrl = getSiteUrl();
  const title = opts.title ?? DEFAULT_TITLE;
  const description = opts.description ?? DEFAULT_DESCRIPTION;
  const path = opts.path ?? '/';
  const canonical = new URL(path.startsWith('/') ? path : `/${path}`, siteUrl).toString();
  const imagePath = opts.ogImagePath !== undefined ? opts.ogImagePath : DEFAULT_OG_IMAGE_PATH;

  const openGraph = {
    type: 'website',
    locale: 'en_US',
    url: canonical,
    siteName: SITE_NAME,
    title,
    description,
  };

  const twitter = {
    card: 'summary_large_image',
    title,
    description,
  };

  if (imagePath) {
    const ogImage = new URL(
      imagePath.startsWith('/') ? imagePath : `/${imagePath}`,
      siteUrl,
    ).toString();
    const mimeType = imagePath.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 'image/png';
    openGraph.images = [
      {
        url: ogImage,
        secureUrl: ogImage,
        width: 3200,
        height: 1800,
        alt: SITE_NAME,
        type: mimeType,
      },
    ];
    twitter.images = [{ url: ogImage, alt: SITE_NAME }];
  }

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    icons: siteIcons,
    alternates: { canonical },
    openGraph,
    twitter,
  };
}

export const rootMetadata = {
  ...buildPageMetadata({ ogImagePath: '/Linkshare.jpg' }),
};
