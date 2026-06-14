'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PLATFORM_CREDENTIALS } from '@/lib/config/socialCredentials';

const ANNOUNCEMENT_ITEMS = [
  { text: '$APTC is now live on Solana', primary: true },
  ...PLATFORM_CREDENTIALS,
];

/**
 * Full-width infinite text marquee below the navbar.
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
          style={{ '--hero-alert-marquee-duration': '38s' }}
        >
          {loopSegments.map((item, idx) => (
            <span
              key={`${item.text}-${idx}`}
              className={`hero-alert-marquee-item inline-flex shrink-0 items-center gap-3 font-display text-sm font-medium leading-snug tracking-wide sm:text-[15px] ${
                item.primary ? 'text-emerald-200' : 'text-white/85'
              }`}
            >
              {item.primary ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                  Live
                </span>
              ) : (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-red-magic to-blue-magic shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                  aria-hidden
                />
              )}
              {item.primary ? (
                <Link href="/#tokenomics" className="whitespace-nowrap hover:text-white transition-colors">
                  {item.text}
                </Link>
              ) : (
                <span className="whitespace-nowrap">{item.text}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
