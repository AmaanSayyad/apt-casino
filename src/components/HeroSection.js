import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import LaunchGameButton from "./LaunchGameButton";
import { CHAINS_SHORT } from "@/lib/copy/siteChains";
import {
  isAptcLaunched,
  getLaunchStyles,
  getLaunchStatusText,
  getLaunchCtaText,
  getHeroImagePath,
  getHeroImageDimensions,
} from "@/lib/config/launchStatus";

export default function HeroSection() {
  const [isDev, setIsDev] = useState(false);
  const launched = isAptcLaunched();
  const styles = getLaunchStyles();
  const statusText = getLaunchStatusText();
  const ctaText = getLaunchCtaText();
  const imagePath = getHeroImagePath();
  const imageDimensions = getHeroImageDimensions();

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

        <h1 className="text-[2rem] font-extrabold leading-[1.15] sm:text-5xl md:text-6xl sm:leading-tight px-4">
          100% On-Chain{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
            Randomness
          </span>
        </h1>
        <h2 className="max-w-3xl px-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base md:text-lg">
          <span className="font-semibold text-white">Provably transparent</span> gaming with{" "}
          <span className="font-semibold text-white">verifiable on-chain randomness</span> on {CHAINS_SHORT}.{" "}
          <span className="hidden sm:inline">No rigged outcomes. No custody of your funds. </span>
          <span className="font-medium text-green-400">Pure, transparent GambleFi.</span>
        </h2>

        <div className="site-cta-row mt-6 sm:mt-8">
          <LaunchGameButton />
        </div>
      </div>

      <div className="relative mx-auto mt-10 w-full max-w-4xl sm:mt-12 px-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-magic/50 to-blue-magic/50 rounded-2xl blur-md"></div>
        <div className="relative">
          <Image
            src={imagePath}
            width={imageDimensions.width}
            height={imageDimensions.height}
            quality={100}
            priority
            alt={launched ? "APTC Casino - Token Launched" : "APT-Casino Gaming Platform"}
            className={`rounded-xl z-10 relative ${launched ? 'w-full h-auto' : ''}`}
          />

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
