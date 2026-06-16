'use client';

import { motion } from 'framer-motion';
import { ADVISORY_BOARD, ADVISOR_ACCENT_STYLES } from '@/lib/config/socialProofSlides';

export default function SocialProofCarousel() {
  return (
    <div className="relative z-10 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-8">
        {ADVISORY_BOARD.map((advisor, i) => (
          <AdvisorCard key={advisor.id} advisor={advisor} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

function AdvisorCard({ advisor, delay = 0 }) {
  const accent = ADVISOR_ACCENT_STYLES[advisor.accent] ?? ADVISOR_ACCENT_STYLES.cyan;
  const CardTag = advisor.xUrl ? motion.a : motion.article;
  const linkProps = advisor.xUrl
    ? {
        href: advisor.xUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `${advisor.name} on X`,
      }
    : {};

  return (
    <CardTag
      {...linkProps}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-32px' }}
      transition={{ duration: 0.5, delay }}
      className={`advisory-card group relative w-full overflow-hidden rounded-2xl md:rounded-3xl border bg-[#0a0008] transition-all duration-300 ${accent.border} ${accent.glow} ${
        advisor.xUrl ? 'cursor-pointer' : ''
      }`}
    >
      {/* 16:9 native aspect — images are 3200×1800 */}
      <div className="relative w-full aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={advisor.src}
          alt={advisor.alt}
          className={`absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.01] ${
            advisor.blurred ? 'advisory-card-img--blur scale-[1.08]' : ''
          }`}
          loading="lazy"
        />

        {advisor.blurred && (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center bg-black/30 px-6 text-center pointer-events-none">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/55">Confirmed</p>
            <p className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              {advisor.teaser}
            </p>
            <p className="mt-2 text-sm text-white/50 sm:text-base">{advisor.org} ecosystem</p>
          </div>
        )}

        <div className="absolute top-4 left-4 z-[3] sm:top-5 sm:left-5">
          <span
            className={`inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs ${accent.pill}`}
          >
            {advisor.org}
          </span>
        </div>

        <div className="apt-social-badge z-[3] !top-4 !right-4 sm:!top-5 sm:!right-5 text-[10px] sm:text-[11px] px-3 py-1.5">
          <span className="apt-social-badge-dot" />
          Confirmed
        </div>
      </div>
    </CardTag>
  );
}
