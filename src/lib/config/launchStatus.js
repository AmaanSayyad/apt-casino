/**
 * Central launch status configuration
 * Controls conditional UI across the site for APTC pre-launch vs live trading.
 *
 * Launch venue: Virtuals Protocol on Robinhood Chain (agent token + EconomyOS).
 * IMPORTANT: A token address alone does NOT mean launched.
 * "Live" = public trading (DexScreener pair set, or NEXT_PUBLIC_APTC_LAUNCHED=true).
 */

/** Scheduled Virtuals launch window (from create form). Display only — not a hard gate. */
export const APTC_SCHEDULED_LAUNCH_LABEL = '26 Jul 2026 · 23:30';

export const VIRTUALS_CREATE_URL = 'https://app.virtuals.io/create';
export const VIRTUALS_APP_URL = 'https://app.virtuals.io';
export const DEXSCREENER_CHAIN_SLUG = 'robinhood';

/**
 * Prefer NEXT_PUBLIC_APTC_TOKEN_ADDRESS (EVM / Robinhood).
 * Falls back to legacy NEXT_PUBLIC_APTC_SOLANA_MINT for older env files.
 */
function rawTokenAddress() {
  return (
    process.env.NEXT_PUBLIC_APTC_TOKEN_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim() ||
    ''
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
 * Public trading live (Virtuals token live + indexed pair, or explicit flag).
 */
export function isAptcLaunched() {
  const forced = process.env.NEXT_PUBLIC_APTC_LAUNCHED?.trim().toLowerCase();
  if (forced === 'true' || forced === '1') return true;
  if (forced === 'false' || forced === '0') return false;
  return Boolean(getAptcPairAddress());
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
  const pair = process.env.NEXT_PUBLIC_APTC_DEXSCREENER_PAIR?.trim();
  return pair || null;
}

/**
 * Get launch status text for badges and announcements
 */
export function getLaunchStatusText() {
  return isAptcLaunched()
    ? '$APTC is now Live on Robinhood Chain'
    : '$APTC Launching Soon on Virtuals · Robinhood';
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
    const pair = getAptcPairAddress();
    if (pair) return `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}/${pair}`;
    const mint = getAptcMint();
    if (hasAptcMintConfigured()) {
      return `https://dexscreener.com/${DEXSCREENER_CHAIN_SLUG}/${mint}`;
    }
    return '/#tokenomics';
  }
  return '/#tokenomics';
}

/**
 * Get CTA link text based on launch status
 */
export function getLaunchCtaText() {
  return isAptcLaunched() ? 'Trade now →' : 'Virtuals launch →';
}
