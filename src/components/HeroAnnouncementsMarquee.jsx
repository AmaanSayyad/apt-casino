'use client';

import { useMemo } from 'react';

const ANNOUNCEMENT_ITEMS = [
  'APT-Casino is backed by Aptos and supported as an Aptos Foundation grantee.',
  'APT-Casino has won 10 global Web3 hackathons and is gaining traction among leading ecosystems and the on-chain gaming industry.',
  'We have brought on two senior advisors from tier-1 crypto VCs and funds that back category-leading blockchain companies.',
];

/**
 * Full-width infinite text marquee (APT-Casino gradient / purple bar).
 * Duplicated track for seamless translateX(-50%) loop.
 */
export default function HeroAnnouncementsMarquee() {
  const loopSegments = useMemo(() => [...ANNOUNCEMENT_ITEMS, ...ANNOUNCEMENT_ITEMS], []);

  return (
    <div
      className="hero-alert-marquee border-y border-purple-500/25 bg-[#070005] bg-gradient-to-r from-[#120008] via-[#070005] to-[#0d000c] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      role="region"
      aria-label="Platform announcements"
    >
      <div className="hero-alert-marquee-inner relative">
        <div className="hero-alert-marquee-fade hero-alert-marquee-fade--left" aria-hidden />
        <div className="hero-alert-marquee-fade hero-alert-marquee-fade--right" aria-hidden />
        <div
          className="hero-alert-marquee-track"
          style={{ '--hero-alert-marquee-duration': '52s' }}
        >
          {loopSegments.map((text, idx) => (
            <span
              key={`${text}-${idx}`}
              className="hero-alert-marquee-item inline-flex shrink-0 items-center gap-4 font-display text-sm font-medium leading-snug tracking-wide text-white/90 sm:text-[15px]"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-red-magic to-blue-magic shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                aria-hidden
              />
              <span className="whitespace-nowrap">{text}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
