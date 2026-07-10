'use client';

import Link from 'next/link';
import IpoPurchasePanel from '@/components/IpoPurchasePanel';
import IpoSubhead from '@/components/IpoSubhead';
import IpoStackLogos from '@/components/IpoStackLogos';
import IpoBanner from '@/components/IpoBanner';
import { IPO_COPY, APTC_LOGO_SRC } from '@/lib/config/ipo';

export default function IpoSection() {
  return (
    <section
      id="ipo"
      className="border-y border-white/[0.06] bg-[#070005] py-16 md:py-20 site-page-pad-x"
    >
      <div className="max-w-[1600px] mx-auto w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={APTC_LOGO_SRC} alt="APTC" className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover ring-1 ring-white/10" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
                {IPO_COPY.headline}
              </h2>
            </div>
          </div>
          <Link
            href="/ipo"
            className="inline-flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10 transition-all"
          >
            Open full page
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <IpoSubhead className="mb-6" />
        <IpoStackLogos className="mb-6" />
        <IpoBanner className="mb-6" />

        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0008]/80 p-5 md:p-8 shadow-[0_24px_80px_-40px_rgba(192,38,211,0.45)]">
          <IpoPurchasePanel compact showBanner={false} />
        </div>
      </div>
    </section>
  );
}
