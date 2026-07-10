'use client';

import { IPO_COPY } from '@/lib/config/ipo';

/**
 * IPO subhead (two lines) + staking benefit chips (homepage + /ipo).
 */
export default function IpoSubhead({ className = '', alignWithTitle = false }) {
  const [primary, secondary] = IPO_COPY.subheadLines;

  return (
    <div className={className}>
      <div
        className={`max-w-4xl space-y-2.5 ${alignWithTitle ? 'md:pl-[3.75rem]' : ''}`}
      >
        <p className="text-[15px] md:text-base text-white/70 leading-relaxed text-pretty">
          {primary.text}
        </p>
        {secondary ? (
          <p
            className={`text-sm leading-relaxed text-pretty ${
              secondary.accent ? 'text-emerald-200/80' : 'text-white/50'
            }`}
          >
            {secondary.text}
          </p>
        ) : null}
      </div>
      <ul
        className={`mt-4 flex flex-wrap gap-2 ${alignWithTitle ? 'md:pl-[3.75rem]' : ''}`}
        aria-label="IPO staking benefits"
      >
        {IPO_COPY.stakingBenefits.map((item) => (
          <li
            key={item.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold text-emerald-100/90"
          >
            <span className="text-emerald-300" aria-hidden>
              ↑
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
