import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import LaunchGameButton from "./LaunchGameButton";
import { ACTIVE_GAMES_COUNT } from "@/lib/gameRegistry";
import { CHAINS_SHORT } from "@/lib/copy/siteChains";
import { PITCH_DECK_URL } from "@/lib/pitchDeck";
import { LITEPAPER_PATH } from "@/lib/siteMetadata";

export default function HeroSection() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  return (
    <section
      id="hero"
      className="site-page-top site-hero site-page-pad-x relative flex w-full flex-col sm:px-10 md:px-20 lg:px-36"
    >
      <div className="font-display z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-4 sm:gap-6 text-center text-white">
        <h1 className="text-[1.75rem] font-extrabold leading-[1.12] sm:text-5xl md:text-6xl sm:leading-tight">
          100% On-Chain{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
            Randomness
          </span>
        </h1>
        <h2 className="max-w-3xl text-sm leading-relaxed text-[#B3B3B3] sm:mt-2 sm:text-lg md:text-xl">
          <span className="font-semibold text-white">Autonomous, provably transparent</span> gaming powered by{" "}
          <span className="font-semibold text-white">Multichain play</span> with{" "}
          <span className="font-semibold text-white">verifiable on-chain randomness</span> on {CHAINS_SHORT}.
          Experience decentralized fairness you can verify, not just trust.
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-[#B3B3B3] sm:text-lg md:text-xl">
          No rigged outcomes. No hidden limits. No custody of your funds.
          <span className="font-medium text-green-400"> Just pure, transparent GambleFi</span> where mathematics replaces trust.
        </p>

        <div className="site-cta-row mt-2 sm:mt-6">
          <LaunchGameButton />

          <Link
            href={LITEPAPER_PATH}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 transition-all hover:border-white/20 hover:bg-white/10"
          >
            Litepaper
          </Link>

          <a
            href={PITCH_DECK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 transition-all hover:border-white/20 hover:bg-white/10"
          >
            Pitch deck
          </a>
        </div>

        <div className="mt-8 grid w-full grid-cols-2 gap-3 rounded-xl border border-purple-600/20 bg-black/20 p-4 backdrop-blur-sm sm:mt-12 sm:gap-4 sm:p-6 md:grid-cols-3 md:gap-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Active Games</p>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
              {ACTIVE_GAMES_COUNT}
            </p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-gray-400 text-sm">Channel Finality</p>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
              ~instant
            </p>
          </div>
          <div className="text-center hidden md:block">
            <p className="text-gray-400 text-sm">Provably Fair</p>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
              100%
            </p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-8 w-full max-w-4xl sm:mt-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-magic/50 to-blue-magic/50 rounded-2xl blur-md"></div>
        <div className="relative">
          <Image
            src="/images/HeroImage.png"
            width={863}
            height={487}
            quality={100}
            priority
            alt="Hero image"
            className="rounded-xl z-10 relative"
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
