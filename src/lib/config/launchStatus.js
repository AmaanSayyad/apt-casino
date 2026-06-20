/**
 * Central launch status configuration
 * This determines if APTC token is launched and controls all conditional UI across the site
 */

/**
 * Check if the APTC token is launched
 * Returns true when NEXT_PUBLIC_APTC_SOLANA_MINT is configured
 */
export function isAptcLaunched() {
  const mint = process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim();
  return Boolean(mint && mint !== 'Launching soon' && mint.length > 20);
}

/**
 * Get the current token mint address
 * Returns the mint address if launched, otherwise 'Launching soon'
 */
export function getAptcMint() {
  const mint = process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim();
  return isAptcLaunched() ? mint : 'Launching soon';
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
    ? '$APTC is now Live on Solana'
    : '$APTC Launching Soon on Solana';
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
 * Get hero image path based on launch status
 */
export function getHeroImagePath() {
  return isAptcLaunched() 
    ? '/images/APTC-Launched.jpg'
    : '/22launch.jpg';
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
 * Get CTA link text based on launch status
 */
export function getLaunchCtaText() {
  return isAptcLaunched() ? 'Trade now →' : 'Learn more →';
}
