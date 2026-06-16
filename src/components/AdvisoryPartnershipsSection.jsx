'use client';

import SocialProofCarousel from '@/components/SocialProofCarousel';

export default function AdvisoryPartnershipsSection() {
  return (
    <section className="advisory-section relative overflow-hidden border-t border-white/[0.06] bg-[#050004] py-16 md:py-24">
      <div className="advisory-section-glow pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[min(700px,90vw)] -translate-x-1/2 rounded-full bg-fuchsia-600/[0.06] blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 bottom-0 h-[280px] w-[400px] rounded-full bg-blue-600/[0.05] blur-[100px]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[min(1400px,96vw)] mx-auto px-4 md:px-8 lg:px-10">
        <header className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-red-magic to-blue-magic shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/40">
              Network & credibility
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display text-white tracking-tight leading-tight">
            Advisory Board &{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic via-fuchsia-400 to-blue-magic">
              Partnerships
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/50 leading-relaxed">
            Movement & BNB Chain leaders supporting the APT-Casino ecosystem.
          </p>
        </header>

        <SocialProofCarousel />
      </div>
    </section>
  );
}
