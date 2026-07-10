'use client';

import {
  IPO_PRICE_LADDER,
  IPO_OVERSUB_COPY,
  IPO_SALE,
  formatIpoPriceUsd,
} from '@/lib/config/ipo';

/**
 * Compact launchpad price ladder (IPO → Listing → CEX).
 * @param {{ variant?: 'card' | 'inline' | 'strip'; className?: string }} props
 */
export default function IpoPriceLadder({ variant = 'card', className = '' }) {
  if (variant === 'inline') {
    return (
      <p className={`text-[11px] leading-relaxed text-white/45 ${className}`}>
        {IPO_OVERSUB_COPY}
      </p>
    );
  }

  if (variant === 'strip') {
    return (
      <div
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/50 ${className}`}
      >
        {IPO_PRICE_LADDER.map((tier, i) => (
          <span key={tier.id} className="inline-flex items-center gap-2">
            {i > 0 ? <span className="text-white/20">→</span> : null}
            <span
              className={
                tier.status === 'live'
                  ? 'font-semibold text-emerald-200/90'
                  : 'text-white/55'
              }
            >
              {tier.label}{' '}
              <span className="tabular-nums text-white/80">
                {formatIpoPriceUsd(tier.priceUsd)}
              </span>
              {tier.multiple > 1 ? (
                <span className="text-white/35"> ({tier.multiple}×)</span>
              ) : (
                <span className="text-emerald-300/70"> · entry</span>
              )}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/35 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3.5 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          Price ladder
        </p>
        <p className="text-[10px] text-white/30 tabular-nums">
          {formatIpoPriceUsd(IPO_PRICE_LADDER[0].priceUsd)}
          <span className="mx-1.5 text-white/15">→</span>
          {formatIpoPriceUsd(IPO_PRICE_LADDER[IPO_PRICE_LADDER.length - 1].priceUsd)}
        </p>
      </div>

      {/* Stages */}
      <div className="relative grid grid-cols-3">
        {/* Progress rail */}
        <div
          className="pointer-events-none absolute left-[16%] right-[16%] top-[18px] h-px bg-gradient-to-r from-emerald-400/50 via-white/15 to-white/10"
          aria-hidden
        />

        {IPO_PRICE_LADDER.map((tier) => {
          const live = tier.status === 'live';
          return (
            <div key={tier.id} className="relative px-2 pb-3.5 pt-3 text-center sm:px-3">
              <div className="relative z-[1] mx-auto mb-2.5 flex h-[9px] w-[9px] items-center justify-center">
                <span
                  className={`block h-[9px] w-[9px] rounded-full ring-2 ring-[#080008] ${
                    live
                      ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]'
                      : 'bg-white/25'
                  }`}
                />
              </div>

              <p
                className={`text-[9px] font-bold uppercase tracking-[0.16em] ${
                  live ? 'text-emerald-300/90' : 'text-white/35'
                }`}
              >
                {tier.label}
                {live ? (
                  <span className="ml-1 font-semibold normal-case tracking-normal text-emerald-400/80">
                    · now
                  </span>
                ) : null}
              </p>

              <p
                className={`mt-1 text-sm font-bold tabular-nums tracking-tight sm:text-[15px] ${
                  live ? 'text-white' : 'text-white/75'
                }`}
              >
                {formatIpoPriceUsd(tier.priceUsd)}
              </p>

              <p className={`mt-0.5 text-[10px] ${live ? 'text-emerald-200/65' : 'text-white/35'}`}>
                {live ? 'Discounted entry' : `${tier.multiple}× IPO`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Oversub */}
      <div className="border-t border-white/[0.06] px-3.5 py-2.5">
        <p className="text-[11px] leading-snug text-white/45">
          Oversubscribed →{' '}
          <span className="font-medium text-white/70">
            +{IPO_SALE.oversubTrancheTokensShort} @{' '}
            {formatIpoPriceUsd(IPO_SALE.oversubTranchePriceUsd)}
          </span>
          <span className="text-white/30"> (2×)</span>
        </p>
      </div>
    </div>
  );
}
