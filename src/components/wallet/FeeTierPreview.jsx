'use client';

import { FEE_TIERS } from '@/lib/feeTiersClient';

/** Compact tier table + active tier highlight for deposit/withdraw modals. */
export default function FeeTierPreview({ quote, playSymbol, mode = 'deposit' }) {
  const activeId = quote?.tierId;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
        {mode === 'deposit' ? 'Deposit tier fees (USD value)' : 'Withdrawal fee'}
      </p>
      {mode === 'deposit' ? (
        <div className="grid gap-1.5">
          {FEE_TIERS.map((t) => {
            const active = activeId === t.id;
            return (
              <div
                key={t.id}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] ${
                  active
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                    : 'border-white/10 bg-white/[0.03] text-white/55'
                }`}
              >
                <span>
                  <span className="font-medium text-white/90">{t.label}</span>
                  <span className="text-white/45 ml-1.5">({t.rangeLabel})</span>
                </span>
                <span className="font-mono shrink-0">{t.depositPct}% deposit fee</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-white/55 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
          Withdrawal fees will be charged.
        </p>
      )}
      {mode === 'deposit' && quote?.tierLabel && quote.depositUsd > 0 && (
        <p className="text-[11px] text-cyan-200/85 font-mono">
          This {playSymbol} deposit ≈ ${quote.depositUsd.toFixed(2)} →{' '}
          <span className="text-white font-semibold">{quote.tierLabel}</span> tier ({quote.depositFeePct}%
          fee)
        </p>
      )}
    </div>
  );
}
