/**
 * APTC token address / trading status helpers.
 * Public launch marketing has been removed from the site.
 * Configure via env when a mint/pair is needed for stake/price rails.
 */

export const DEXSCREENER_CHAIN_SLUG = 'robinhood';

/** Optional Virtuals / agent page — env only (no hardcoded launch URL). */
export const VIRTUALS_TOKEN_PAGE_URL = '';
export const VIRTUALS_CREATE_URL = 'https://app.virtuals.io/create';
export const VIRTUALS_APP_URL = 'https://app.virtuals.io';

/** No public default CA — set NEXT_PUBLIC_APTC_TOKEN_ADDRESS when ready. */
export const APTC_TOKEN_ADDRESS_DEFAULT = '';

/** No public default pair — set NEXT_PUBLIC_APTC_DEXSCREENER_PAIR when ready. */
export const APTC_DEXSCREENER_PAIR_DEFAULT = '';

/**
 * Prefer NEXT_PUBLIC_APTC_TOKEN_ADDRESS (EVM).
 * Falls back to legacy NEXT_PUBLIC_APTC_SOLANA_MINT.
 */
function rawTokenAddress() {
  return (
    process.env.NEXT_PUBLIC_APTC_TOKEN_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim() ||
    APTC_TOKEN_ADDRESS_DEFAULT
  );
}

/**
 * Token contract configured (explorer / price).
 * Distinct from public trading marketing.
 */
export function hasAptcMintConfigured() {
  const mint = rawTokenAddress();
  return Boolean(mint && mint !== 'Coming soon' && mint.length >= 20);
}

/** @deprecated Use hasAptcMintConfigured — kept for older imports */
export const hasAptcTokenConfigured = hasAptcMintConfigured;

/**
 * Trading live flag — explicit env only (no schedule-based auto-live).
 */
export function isAptcLaunched() {
  const forced = process.env.NEXT_PUBLIC_APTC_LAUNCHED?.trim().toLowerCase();
  return forced === 'true' || forced === '1';
}

/**
 * Get the current token contract address for display / links.
 */
export function getAptcMint() {
  const mint = rawTokenAddress();
  return hasAptcMintConfigured() ? mint : 'Coming soon';
}

/** Alias for EVM-oriented call sites */
export function getAptcTokenAddress() {
  return getAptcMint();
}

/**
 * Get the DexScreener pair address if available
 */
export function getAptcPairAddress() {
  return (
    process.env.NEXT_PUBLIC_APTC_DEXSCREENER_PAIR?.trim() ||
    APTC_DEXSCREENER_PAIR_DEFAULT ||
    null
  );
}

export function getVirtualsTokenPageUrl() {
  return process.env.NEXT_PUBLIC_APTC_VIRTUALS_URL?.trim() || VIRTUALS_TOKEN_PAGE_URL || '';
}

export function getDexscreenerPairPageUrl() {
  const pair = getAptcPairAddress();
  return pair ? `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}/${pair}` : null;
}

/** @deprecated Launch marketing removed — returns empty / neutral copy */
export function getLaunchStatusText() {
  return '';
}

/** @deprecated */
export function getLaunchBadgeVariant() {
  return isAptcLaunched() ? 'live' : 'soon';
}

/** @deprecated */
export function getLaunchStyles() {
  return {
    badgeColor: 'amber',
    badgeBg: 'bg-amber-500/[0.1]',
    badgeBorder: 'border-amber-500/35',
    badgeHoverBorder: 'hover:border-amber-400/50',
    badgeHoverBg: 'hover:bg-amber-500/[0.16]',
    badgeShadow: 'shadow-[0_0_24px_-6px_rgba(245,158,11,0.45)]',
    dotColor: 'bg-amber-400',
    dotShadow: 'shadow-[0_0_10px_rgba(251,191,36,0.4)]',
    textColor: 'text-amber-100',
    textColorSecondary: 'text-amber-300/70',
    textColorSecondaryHover: 'group-hover:text-amber-200',
  };
}

/** @deprecated */
export function getHeroImagePath() {
  return '/images/APTC-Launched.jpg';
}

/** @deprecated Launch teaser removed */
export const APTC_LAUNCH_TEASER_VIDEO_ID = '';

/** @deprecated */
export function getLaunchTeaserEmbedUrl() {
  return '';
}

/** @deprecated */
export function getHeroImageDimensions() {
  return { width: 1920, height: 1080 };
}

/** @deprecated */
export function getLaunchCtaHref() {
  return '/game';
}

/** @deprecated */
export function getLaunchCtaText() {
  return 'Play now →';
}
