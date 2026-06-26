'use client';

import { useEffect, useMemo, useState } from 'react';
import HeaderText from '@/components/HeaderText';
import Image from 'next/image';
import MagicBorder from './MagicBorder';
import Link from 'next/link';
import { FaFire, FaUsers, FaTrophy, FaBolt, FaChevronRight, FaClock } from 'react-icons/fa';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSharedLiveStats } from '@/hooks/useSharedStats';
import { MOBILE_LIVE_GAME_ORDER, sortGamesByDisplayOrder } from '@/lib/gameDisplayOrder';

const LIVE_GAMES = [
  {
    status: 'live',
    slug: 'roulette',
    name: 'Roulette',
    img: '/images/games/roulette.png',
    link: '/game/roulette',
    categories: ['featured', 'table'],
    rtp: '97.3%',
  },
  {
    status: 'live',
    slug: 'plinko',
    name: 'Plinko',
    img: '/images/games/plinko.png',
    link: '/game/plinko',
    categories: ['featured', 'instant'],
    rtp: '97.1%',
  },
  {
    status: 'live',
    slug: 'mines',
    name: 'Mines',
    img: '/images/games/mines.png',
    link: '/game/mines',
    categories: ['featured', 'instant'],
    rtp: '97.1%',
  },
  {
    status: 'live',
    slug: 'wheel',
    name: 'Spin Wheel',
    img: '/images/games/spin_the_wheel.png',
    link: '/game/wheel',
    categories: ['featured', 'instant'],
    rtp: '96.8%',
  },
];

