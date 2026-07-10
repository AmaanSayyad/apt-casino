"use client";
import { useState, useRef, useEffect } from "react";
import GradientBorderButton from "@/components/GradientBorderButton";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaUsers, FaStar, FaBolt, FaFire, FaTrophy } from "react-icons/fa6";
import HeaderText from "@/components/HeaderText";
import { useSharedLiveStats } from "@/hooks/useSharedStats";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MOBILE_LIVE_GAME_ORDER, sortGamesByDisplayOrder } from "@/lib/gameDisplayOrder";

// Game data with more details
const FEATURED_GAMES = [
  {
    id: 'roulette',
    title: 'Roulette',
    description: 'Spin the wheel and test your luck',
    image: '/images/games/roulette.png',
    path: '/game/roulette',
    categories: ['featured', 'table'],
    badge: 'POPULAR',
    badgeColor: 'from-red-500 to-orange-500',
    isNew: false,
    isHot: true,
  },
  {
    id: 'mines',
    title: 'Mines',
    description: 'Navigate through the minefield and collect gems',
    image: '/images/games/mines.png',
    path: '/game/mines',
    categories: ['featured', 'instant'],
    badge: 'HOT',
    badgeColor: 'from-green-500 to-emerald-500',
    isNew: false,
    isHot: true,
  },
  {
    id: 'wheel',
    title: 'Spin Wheel',
    description: 'Spin the wheel of fortune for amazing prizes',
    image: '/images/games/spin_the_wheel.png',
    path: '/game/wheel',
    categories: ['featured', 'instant'],
    badge: 'FEATURED',
    badgeColor: 'from-purple-500 to-pink-500',
    isNew: false,
    isHot: true,
  },
  {
    id: 'plinko',
    title: 'Plinko',
    description: 'Drop the ball and watch it bounce to big wins',
    image: '/images/games/plinko.png',
    path: '/game/plinko',
    categories: ['featured', 'instant'],
    badge: 'POPULAR',
    badgeColor: 'from-blue-500 to-cyan-500',
    isNew: false,
    isHot: true,
  }
];

// Available category filters
const CATEGORIES = [
  { id: 'all', label: 'All Games' },
  { id: 'featured', label: 'Featured' },
  { id: 'table', label: 'Table Games' },
  { id: 'instant', label: 'Instant Win' },
];

