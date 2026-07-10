'use client';

import { formatIpoPriceUsd, getIpoRounds, getRoundStatus, IPO_SALE } from '@/lib/config/ipo';

function fmtUsd(n) {
  if (!Number.isFinite(Number(n))) return '—';
  const v = Number(n);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}k`;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(pct) {
  if (!Number.isFinite(pct) || pct <= 0) return '0%';
  if (pct > 0 && pct < 0.1) return '<0.1%';
  return `${Math.min(pct, 999).toFixed(0)}%`;
}

function shortWindow(label) {
  if (!label) return '';
  // "11–14 Jul · 6 PM ET" → "11–14 Jul"
  return String(label).split('·')[0].trim();
}

function normalizeRounds(rounds) {
  const base = rounds?.length ? rounds : getIpoRounds();
  return base.map((r) => ({
    ...r,
    status: r.status || getRoundStatus(r),
    committedUsd: Number(r.committedUsd) || 0,
    pctOfSoftCap: Number(r.pctOfSoftCap) || 0,
    livePriceUsd: r.livePriceUsd ?? r.priceUsd,
    oversubscribed: Boolean(r.oversubscribed),
  }));
}

/**
 * Three raise cards — one job: show round status, price, and soft-cap fill.
 */
export default function IpoRoundsPanel({ rounds = [], className = '' }) {
  const items = normalizeRounds(rounds);
  if (!items.length) return null;

  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-white/80">Raise schedule</h2>
        <p className="text-[11px] text-white/35">
          {fmtUsd(IPO_SALE.raiseTargetUsd)} soft · {IPO_SALE.roundCount} rounds
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((r) => {
          const live = r.status === 'live';
          const ended = r.status === 'ended';
          const pct = Math.min(100, r.pctOfSoftCap);

          return (
            <li
              key={r.id}
              className={`flex flex-col rounded-2xl border p-4 ${
                live
                  ? 'border-emerald-400/35 bg-emerald-500/[0.08]'
                  : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-white/90">
                  Round {r.id}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                    live
                      ? 'text-emerald-300'
                      : ended
                        ? 'text-white/35'
                        : 'text-amber-200/80'
                  }`}
                >
                  {live ? 'Live' : ended ? 'Done' : 'Soon'}
                </span>
              </div>

              <p className="mt-3 text-[22px] font-bold tabular-nums tracking-tight text-white">
                {formatIpoPriceUsd(r.livePriceUsd)}
              </p>
              <p className="mt-0.5 text-[11px] text-white/40">
                {r.multiple}×
                {r.oversubscribed ? (
                  <span className="text-amber-200/80"> · oversub {r.oversubMultiple}×</span>
                ) : (
                  <span> · then {r.oversubMultiple}×</span>
                )}
              </p>

              <p className="mt-3 text-[11px] text-white/40">{shortWindow(r.windowLabel)}</p>

              <div className="mt-auto pt-4">
                <div className="mb-1.5 flex justify-between text-[11px] tabular-nums">
                  <span className="text-white/70">{fmtUsd(r.committedUsd)}</span>
                  <span className="text-white/35">{fmtUsd(r.softCapUsd)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                  <div
                    className={`h-full rounded-full ${
                      r.oversubscribed
                        ? 'bg-amber-400'
                        : live
                          ? 'bg-emerald-400'
                          : ended
                            ? 'bg-white/30'
                            : 'bg-white/15'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] tabular-nums text-white/30">
                  {fmtPct(r.pctOfSoftCap)} of soft cap
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
