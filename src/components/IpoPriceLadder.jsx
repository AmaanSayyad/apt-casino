'use client';

import {
  formatIpoPriceUsd,
  getIpoPriceLadder,
  IPO_OVERSUB_COPY,
  IPO_SALE,
} from '@/lib/config/ipo';

/**
 * Minimal price path. Default = one-line strip (no second heavy card).
 * `variant="card"` kept for tokenomics / litepaper embeds.
 */
export default function IpoPriceLadder({
  variant = 'strip',
  className = '',
  ladder: ladderProp,
  activeRound,
}) {
  const ladder = ladderProp?.length ? ladderProp : getIpoPriceLadder();

  if (variant === 'inline') {
    return (
      <p className={`text-[11px] leading-relaxed text-white/45 ${className}`}>
        {IPO_OVERSUB_COPY}
      </p>
    );
  }

  // Default strip — used on IPO buy panel (exit path only; rounds already show sale prices)
  if (variant === 'strip') {
    const exits = ladder.filter((t) => t.kind !== 'sale');
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 ${className}`}
      >
        <p className="text-[11px] text-white/40">After Round 3</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          {exits.map((tier, i) => (
            <span key={tier.id} className="inline-flex items-center gap-3">
              {i > 0 ? <span className="text-white/15">→</span> : null}
              <span className="text-white/55">
                {tier.kind === 'listing' ? 'Raydium' : 'CEX Tier 3'}{' '}
                <span className="font-semibold tabular-nums text-white/85">
                  {formatIpoPriceUsd(tier.priceUsd)}
                </span>
                <span className="text-white/35"> ({tier.multiple}×)</span>
              </span>
            </span>
          ))}
        </div>
        {activeRound?.oversubscribed ? (
          <p className="w-full text-[11px] text-amber-200/80">
            Oversub live at {activeRound.oversubMultiple}×
          </p>
        ) : null}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 ${className}`}>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold text-white/80">Price path</p>
          <p className="text-[11px] tabular-nums text-white/35">
            {formatIpoPriceUsd(IPO_SALE.basePriceUsd)} → {formatIpoPriceUsd(IPO_SALE.cexPriceUsd)}
          </p>
        </div>

        <ol className="flex items-stretch gap-0 overflow-x-auto">
          {ladder.map((tier, i) => {
            const live = tier.status === 'live';
            const isLast = i === ladder.length - 1;
            const isExit = tier.kind !== 'sale';

            return (
              <li key={tier.id} className="flex min-w-0 flex-1 items-stretch">
                <div
                  className={`flex min-w-[4.5rem] flex-1 flex-col items-center justify-center px-1 py-2 text-center sm:min-w-0 ${
                    live ? 'rounded-xl bg-emerald-500/10' : ''
                  }`}
                >
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      live
                        ? 'text-emerald-300'
                        : isExit
                          ? 'text-fuchsia-300/70'
                          : 'text-white/40'
                    }`}
                  >
                    {tier.kind === 'listing'
                      ? 'List'
                      : tier.kind === 'cex'
                        ? 'CEX'
                        : tier.label}
                  </p>
                  <p
                    className={`mt-1 text-[13px] font-bold tabular-nums sm:text-[14px] ${
                      live ? 'text-white' : 'text-white/75'
                    }`}
                  >
                    {formatIpoPriceUsd(tier.priceUsd)}
                  </p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-white/35">{tier.multiple}×</p>
                </div>
                {!isLast ? (
                  <div className="flex w-3 shrink-0 items-center justify-center sm:w-4" aria-hidden>
                    <span className="block h-px w-full bg-white/15" />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        <p className="mt-3 text-[11px] text-white/40">
          After soft cap, each round keeps filling at its oversub × until the window ends or 250M sells out.
        </p>
      </div>
    );
  }

  return null;
}