const GameCarousel = () => {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleGames, setVisibleGames] = useState(FEATURED_GAMES);
  const { data: liveStats } = useSharedLiveStats();
  const gameActivity = liveStats?.gameActivity ?? {};
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragMovedRef = useRef(false);

  const isCarouselDragTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return !target.closest('a, button, input, textarea, select, [data-no-carousel-drag]');
  };
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Filter games when category changes; on mobile put wheel & mines first (roulette/plinko last)
  useEffect(() => {
    let list =
      activeCategory === 'all'
        ? FEATURED_GAMES
        : FEATURED_GAMES.filter((game) => game.categories.includes(activeCategory));
    if (isMobile) {
      list = sortGamesByDisplayOrder(list, MOBILE_LIVE_GAME_ORDER, 'id');
    }
    setVisibleGames(list);
  }, [activeCategory, isMobile]);

  // Check if scroll arrows should be visible
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Initial check
      checkScroll();
      
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [visibleGames]);

  // Handle manual scrolling
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -520, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 520, behavior: "smooth" });
    }
  };

  // Mouse drag scrolling (skip links/buttons so Play Now still navigates)
  const handleMouseDown = (e) => {
    if (!isCarouselDragTarget(e.target)) return;
    dragMovedRef.current = false;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 4) dragMovedRef.current = true;
    if (!dragMovedRef.current) return;
    e.preventDefault();
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragMovedRef.current = false;
  };

  // Game card: two-column layout so art always fills the right pane (fixed aspect-ratio
  // assets like roulette/plinko no longer float small with object-contain in a loose box).
  const GameCard = ({ game }) => (
    <div className="flex-shrink-0 w-[320px] sm:w-[400px] md:w-[520px] p-0.5 magic-gradient rounded-xl h-[300px] transform transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl group">
      <div className="bg-sharp-black flex h-full w-full rounded-xl overflow-hidden relative">
        <div className="relative z-10 flex min-w-0 w-[52%] sm:w-[50%] flex-col justify-between p-5 md:p-6 lg:p-8">
          {/* Game badge */}
          {game.badge && (
            <span className={`p-1.5 px-3 w-fit bg-gradient-to-r ${game.badgeColor} font-display text-white font-medium rounded-md flex items-center gap-1.5`}>
              {game.isNew && <FaBolt className="text-xs" />}
              {game.isHot && <FaFire className="text-xs" />}
              {game.badge}
            </span>
          )}

          <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-3 min-h-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white group-hover:text-gradient transition-all">
                {game.title}
              </h3>
              {(game.id === 'roulette' || game.id === 'plinko' || game.id === 'mines' || game.id === 'wheel') && (
                <div className="flex items-center gap-1 bg-green-900/30 border border-green-500/30 px-2 py-0.5 rounded-full shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400 text-xs font-medium">LIVE</span>
                </div>
              )}
            </div>
            <p className="text-xs md:text-sm text-white/80 line-clamp-3">{game.description}</p>

            <div className="flex items-center gap-2 text-white/70">
              <FaUsers className="text-green-500 shrink-0" />
              <span className="text-xs">
                {(gameActivity[game.id]?.playersOnline ?? 0).toLocaleString()} players online
              </span>
            </div>
          </div>

          <div className="w-full mt-3 sm:mt-4 shrink-0 relative z-20">
            <Link
              href={game.path}
              className="block w-full"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <GradientBorderButton className="w-full">Play Now</GradientBorderButton>
            </Link>
          </div>
        </div>

        <div className="relative z-0 min-w-0 flex-1 h-full transition-transform duration-300 group-hover:scale-[1.02]">
          <Image
            src={game.image}
            alt={`${game.title} game`}
            fill
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 260px"
            quality={90}
            priority
            className="object-cover object-center drop-shadow-lg"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-r from-sharp-black via-sharp-black/70 to-transparent" />
      </div>
    </div>
  );

  return (
    <div className="pt-12 pb-6 container mx-auto px-4 relative">
      {/* Decorative elements */}
      <div className="absolute -top-40 -left-20 w-80 h-80 rounded-full bg-red-magic/5 blur-[100px] z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-60 h-60 rounded-full bg-blue-magic/5 blur-[80px] z-0"></div>
    
      <div className="mb-12 text-center lg:text-left">
        <HeaderText header="Featured Games" />
      </div>
      
      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              activeCategory === category.id
                ? 'bg-gradient-to-r from-red-magic to-blue-magic text-white font-medium'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Carousel container with scroll controls */}
      <div className="relative">
        {/* Left scroll arrow - only shown when content is scrolled */}
        {showLeftArrow && (
          <button
            onClick={handleScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black border border-white/20 h-10 w-10 rounded-full flex items-center justify-center"
            aria-label="Scroll left"
          >
            <FaArrowLeft className="text-white text-sm" />
          </button>
        )}
        
        {/* Right scroll arrow - only shown when more content is available */}
        {showRightArrow && (
          <button
            onClick={handleScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black border border-white/20 h-10 w-10 rounded-full flex items-center justify-center"
            aria-label="Scroll right"
          >
            <FaArrowRight className="text-white text-sm" />
          </button>
        )}

        {/* Game cards container */}
        <div
          ref={scrollContainerRef}
          className={`flex overflow-x-auto custom-scrollbar pb-4 pl-1 snap-x ${
            isDragging ? 'cursor-grabbing select-none' : ''
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="flex gap-6 mx-auto">
            {visibleGames.length > 0 ? (
              visibleGames.map(game => (
                <div key={game.id} className="snap-start">
                  <GameCard game={game} />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full py-10">
                <p className="text-white/70 text-lg">No games found in this category</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dots navigation for mobile - simplified version */}
      <div className="flex gap-1.5 justify-center mt-6">
        {visibleGames.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (scrollContainerRef.current) {
                const cardWidth = 520 + 24; // Card width + gap
                scrollContainerRef.current.scrollLeft = index * cardWidth;
              }
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === Math.floor(
                (scrollContainerRef.current?.scrollLeft || 0) / 
                (scrollContainerRef.current?.clientWidth || 1)
              )
                ? 'bg-white w-4'
                : 'bg-white/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
    </div>
  );
};

export default GameCarousel;