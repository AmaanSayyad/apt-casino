'use client';

import { IPO_COPY, IPO_SALE, PINKSALE_LOGO_SRC } from '@/lib/config/ipo';

/** 3-level IPO affiliate tree — PinkSale-style mechanics */
export default function IpoAffiliateExplainer({ className = '' }) {
  return (
    <div className={`rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-4 md:p-5 ${className}`}>
      <div className="flex flex-wrap items-start gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PINKSALE_LOGO_SRC} alt="PinkSale" className="h-8 w-8 rounded-lg object-contain bg-black/30 p-1" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/80">
            {IPO_COPY.affiliateHeadline}
          </p>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">{IPO_COPY.affiliateIntro}</p>
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        {IPO_SALE.affiliateLevels.map((row) => (
          <li
            key={row.level}
            className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5"
          >
            <p className="text-sm font-bold text-white tabular-nums">{row.pct}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/70 mt-0.5">
              {row.label}
            </p>
            <p className="text-[11px] text-white/40 mt-1 leading-snug">{row.desc}</p>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-white/30 mt-3">
        Total referral budget: {IPO_SALE.affiliateTotalBps / 100}% of referred purchase volume · payout after{' '}
        {IPO_SALE.affiliateWithdrawMinDays}-day cliff
      </p>
    </div>
  );
}
