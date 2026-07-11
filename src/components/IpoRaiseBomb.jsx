'use client';

import { Sparkles } from 'lucide-react';

function fmt(n, opts = {}) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, opts);
}

function fmtUsd(n) {
  if (!Number.isFinite(Number(n))) return '—';
  return `$${Number(n).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function formatProgressPct(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n) || n <= 0) return '0%';
  if (n < 0.01) return '<0.01%';
  if (n < 1) return `${n.toFixed(2)}%`;
  if (n < 10) return `${n.toFixed(2)}%`;
  return `${n.toFixed(1)}%`;
}

/**
 * Hero raise meter — sits above the countdown. Soft-cap fill + inventory left.
 */
export default function IpoRaiseBomb({
  focusRound,
  aptcCommitted,
  inventoryCapAptc,
  remainingAptc,
  soldOut = false,
}) {
  if (!focusRound && !inventoryCapAptc) return null;

  const rawPct = Number(focusRound?.pctOfSoftCap) || 0;
  const barPct = Math.min(100, Math.max(0, rawPct));
  // Keep a visible sliver early so the bar doesn't look empty when raise is tiny.
  const fillW = barPct > 0 ? Math.max(barPct, 2.5) : 0;
  const live = focusRound?.status === 'live';
  const oversub = Boolean(focusRound?.oversubscribed);
  const roundLabel = focusRound
    ? focusRound.shortLabel || `R${focusRound.id}`
    : 'IPO';
  const committed = focusRound?.committedUsd;
  const softCap = focusRound?.softCapUsd;
  const invLeft =
    soldOut
      ? 0
      : Number.isFinite(Number(remainingAptc))
        ? Number(remainingAptc)
        : null;
  const invSoldPct =
    inventoryCapAptc > 0 && Number.isFinite(Number(aptcCommitted))
      ? Math.min(100, (Number(aptcCommitted) / Number(inventoryCapAptc)) * 100)
      : 0;

  return (
    <section
      className={`ipo-raise-bomb relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${
        live
          ? 'border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/[0.16] via-violet-600/[0.1] to-amber-500/[0.08]'
          : 'border-white/[0.1] bg-white/[0.03]'
      }`}
      aria-label={`${roundLabel} raise progress`}
    >
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-fuchsia-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl"
        aria-hidden
      />
      <div className="ipo-raise-bomb-sparks pointer-events-none absolute inset-0" aria-hidden>
        <span className="ipo-raise-spark ipo-raise-spark--1" />
        <span className="ipo-raise-spark ipo-raise-spark--2" />
        <span className="ipo-raise-spark ipo-raise-spark--3" />
        <span className="ipo-raise-spark ipo-raise-spark--4" />
        <span className="ipo-raise-spark ipo-raise-spark--5" />
        <span className="ipo-raise-spark ipo-raise-spark--6" />
      </div>

      <div className="relative z-[1]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {live ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                  Live
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-200/90">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                {roundLabel} soft cap
              </span>
              {oversub ? (
                <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  Oversub
                </span>
              ) : null}
            </div>

            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-3xl font-black tabular-nums tracking-tight text-white sm:text-4xl">
                {fmtUsd(committed)}
              </span>
              <span className="text-base font-semibold text-white/35 sm:text-lg">
                / {fmtUsd(softCap)}
              </span>
            </p>
          </div>

          <div className="text-right">
            <p className="ipo-raise-bomb-pct text-4xl font-black tabular-nums leading-none tracking-tight text-transparent sm:text-5xl">
              {formatProgressPct(rawPct)}
            </p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              filled
            </p>
          </div>
        </div>

        {/* Progress bomb bar */}
        <div className="ipo-raise-bomb-track relative mt-4 h-3.5 overflow-hidden rounded-full bg-black/50 shadow-inner ring-1 ring-white/10">
          <div
            className={`ipo-raise-bomb-fill relative h-full rounded-full transition-[width] duration-700 ease-out ${
              oversub
                ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-fuchsia-400'
                : 'bg-gradient-to-r from-fuchsia-500 via-pink-400 to-violet-400'
            }`}
            style={{ width: `${fillW}%` }}
          >
            <span className="ipo-swap-shimmer absolute inset-0 rounded-full" aria-hidden />
            {fillW > 0 ? (
              <span
                className="ipo-raise-bomb-tip absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(244,114,182,0.95)]"
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        {/* Inventory */}
        {inventoryCapAptc ? (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-white/[0.08] pt-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Inventory
              </p>
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-white/85">
                {fmt(aptcCommitted, { maximumFractionDigits: 0 })}
                <span className="font-normal text-white/35">
                  {' '}
                  / {fmt(inventoryCapAptc, { maximumFractionDigits: 0 })} APTC
                </span>
              </p>
            </div>
            <div className="text-right">
              {soldOut ? (
                <p className="text-sm font-bold text-amber-200">Sold out</p>
              ) : invLeft != null ? (
                <>
                  <p className="text-lg font-black tabular-nums text-emerald-300 sm:text-xl">
                    {fmt(invLeft, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/70">
                    left · {formatProgressPct(invSoldPct)} sold
                  </p>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
