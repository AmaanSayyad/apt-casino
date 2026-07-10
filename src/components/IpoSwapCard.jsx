'use client';

import { useMemo, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  Sparkles,
  Wallet,
  Zap,
  Clock,
} from 'lucide-react';
import { IPO_COPY } from '@/lib/config/ipo';
import { IpoLogoIcon } from '@/components/IpoStackLogos';
import { IpoBuyGuidance, useIpoCountdown } from '@/components/IpoExtras';

const SOL_PRESETS = ['5', '10', '50', '100', '500'];

function fmt(n, opts = {}) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, opts);
}

function fmtUsd(n) {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const UPSIDE_MULTIPLIERS = [10, 50, 100];

export default function IpoSwapCard({
  solIn,
  setSolIn,
  estAptc,
  estReward,
  solUsd,
  aptcPrice,
  isLive,
  isPurchasing,
  phase,
  soldOut = false,
  startAt,
  endAt,
  connected,
  onConnect,
  onSwap,
  solAmount,
  walletSolBalance,
  spendableSol,
  balanceLoading,
  onSetMaxSol,
}) {
  const reduceMotion = useReducedMotion();
  const amountInputRef = useRef(null);
  const { compactLabel: countdownLabel } = useIpoCountdown({ phase, startAt, endAt });

  const estUsd = estAptc > 0 && aptcPrice ? estAptc * aptcPrice : 0;
  const exceedsBalance =
    connected &&
    spendableSol != null &&
    Number.isFinite(solAmount) &&
    solAmount > 0 &&
    solAmount > spendableSol + 1e-9;

  const needsAmount = isLive && (!Number.isFinite(solAmount) || solAmount <= 0);
  const highlightPay = isLive && connected && needsAmount;

  useEffect(() => {
    if (!isLive || !connected || isPurchasing) return;
    const el = amountInputRef.current;
    if (!el) return;
    // Draw attention to the amount field once the wallet is ready.
    const t = window.setTimeout(() => {
      try {
        el.focus({ preventScroll: true });
        el.select?.();
      } catch {
        /* ignore */
      }
    }, 120);
    return () => window.clearTimeout(t);
  }, [isLive, connected, isPurchasing]);

  const ctaLabel = isPurchasing
    ? 'Buying…'
    : soldOut
      ? 'Sold out'
      : exceedsBalance
      ? 'Amount exceeds balance'
      : needsAmount
        ? 'Enter SOL amount'
        : isLive
          ? 'Buy APTC now'
          : phase === 'upcoming'
            ? countdownLabel
            : phase === 'between_rounds'
              ? countdownLabel
              : 'Sale ended';
  const CtaIcon =
    soldOut
      ? Sparkles
      : (phase === 'upcoming' || phase === 'between_rounds') && !isPurchasing
        ? Clock
        : Zap;

  const upsideRows = useMemo(() => {
    if (estAptc <= 0 || !aptcPrice) return [];
    return UPSIDE_MULTIPLIERS.map((mult) => ({
      mult,
      price: aptcPrice * mult,
      value: estAptc * aptcPrice * mult,
    }));
  }, [estAptc, aptcPrice]);

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <motion.div
      {...motionProps}
      className="relative order-1 h-fit lg:sticky lg:top-24"
    >
      {/* Animated gradient border */}
      <div className="absolute -inset-[1px] rounded-[1.35rem] overflow-hidden pointer-events-none">
        <div
          className={`absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent,rgba(217,70,239,0.5),transparent,rgba(99,102,241,0.45),transparent)] ${
            reduceMotion ? '' : '[animation:ipo-border-spin_8s_linear_infinite]'
          }`}
        />
      </div>

      <div className="relative overflow-hidden rounded-[1.3rem] border border-white/10 bg-[#080008] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
        {/* Background layers */}
        <div className="ipo-swap-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />

        <div className="relative p-5 md:p-6 space-y-5">
          <div>
            <h3 className="text-xl md:text-2xl font-bold font-display tracking-tight">
              <span className="bg-gradient-to-r from-white via-fuchsia-100 to-violet-200 bg-clip-text text-transparent">
                {IPO_COPY.swapLabel}
              </span>
            </h3>
            <p className="mt-1.5 text-xs text-white/45 whitespace-nowrap overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              Deposit SOL — receive APTC at the fixed IPO price.
            </p>
          </div>

          {/* SOL input */}
          <label className="block">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                You pay
              </span>
              {connected ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-white/40 tabular-nums">
                    {balanceLoading && walletSolBalance == null ? (
                      'Balance…'
                    ) : walletSolBalance != null ? (
                      <>
                        Balance{' '}
                        <span className="text-white/65 font-semibold">
                          {fmt(walletSolBalance, { maximumFractionDigits: 4 })}
                        </span>{' '}
                        SOL
                      </>
                    ) : (
                      'Balance unavailable'
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={!isLive || isPurchasing || spendableSol == null || spendableSol <= 0}
                    onClick={onSetMaxSol}
                    className="rounded-md border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200/90 hover:bg-fuchsia-500/15 transition-colors disabled:opacity-30"
                  >
                    Max
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 mb-2">
              {SOL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={!isLive || isPurchasing}
                  onClick={() => setSolIn(preset)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/55 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 hover:text-fuchsia-100 transition-all disabled:opacity-30"
                >
                  {preset} SOL
                </button>
              ))}
            </div>
            <div
              className={`group relative rounded-2xl border bg-black/40 p-[1px] transition-colors ${
                highlightPay
                  ? 'border-fuchsia-400/55 shadow-[0_0_28px_-8px_rgba(217,70,239,0.75)]'
                  : 'border-white/10 focus-within:border-fuchsia-400/50'
              }`}
            >
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/15 to-violet-500/0 transition-opacity pointer-events-none ${
                  highlightPay ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100'
                }`}
              />
              <div className="relative flex items-center gap-3 rounded-[15px] bg-[#0a0008] px-4 py-3.5">
                <input
                  ref={amountInputRef}
                  type="number"
                  min="0"
                  step="any"
                  value={solIn}
                  onChange={(e) => setSolIn(e.target.value)}
                  placeholder="Enter SOL amount"
                  disabled={!isLive || isPurchasing}
                  aria-label="SOL amount to pay"
                  className={`flex-1 min-w-0 bg-transparent text-2xl font-bold outline-none tabular-nums ${
                    highlightPay
                      ? 'text-white placeholder:text-fuchsia-200/45'
                      : 'text-white placeholder:text-white/25'
                  }`}
                />
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5">
                  <IpoLogoIcon logoId="solana" size={22} />
                  <span className="text-sm font-bold text-white/80">SOL</span>
                </div>
              </div>
            </div>
            {solUsd && Number(solAmount) > 0 ? (
              <p className="mt-1.5 text-[11px] text-white/35 tabular-nums">
                ≈ {fmtUsd(Number(solAmount) * solUsd)} USD
              </p>
            ) : null}
            {exceedsBalance ? (
              <p className="mt-1.5 text-[11px] text-amber-300/90 tabular-nums">
                Insufficient SOL — max spendable{' '}
                {fmt(spendableSol, { maximumFractionDigits: 4 })} SOL (0.01 SOL reserved for fees)
              </p>
            ) : null}
          </label>

          {/* Swap arrow */}
          <div className="flex justify-center -my-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-400/30 bg-gradient-to-b from-fuchsia-500/20 to-violet-600/10">
              <ArrowDown className="h-5 w-5 text-fuchsia-200" aria-hidden />
            </div>
          </div>

          {/* Receive */}
          <motion.div
            layout
            className={`relative overflow-hidden rounded-2xl border p-[1px] ${
              estAptc > 0
                ? 'border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/30 via-violet-500/20 to-emerald-500/20'
                : 'border-white/10 bg-white/[0.04]'
            }`}
          >
            <div className="relative rounded-[15px] bg-[#0d000a]/95 px-4 py-4 backdrop-blur-sm">
              {estAptc > 0 && !reduceMotion ? (
                <div className="ipo-swap-shimmer pointer-events-none absolute inset-0 opacity-30" aria-hidden />
              ) : null}
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-200/70 mb-2">
                You receive (est.)
              </p>
              <div className="relative flex items-center gap-3 rounded-[15px] bg-[#0a0008]/80 px-1 py-1">
                <motion.span
                  key={Math.round(estAptc)}
                  initial={reduceMotion ? false : { opacity: 0.6, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 min-w-0 pl-3 text-3xl font-bold text-white tabular-nums"
                >
                  {fmt(estAptc, { maximumFractionDigits: 2 })}
                </motion.span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 shrink-0">
                  <IpoLogoIcon logoId="aptc" size={22} className="rounded-md ring-1 ring-white/10" />
                  <span className="text-sm font-bold text-white/80">$APTC</span>
                </div>
              </div>
              {estUsd > 0 ? (
                <p className="mt-1 text-sm text-white/45 tabular-nums">
                  ≈ {fmtUsd(estUsd)} at IPO floor
                </p>
              ) : null}
              {estReward > 0 ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200/90">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  +{fmt(estReward, { maximumFractionDigits: 2 })} APTC staking · accruing day 1
                </p>
              ) : null}
            </div>
          </motion.div>

          {/* Upside scenarios */}
          {upsideRows.length > 0 ? (
            <div className="rounded-xl border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/80 mb-2">
                Illustrative upside · not financial advice
              </p>
              <div className="grid grid-cols-3 gap-2">
                {upsideRows.map(({ mult, price, value }) => (
                  <div
                    key={mult}
                    className="rounded-lg border border-white/[0.06] bg-black/30 px-2 py-2 text-center"
                  >
                    <p className="text-xs font-bold text-amber-100">{mult}×</p>
                    <p className="text-[10px] text-white/40 mt-0.5">@${price < 0.01 ? price.toFixed(4) : price.toFixed(3)}</p>
                    <p className="text-[11px] font-semibold text-emerald-300/90 mt-1 tabular-nums">
                      {fmtUsd(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Oracle */}
          {solUsd ? (
            <p className="text-[11px] text-white/40 text-center inline-flex items-center justify-center gap-2 flex-wrap w-full">
              <IpoLogoIcon logoId="pyth" size={16} />
              <span>
                Pyth SOL ≈ <span className="text-white/60 tabular-nums">${fmt(solUsd, { maximumFractionDigits: 2 })}</span>
                {' · '}
                Fixed APTC @ <span className="text-fuchsia-200/80">${aptcPrice}</span>
              </span>
            </p>
          ) : null}

          {/* CTA */}
          {!connected ? (
            <motion.button
              type="button"
              onClick={onConnect}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-fuchsia-600 bg-[length:200%_100%] py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_40px_-8px_rgba(217,70,239,0.9)] hover:shadow-[0_0_50px_-6px_rgba(217,70,239,1)] transition-shadow"
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                <Wallet className="h-4 w-4" aria-hidden />
                Connect wallet
              </span>
              {!reduceMotion && (
                <span className="ipo-swap-shimmer pointer-events-none absolute inset-0 opacity-40" aria-hidden />
              )}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={onSwap}
              disabled={!isLive || isPurchasing || !Number.isFinite(solAmount) || solAmount <= 0 || exceedsBalance}
              whileHover={reduceMotion || !isLive ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-fuchsia-600 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_40px_-8px_rgba(217,70,239,0.9)] hover:shadow-[0_0_50px_-6px_rgba(217,70,239,1)] transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2 tabular-nums">
                <CtaIcon className="h-4 w-4 shrink-0" aria-hidden />
                {ctaLabel}
              </span>
              {isLive && !isPurchasing && !reduceMotion ? (
                <span className="ipo-swap-shimmer pointer-events-none absolute inset-0 opacity-40" aria-hidden />
              ) : null}
            </motion.button>
          )}

          <p className="text-[10px] text-center text-white/30 leading-relaxed">
            Non-custodial · you sign every transaction
          </p>
          <IpoBuyGuidance className="text-center" />
        </div>
      </div>
    </motion.div>
  );
}
