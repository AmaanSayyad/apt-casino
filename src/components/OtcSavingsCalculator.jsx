'use client';

import { useMemo, useState } from 'react';
import {
  APTC_DEX_POOL_FEE,
  DEX_VALUE_LOSS_SOURCES,
  WALLET_SWAP_FEES,
  compareDexVsOtcSol,
} from '@/lib/otcFeeModel';
import OtcFeeBreakdown from '@/components/OtcFeeBreakdown';

const PURCHASE_PRESETS = [1, 10, 100];

function fmtSol(n, max = 4) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  });
}

function fmtUsd(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Per-buy fee + market loss calculator (swap, Uniswap pool fee, price impact / slippage).
 */
export default function OtcSavingsCalculator({
  solPerBuy,
  solPriceUsd,
  poolLiquidityUsd,
  tokenTaxBps = APTC_DEX_POOL_FEE.totalBps,
  showEmbeddedBreakdown = true,
}) {
  const [walletId, setWalletId] = useState('phantom');
  const [numPurchases, setNumPurchases] = useState(1);
  const [showWhy, setShowWhy] = useState(false);

  const calc = useMemo(() => {
    if (!solPerBuy || solPerBuy <= 0) return null;
    return compareDexVsOtcSol({
      solPerBuy,
      numPurchases,
      walletId,
      tokenTaxBps,
      solPriceUsd,
      poolLiquidityUsd,
    });
  }, [solPerBuy, numPurchases, walletId, tokenTaxBps, solPriceUsd, poolLiquidityUsd]);

  const dex = calc?.dex.perBuy;
  const otc = calc?.otc.perBuy;
  const hasUsd = dex?.usdIn != null;

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Which wallet do you swap with?
        </span>
        <select
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40"
        >
          {WALLET_SWAP_FEES.filter((w) => w.id !== 'conservative').map((w) => (
            <option key={w.id} value={w.id} className="bg-[#120010]">
              {w.name} — {w.swapFeeLabel} swap fee
            </option>
          ))}
        </select>
      </label>

      <div className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          How many times do you buy? (each buy = same SOL amount above)
        </span>
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          {PURCHASE_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNumPurchases(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                numPurchases === n
                  ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-100'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/25'
              }`}
            >
              {n}×
            </button>
          ))}
        </div>
      </div>

      {calc?.poolLiquidityUsd ? (
        <p className="text-[11px] text-white/40">
          APTC pool liquidity (DexScreener): ~{fmtUsd(calc.poolLiquidityUsd)} — larger buys vs this
          pool increase estimated price impact.
        </p>
      ) : null}

      {!calc || !dex ? (
        <p className="text-sm text-white/40">Enter a SOL amount in the calculator above (e.g. 2 or 100).</p>
      ) : (
        <>
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-rose-200/80">
                Per DEX buy — {calc.wallet.name}
              </p>
              <span className="shrink-0 rounded-lg bg-rose-500/20 border border-rose-400/40 px-2 py-1 text-sm font-bold text-rose-200">
                −{dex.totalLossPct}% total loss
              </span>
            </div>

            {hasUsd ? (
              <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">USD example</p>
                <p className="text-lg text-white/90">
                  Spend <strong>{fmtUsd(dex.usdIn)}</strong>
                  <span className="text-white/40 mx-2">→</span>
                  receive <strong className="text-emerald-300">{fmtUsd(dex.netUsd)}</strong> worth of APTC
                </p>
                <p className="text-xs text-rose-300/90 mt-1">
                  ~{fmtUsd(dex.usdIn - dex.netUsd)} lost ({dex.totalLossPct}%)
                </p>
              </div>
            ) : null}

            <div className="space-y-2 text-sm">
              <Row label="You spend" value={`${fmtSol(dex.solIn)} SOL`} sub={hasUsd ? fmtUsd(dex.usdIn) : null} />
              <Row
                label={`Wallet swap fee (${(calc.swapFeeBps / 100).toFixed(2)}%)`}
                value={`−${fmtSol(dex.swapFeeSol)} SOL`}
                muted
              />
              <Row
                label={`Market loss — impact + slippage (~${(dex.marketLossBps / 100).toFixed(2)}%)`}
                value={`−${fmtSol(dex.marketLossSol)} SOL`}
                muted
              />
              <Row
                label={`DEX trade fee (${APTC_DEX_POOL_FEE.totalLabel})`}
                value={`−${fmtSol(dex.tokenTaxSol)} SOL`}
                muted
              />
              <div className="h-px bg-white/10 my-2" role="presentation" />
              <Row
                label="Total value lost"
                value={`−${fmtSol(dex.totalLossSol)} SOL`}
                accent="rose"
              />
              <Row
                label="You actually receive"
                value={`${fmtSol(dex.netSol)} SOL`}
                sub={hasUsd ? `≈ ${fmtUsd(dex.netUsd)}` : null}
                accent="emerald"
                bold
              />
            </div>

            <p className="text-xs text-white/45 bg-white/5 rounded-lg px-3 py-2">
              <strong className="text-white/75">
                {fmtSol(dex.solIn)} − {fmtSol(dex.totalLossSol)} = {fmtSol(dex.netSol)} SOL
              </strong>
              {hasUsd ? (
                <>
                  {' '}
                  ({fmtUsd(dex.usdIn)} − {fmtUsd(dex.usdIn - dex.netUsd)} ≈ {fmtUsd(dex.netUsd)})
                </>
              ) : null}{' '}
              per buy.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/80">
              Same buy via OTC lottery
            </p>
            <Row label="You send" value={`${fmtSol(otc.solIn)} SOL`} sub={hasUsd ? fmtUsd(dex.usdIn) : null} />
            <Row
              label="You receive if approved"
              value={`~${fmtSol(otc.netSol)} SOL`}
              sub={hasUsd ? `≈ ${fmtUsd(dex.usdIn)}` : null}
              accent="emerald"
              bold
            />
            <p className="text-xs text-emerald-200/70 pt-1">
              Avoid ~<strong>{dex.totalLossPct}%</strong> DEX loss on this size — no swap fees, DEX trade
              fees, or price impact.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="text-xs text-cyan-400/90 hover:text-cyan-300 underline underline-offset-2"
          >
            {showWhy ? 'Hide' : 'Why do I get less than I spent?'}
          </button>

          {showWhy ? (
            <ul className="text-xs text-white/50 space-y-2 pl-1">
              {DEX_VALUE_LOSS_SOURCES.filter((s) => s.id === 'priceImpact' || s.id === 'slippage' || s.id === 'lp').map((s) => (
                <li key={s.id} className="leading-relaxed">
                  <strong className="text-white/70">{s.label}:</strong> {s.detail}
                  {s.url ? (
                    <>
                      {' '}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400/80 hover:underline"
                      >
                        {s.learnMoreLabel || 'Learn more'}
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {calc.numPurchases > 1 ? (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4 text-sm space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300/70">
                After {calc.numPurchases} buys × {fmtSol(calc.solPerBuy)} SOL
              </p>
              <Row label="Total spent" value={`${fmtSol(calc.totalSolSpent)} SOL`} />
              <Row
                label="Total lost on DEX"
                value={`−${fmtSol(calc.dex.totalLossSol)} SOL`}
                accent="rose"
              />
              <Row label="Total you keep on DEX" value={`${fmtSol(calc.dex.totalNetSol)} SOL`} />
              {calc.dex.totalNetUsd != null ? (
                <Row label="USD value on DEX" value={fmtUsd(calc.dex.totalNetUsd)} accent="emerald" />
              ) : null}
            </div>
          ) : null}

          {showEmbeddedBreakdown ? <OtcFeeBreakdown compact /> : null}
        </>
      )}
    </div>
  );
}

function Row({ label, value, sub, muted, accent, bold }) {
  const valueClass =
    accent === 'rose'
      ? 'text-rose-300'
      : accent === 'emerald'
        ? 'text-emerald-300'
        : muted
          ? 'text-white/50'
          : 'text-white/90';
  return (
    <div className="flex justify-between gap-4">
      <span className={muted ? 'text-white/45' : 'text-white/65'}>{label}</span>
      <div className="text-right shrink-0">
        <span className={`${valueClass} ${bold ? 'font-display font-bold text-base' : 'font-medium'}`}>
          {value}
        </span>
        {sub ? <p className="text-[10px] text-white/35 mt-0.5">{sub}</p> : null}
      </div>
    </div>
  );
}
