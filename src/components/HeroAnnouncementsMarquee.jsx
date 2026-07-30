'use client';

import { useMemo } from 'react';
import { PLATFORM_CREDENTIALS } from '@/lib/config/socialCredentials';

/**
 * Full-width infinite text marquee below the navbar.
 */
export default function HeroAnnouncementsMarquee() {
  const ANNOUNCEMENT_ITEMS = useMemo(() => [...PLATFORM_CREDENTIALS], []);
  const loopSegments = useMemo(
    () => [...ANNOUNCEMENT_ITEMS, ...ANNOUNCEMENT_ITEMS],
    [ANNOUNCEMENT_ITEMS],
  );

  if (!ANNOUNCEMENT_ITEMS.length) return null;

  return (
    <div
      className="hero-alert-marquee border-y border-purple-500/25 bg-[#070005] bg-gradient-to-r from-[#120008] via-[#070005] to-[#0d000c] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hidden md:block"
      role="region"
      aria-label="Platform announcements"
    >
      <div className="hero-alert-marquee-inner relative">
        <div className="hero-alert-marquee-fade hero-alert-marquee-fade--left" aria-hidden />
        <div className="hero-alert-marquee-fade hero-alert-marquee-fade--right" aria-hidden />
        <div
          className="hero-alert-marquee-track"
          style={{ '--hero-alert-marquee-duration': '38s' }}
        >
          {loopSegments.map((item, idx) => (
            <span
              key={`${item.text}-${idx}`}
              className="hero-alert-marquee-item inline-flex shrink-0 items-center gap-3 font-display text-sm font-medium leading-snug tracking-wide text-white/85 sm:text-[15px]"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-red-magic to-blue-magic shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                aria-hidden
              />
              <span className="whitespace-nowrap">{item.text}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
