import Link from "next/link";
import { useState, useEffect } from "react";
import LaunchGameButton from "./LaunchGameButton";
import { CHAINS_SHORT } from "@/lib/copy/siteChains";
import {
  getLaunchStyles,
  getLaunchStatusText,
  getLaunchCtaText,
  getLaunchTeaserEmbedUrl,
} from "@/lib/config/launchStatus";

export default function HeroSection() {
  const [isDev, setIsDev] = useState(false);
  const styles = getLaunchStyles();
  const statusText = getLaunchStatusText();
  const ctaText = getLaunchCtaText();
  const teaserEmbedUrl = getLaunchTeaserEmbedUrl();

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  return (
    <section
      id="hero"
      className="site-page-top site-hero site-page-pad-x relative flex w-full flex-col sm:px-10 md:px-20 lg:px-36"
    >
      <div className="font-display z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-4 sm:gap-6 text-center text-white">
        <Link
          href="#tokenomics"
          className={`group inline-flex flex-wrap items-center justify-center gap-2.5 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 transition-all border ${styles.badgeBorder} ${styles.badgeBg} ${styles.badgeShadow} ${styles.badgeHoverBorder} ${styles.badgeHoverBg}`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${styles.dotColor}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${styles.dotColor}`} />
          </span>
          <span className={`text-sm font-bold sm:text-base ${styles.textColor}`}>
            {statusText}
          </span>
          <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.textColorSecondary} ${styles.textColorSecondaryHover}`}>
            {ctaText}
          </span>
        </Link>

        <h1 className="text-[2.25rem] font-extrabold leading-[1.1] sm:text-5xl md:text-6xl tracking-tight px-4">
          100% Provably Fair{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
            Gaming
          </span>
        </h1>
        <p className="max-w-2xl px-4 text-base leading-relaxed text-white/90 sm:text-lg md:text-xl font-medium">
          Verifiable on-chain randomness on {CHAINS_SHORT}.
        </p>
        <p className="max-w-2xl px-4 text-sm leading-relaxed text-white/60 sm:text-base">
          No rigged outcomes. No custody of your funds. Pure mathematics-based fairness.
        </p>

        <div className="w-full px-4 mt-8 sm:mt-10">
          <LaunchGameButton />
        </div>
      </div>

      <div className="relative mx-auto mt-12 w-full max-w-4xl sm:mt-16 px-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-magic/50 to-blue-magic/50 rounded-2xl blur-md"></div>
        <div className="relative">
          <div className="relative z-10 w-full overflow-hidden rounded-xl aspect-video bg-black ring-1 ring-white/10">
            <iframe
              src={teaserEmbedUrl}
              title="APTC launch teaser"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          {isDev && (
            <div className="absolute top-4 right-4 bg-yellow-600/80 text-white text-xs px-2 py-1 rounded-md z-20">
              Dev Mode
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
