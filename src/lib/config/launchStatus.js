/**
 * Central launch status configuration
 * Controls conditional UI across the site for APTC pre-launch vs live trading.
 *
 * Launch venue: Virtuals Protocol on Robinhood Chain (agent token + EconomyOS).
 * IMPORTANT: A mint/CA alone does NOT mean trading is live.
 * "Live" = NEXT_PUBLIC_APTC_LAUNCHED=true (flip at TGE open).
 */

/** Scheduled public launch — 27 Jul 2026 11:30 AM IST (UTC+5:30) = 06:00 UTC */
export const APTC_SCHEDULED_LAUNCH_LABEL = '27 Jul 2026 · 11:30 AM IST';
export const APTC_SCHEDULED_LAUNCH_ISO = '2026-07-27T06:00:00.000Z';

/** Published Virtuals agent page */
export const VIRTUALS_TOKEN_PAGE_URL = 'https://app.virtuals.io/virtuals/122676';
export const VIRTUALS_CREATE_URL = 'https://app.virtuals.io/create';
export const VIRTUALS_APP_URL = 'https://app.virtuals.io';
export const DEXSCREENER_CHAIN_SLUG = 'robinhood';

/** APTC contract on Robinhood Chain (Virtuals TGE) */
export const APTC_TOKEN_ADDRESS_DEFAULT = '0x11857646a9c3B3272fa03339CC9f1c09D05B00Ae';

/** DexScreener pair on Robinhood */
export const APTC_DEXSCREENER_PAIR_DEFAULT = '0xAa72A7FA34cF000411cd07aB1370B5235c672131';

/**
 * Prefer NEXT_PUBLIC_APTC_TOKEN_ADDRESS (EVM / Robinhood).
 * Falls back to legacy NEXT_PUBLIC_APTC_SOLANA_MINT, then published default CA.
 */
function rawTokenAddress() {
  return (
    process.env.NEXT_PUBLIC_APTC_TOKEN_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim() ||
    APTC_TOKEN_ADDRESS_DEFAULT
  );
}

/**
 * Token contract configured (explorer / post-create prep).
 * Distinct from public trading being live.
 */
export function hasAptcMintConfigured() {
  const mint = rawTokenAddress();
  return Boolean(mint && mint !== 'Launching soon' && mint.length >= 20);
}

/** @deprecated Use hasAptcMintConfigured — kept for older imports */
export const hasAptcTokenConfigured = hasAptcMintConfigured;

/**
 * Public trading live — explicit flag only (pair may exist before countdown ends).
 */
export function isAptcLaunched() {
  const forced = process.env.NEXT_PUBLIC_APTC_LAUNCHED?.trim().toLowerCase();
  if (forced === 'true' || forced === '1') return true;
  if (forced === 'false' || forced === '0') return false;
  // No explicit flag: treat as live once scheduled open time has passed AND pair exists
  if (!getAptcPairAddress()) return false;
  return Date.now() >= Date.parse(APTC_SCHEDULED_LAUNCH_ISO);
}

/**
 * Get the current token contract address for display / links.
 * Returns the address when configured, otherwise 'Launching soon'.
 */
export function getAptcMint() {
  const mint = rawTokenAddress();
  return hasAptcMintConfigured() ? mint : 'Launching soon';
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
  return (
    process.env.NEXT_PUBLIC_APTC_VIRTUALS_URL?.trim() || VIRTUALS_TOKEN_PAGE_URL
  );
}

export function getDexscreenerPairPageUrl() {
  const pair = getAptcPairAddress();
  return pair ? `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}/${pair}` : null;
}

/**
 * Get launch status text for badges and announcements
 */
export function getLaunchStatusText() {
  return isAptcLaunched()
    ? '$APTC is now Live on Robinhood Chain'
    : `$APTC Launching ${APTC_SCHEDULED_LAUNCH_LABEL} · Virtuals`;
}

/**
 * Get launch status badge variant
 * Returns 'live' or 'soon'
 */
export function getLaunchBadgeVariant() {
  return isAptcLaunched() ? 'live' : 'soon';
}

/**
 * Get launch-specific styling
 */
export function getLaunchStyles() {
  const variant = getLaunchBadgeVariant();

  if (variant === 'live') {
    return {
      badgeColor: 'emerald',
      badgeBg: 'bg-emerald-500/[0.1]',
      badgeBorder: 'border-emerald-500/35',
      badgeHoverBorder: 'hover:border-emerald-400/50',
      badgeHoverBg: 'hover:bg-emerald-500/[0.16]',
      badgeShadow: 'shadow-[0_0_24px_-6px_rgba(16,185,129,0.45)]',
      dotColor: 'bg-emerald-400',
      dotShadow: 'shadow-[0_0_12px_rgba(52,211,153,0.65)]',
      textColor: 'text-emerald-100',
      textColorSecondary: 'text-emerald-300/70',
      textColorSecondaryHover: 'group-hover:text-emerald-200',
    };
  }

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

/**
 * Get hero image path based on launch status (post-launch only)
 */
export function getHeroImagePath() {
  return '/images/APTC-Launched.jpg';
}

/** YouTube embed for pre-launch teaser */
export const APTC_LAUNCH_TEASER_VIDEO_ID = 'oWGWqhfEMng';

export function getLaunchTeaserEmbedUrl() {
  return `https://www.youtube.com/embed/${APTC_LAUNCH_TEASER_VIDEO_ID}?rel=0`;
}

/**
 * Get hero image dimensions based on launch status
 */
export function getHeroImageDimensions() {
  return isAptcLaunched()
    ? { width: 1920, height: 1080 }
    : { width: 2048, height: 1152 };
}

/**
 * Primary CTA target for launch badges
 */
export function getLaunchCtaHref() {
  if (isAptcLaunched()) {
    const pairUrl = getDexscreenerPairPageUrl();
    if (pairUrl) return pairUrl;
    return getVirtualsTokenPageUrl();
  }
  return getVirtualsTokenPageUrl();
}

/**
 * Get CTA link text based on launch status
 */
export function getLaunchCtaText() {
  return isAptcLaunched() ? 'Trade now →' : 'View on Virtuals →';
}
