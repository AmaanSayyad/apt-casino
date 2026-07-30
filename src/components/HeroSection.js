import { useState, useEffect } from "react";
import LaunchGameButton from "./LaunchGameButton";
import { CHAINS_SHORT } from "@/lib/copy/siteChains";

/** Product / brand teaser on the landing hero */
const HERO_TEASER_VIDEO_ID = "oWGWqhfEMng";
const HERO_TEASER_EMBED_URL = `https://www.youtube.com/embed/${HERO_TEASER_VIDEO_ID}?rel=0`;

export default function HeroSection() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === "development");
  }, []);

  return (
    <section
      id="hero"
      className="site-page-top site-hero site-page-pad-x relative flex w-full flex-col sm:px-10 md:px-20 lg:px-36"
    >
      <div className="font-display z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-4 sm:gap-6 text-center text-white">
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
        <div className="absolute -inset-1 bg-gradient-to-r from-red-magic/50 to-blue-magic/50 rounded-2xl blur-md" />
        <div className="relative">
          <div className="relative z-10 w-full overflow-hidden rounded-xl aspect-video bg-black ring-1 ring-white/10">
            <iframe
              src={HERO_TEASER_EMBED_URL}
              title="APT-Casino teaser"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          {isDev && (
            <div className="absolute top-4 right-4 z-20 rounded-md bg-yellow-600/80 px-2 py-1 text-xs text-white">
              Dev Mode
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