/** Not on-chain yet — shown as “Upcoming”, no fabricated player counts. */
const UPCOMING_GAMES = [
  {
    status: 'upcoming',
    slug: 'fortune-tiger',
    name: 'Fortune Tiger',
    img: '/images/games/fortune-tiger.png',
    link: '/game/fortune-tiger',
    categories: ['slots', 'jackpot'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'poker',
    name: 'Poker',
    img: '/images/games/poker.png',
    link: '/game/poker',
    categories: ['card', 'table'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'crash',
    name: 'Crash',
    img: '/images/games/crash.png',
    link: '/game/crash',
    categories: ['instant', 'featured'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'gates-of-olympus',
    name: 'Gates of Olympus',
    img: '/images/games/gates-of-olympus.png',
    link: '/game/gates-of-olympus',
    categories: ['slots', 'featured'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'carp-diem',
    name: 'Carp Diem',
    img: '/images/games/Carp_diem.png',
    link: '/game/carp-diem',
    categories: ['slots'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'fire-portal',
    name: 'Fire Portal',
    img: '/images/games/fire_portal.png',
    link: '/game/fire-portal',
    categories: ['instant'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'revenge-of-loki',
    name: 'Revenge of Loki',
    img: '/images/games/revenge_of_loki.png',
    link: '/game/revenge-of-loki',
    categories: ['slots'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'sugar-rush',
    name: 'Sugar Rush',
    img: '/images/games/sugar_rush.png',
    link: '/game/sugar-rush',
    categories: ['slots', 'jackpot'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'fire-in-the-hole',
    name: 'Fire in the Hole',
    img: '/images/games/fire_in_the_hole.png',
    link: '/game/fire-in-the-hole',
    categories: ['slots'],
    rtp: '—',
  },
  {
    status: 'upcoming',
    slug: 'dices',
    name: 'Dices',
    img: '/images/games/dices.png',
    link: '/game/dices',
    categories: ['table', 'instant'],
    rtp: '—',
  },
];

const FILTERS = [
  { id: 'all', label: 'All Games' },
  { id: 'featured', label: 'Featured' },
  { id: 'table', label: 'Table Games' },
  { id: 'slots', label: 'Slots' },
  { id: 'card', label: 'Card Games' },
  { id: 'instant', label: 'Instant Win' },
  { id: 'jackpot', label: 'Jackpot' },
];

export default function MostPlayed() {
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState('all');
  const { data: liveStats } = useSharedLiveStats();
  const gameActivity = liveStats?.gameActivity ?? {};
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const enriched = useMemo(() => {
    const live = LIVE_GAMES.map((g) => ({
      ...g,
      playersOnline: gameActivity[g.slug]?.playersOnline ?? 0,
      totalBets: gameActivity[g.slug]?.totalBets ?? 0,
    })).sort((a, b) => {
      if (b.playersOnline !== a.playersOnline) return b.playersOnline - a.playersOnline;
      return b.totalBets - a.totalBets;
    });

    const upcoming = UPCOMING_GAMES.map((g) => ({
      ...g,
      playersOnline: 0,
      totalBets: 0,
    })).sort((a, b) => a.name.localeCompare(b.name));

    return [...live, ...upcoming];
  }, [gameActivity]);

  const visibleGames = useMemo(() => {
    const base =
      activeFilter === 'all' ? enriched : enriched.filter((g) => g.categories.includes(activeFilter));
    if (!isMobile) return base;
    const live = sortGamesByDisplayOrder(
      base.filter((g) => g.status === 'live'),
      MOBILE_LIVE_GAME_ORDER,
      'slug',
    );
    const upcoming = base.filter((g) => g.status === 'upcoming');
    return [...live, ...upcoming];
  }, [activeFilter, enriched, isMobile]);

  const featuredGames = useMemo(() => {
    const live = enriched.filter((g) => g.status === 'live' && g.categories.includes('featured'));
    return isMobile ? sortGamesByDisplayOrder(live, MOBILE_LIVE_GAME_ORDER, 'slug') : live;
  }, [enriched, isMobile]);

  useEffect(() => {
    if (featuredGames.length < 2) return;
    const id = setInterval(() => {
      setFeaturedIndex((p) => (p + 1) % featuredGames.length);
    }, 5000);
    return () => clearInterval(id);
  }, [featuredGames.length]);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [featuredGames.length]);

  const currentFeatured = featuredGames[featuredIndex] ?? featuredGames[0] ?? null;

  return (
    <section className="container mx-auto px-3 sm:px-4 pt-2 md:pt-4 pb-10 md:pb-16 relative">
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-magic/5 blur-[100px] z-0 pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/4 w-60 h-60 rounded-full bg-red-magic/5 blur-[80px] z-0 pointer-events-none"></div>

      <div className="mb-5 md:mb-12 text-center max-w-3xl mx-auto">
        <HeaderText
          header="Popular Casino Games"
          description="Live games show real player counts from on-chain play. Other titles are marked Upcoming until they ship on Solana · Aptos."
        />
      </div>

      {currentFeatured && (
        <>
          {/* Mobile: compact featured row — keeps grid visible above the fold */}
          <Link
            href={currentFeatured.link}
            className="md:hidden mb-4 block rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-3 active:scale-[0.99] transition-transform"
          >
            <div className="flex gap-3 items-center">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10">
                <Image
                  src={currentFeatured.img}
                  alt={currentFeatured.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <span className="absolute top-1 left-1 rounded bg-gradient-to-r from-red-magic to-blue-magic px-1.5 py-0.5 text-[9px] font-bold text-white">
                  TOP
                </span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg font-bold text-white truncate">{currentFeatured.name}</h3>
                  {currentFeatured.status === 'live' && (
                    <span className="rounded-full border border-green-500/30 bg-green-900/30 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-white/55">
                  <span className="inline-flex items-center gap-1">
                    <FaUsers className="text-green-400/90" />
                    {currentFeatured.playersOnline.toLocaleString()} online
                  </span>
                  <span>·</span>
                  <span>{currentFeatured.rtp} RTP</span>
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-300">
                  Play now <FaChevronRight className="text-[10px]" />
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop: full hero */}
          <div className="mb-16 overflow-hidden hidden md:block">
            <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl">
              <div className="bg-black/80 rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
                  <div className="md:w-1/3 relative">
                    <MagicBorder>
                      <div className="aspect-[4/3] w-full relative overflow-hidden rounded-lg">
                        <Image
                          src={currentFeatured.img}
                          alt={currentFeatured.name}
                          fill
                          quality={100}
                          className="rounded-lg object-cover"
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-red-magic to-blue-magic text-white text-xs font-bold py-1 px-2 rounded-full flex items-center gap-1">
                          <FaFire className="text-yellow-300" /> TOP PICK
                        </div>
                      </div>
                    </MagicBorder>
                  </div>

                  <div className="md:w-2/3 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3 flex-wrap">
                      <h3 className="font-display text-2xl md:text-3xl font-bold text-white">
                        {currentFeatured.name}
                      </h3>
                      {currentFeatured.status === 'live' && (
                        <div className="flex items-center gap-1.5 bg-green-900/30 border border-green-500/30 px-2 py-0.5 rounded-full">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-green-400 text-xs font-medium">LIVE</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                        <FaUsers className="text-green-400" />
                        <span>
                          {currentFeatured.playersOnline.toLocaleString()}{' '}
                          {currentFeatured.playersOnline === 1 ? 'player online' : 'players online'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                        <FaTrophy className="text-yellow-400" />
                        <span>{currentFeatured.rtp} RTP</span>
                      </div>
                    </div>

                    <p className="text-white/80 mb-6 max-w-2xl">
                      Experience {currentFeatured.name} — server-verified outcomes, commit/reveal fairness proofs, and
                      on-chain deposit/withdraw rails (Solana · Aptos).
                    </p>

                    <Link href={currentFeatured.link}>
                      <button className="bg-gradient-to-r from-red-magic to-blue-magic hover:from-blue-magic hover:to-red-magic transition-all duration-300 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2">
                        Play {currentFeatured.name} Now <FaChevronRight />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mb-5 md:mb-8 -mx-3 sm:-mx-4 px-3 sm:px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max min-w-full pb-0.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-gradient-to-r from-red-magic to-blue-magic text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-opacity duration-300">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {visibleGames.map((game) => {
            const isUpcoming = game.status === 'upcoming';
            return (
              <div
                key={game.slug}
                className={`group relative flex flex-col transition-all duration-300 md:hover:translate-y-[-8px] ${isUpcoming ? 'opacity-95' : ''}`}
              >
                <Link href={game.link} className="block w-full" title={isUpcoming ? 'Coming soon' : undefined}>
                  <MagicBorder>
                    <div className="aspect-[1/1] relative overflow-hidden rounded-lg shadow-lg">
                      <Image
                        src={game.img}
                        alt={game.name}
                        fill
                        quality={90}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="rounded-lg object-cover transition-transform duration-500 group-hover:scale-110"
                        style={{ objectFit: 'cover' }}
                      />

                      {isUpcoming ? (
                        <>
                          <div className="absolute top-2 left-2 bg-amber-950/80 backdrop-blur-sm text-xs py-1 px-2 rounded-full flex items-center gap-1.5 border border-amber-500/40 text-amber-100">
                            <FaClock className="text-amber-400" />
                            <span>Upcoming</span>
                          </div>
                          <div className="absolute top-2 right-2 bg-slate-900/85 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-full border border-white/15">
                            Soon
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-xs py-1 px-2 rounded-full flex items-center gap-1.5">
                            <FaUsers className="text-green-400" />
                            <span>{game.playersOnline.toLocaleString()}</span>
                          </div>
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs py-1 px-2 rounded-full flex items-center gap-1.5">
                            <FaFire className="text-yellow-300" /> LIVE
                          </div>
                        </>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3 flex justify-between items-center gap-1">
                          <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                            {game.rtp === '—' ? 'RTP TBD' : `${game.rtp} RTP`}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                              isUpcoming
                                ? 'bg-amber-600/90 text-white'
                                : 'bg-gradient-to-r from-red-magic to-blue-magic text-white'
                            }`}
                          >
                            <FaBolt /> {isUpcoming ? 'SOON' : 'PLAY'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </MagicBorder>

                  <div className="mt-2 md:mt-3 flex flex-col items-center">
                    <div className="flex items-center gap-1.5 justify-center flex-wrap">
                      <h3 className="font-display text-xs sm:text-sm md:text-base font-semibold tracking-wide text-white text-center leading-tight">
                        {game.name}
                      </h3>
                      {isUpcoming ? (
                        <div className="flex items-center gap-1 bg-amber-900/35 border border-amber-500/35 px-1.5 py-0.5 rounded-full">
                          <FaClock className="text-amber-400 text-[10px]" />
                          <span className="text-amber-200 text-[10px] font-medium">UPCOMING</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-green-900/30 border border-green-500/30 px-1.5 py-0.5 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-green-400 text-[10px] font-medium">LIVE</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-white/55 mt-0.5 text-center px-0.5 line-clamp-2">
                      {isUpcoming
                        ? 'Not on-chain yet — launching soon'
                        : game.playersOnline === 0
                          ? `${game.totalBets.toLocaleString()} bets all-time`
                          : `${game.playersOnline.toLocaleString()} online · ${game.totalBets.toLocaleString()} bets`}
                    </p>
                    <span
                      className={`mt-1.5 md:mt-2 hidden md:inline-block py-1 px-2 text-xs rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        isUpcoming ? 'bg-amber-600/80' : 'bg-gradient-to-r from-red-magic to-blue-magic'
                      }`}
                    >
                      {isUpcoming ? 'Coming soon' : 'Play now'}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {!visibleGames.length && (
        <div className="text-center py-12 bg-black/20 backdrop-blur-sm rounded-xl border border-white/5">
          <div className="text-white/50 mb-4 text-6xl">🎮</div>
          <h3 className="text-xl text-white mb-2">No games found</h3>
          <p className="text-white/70 mb-4">Try selecting a different category</p>
          <button
            onClick={() => setActiveFilter('all')}
            className="bg-gradient-to-r from-red-magic to-blue-magic text-white px-4 py-2 rounded-full text-sm"
          >
            View All Games
          </button>
        </div>
      )}
    </section>
  );
}
