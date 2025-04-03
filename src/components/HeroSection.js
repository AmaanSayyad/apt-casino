import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import LaunchGameButton from "./LaunchGameButton";
import { ACTIVE_GAMES_COUNT } from "@/lib/gameRegistry";
import { CHAINS_SHORT } from "@/lib/copy/siteChains";
import { PITCH_DECK_URL } from "@/lib/pitchDeck";

export default function HeroSection() {
  const [isDev, setIsDev] = useState(false);
  const [totalPlayers, setTotalPlayers] = useState(null);
  const [playersUnavailable, setPlayersUnavailable] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/players/count')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setTotalPlayers(typeof d.totalPlayers === 'number' ? d.totalPlayers : 0);
        if (d.supabaseConfigured === false) setPlayersUnavailable(true);
      })
      .catch(() => !cancelled && setPlayersUnavailable(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="hero"
      className="site-page-top relative flex min-h-screen w-full flex-col px-4 sm:px-10 md:px-20 lg:px-36"
    >
      <div className="font-display z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-6 text-center capitalize text-white">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
          100% On-Chain{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
            Randomness
          </span>
        </h1>
        <h2 className="text-[#B3B3B3] mt-4 text-lg sm:text-xl leading-relaxed max-w-3xl">
          <span className="text-white font-semibold">Autonomous, provably transparent</span> gaming powered by{" "}
          <span className="text-white font-semibold">Multichain play</span> with{" "}
          <span className="text-white font-semibold">verifiable on-chain randomness</span> on {CHAINS_SHORT}.
          Experience decentralized fairness you can verify, not just trust.
        </h2>
        <p className="text-[#B3B3B3] text-lg sm:text-xl max-w-3xl">
          No rigged outcomes. No hidden limits. No custody of your funds.
          <span className="text-green-400 font-medium"> Just pure, transparent GambleFi</span> where mathematics replaces trust.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <LaunchGameButton />

          <Link
            href="/litepaper"
            className="mt-2 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 transition-all hover:border-white/20 hover:bg-white/10 sm:mt-0"
          >
            Litepaper
          </Link>

          <a
            href={PITCH_DECK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 transition-all hover:border-white/20 hover:bg-white/10 sm:mt-0"
          >
            Pitch deck
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12 bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-purple-600/20">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Players</p>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
              {totalPlayers == null ? '—' : totalPlayers.toLocaleString()}
            </p>
            {playersUnavailable && (
              <p className="text-[10px] text-amber-300/70 mt-1">SUPABASE_SERVICE_ROLE_KEY not set</p>
            )}
          </div>
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

      <div className="relative mt-12 w-full max-w-4xl mx-auto">
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
