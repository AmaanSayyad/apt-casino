'use client';

import dynamic from 'next/dynamic';

const AllocationDonut = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.AllocationDonut),
  { ssr: false, loading: () => <div className="h-[320px] animate-pulse rounded-xl bg-white/5" /> },
);

export default function LitepaperAllocationBlock({ section, sectionLabel, sectionNumber }) {
  const num = sectionNumber(section.title);

  return (
    <article id={section.id} className="lp-section-card scroll-mt-32 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6">
        <header className="flex items-start gap-3">
          {num && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-black text-white/50">
              {num}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white sm:text-xl">{sectionLabel(section.title)}</h3>
            <div className="mt-3 w-full space-y-3">
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-sm leading-7 text-white/65 sm:text-[15px] sm:leading-7">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </header>
      </div>

      <div className="p-5 sm:p-7 md:p-8">
        <div className="lp-gradient-border rounded-2xl">
          <div className="lp-gradient-inner rounded-2xl bg-[#0a0008] px-4 py-8 sm:px-8 sm:py-10">
            <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300/60">
              1B APTC · full supply allocation
            </p>
            <p className="mb-6 text-center text-xs text-white/45">
              Chart = 100% of max supply
            </p>
            <AllocationDonut variant="litepaper" />
          </div>
        </div>
      </div>
    </article>
  );
}
