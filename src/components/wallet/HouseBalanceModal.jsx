'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CHAIN_UI } from '@/lib/chains/chainUi';
import { withdrawNetFromGross, withdrawFeeFromGross } from '@/lib/feeTiersClient';
import FeeTierPreview from '@/components/wallet/FeeTierPreview';
import { demoStartNativeAmount } from '@/lib/play/demoPlay';
import { useWalletNativeBalance } from '@/hooks/useWalletSolBalance';

const QUICK_AMOUNTS_SOL = [0.01, 0.1, 0.5, 1, 5, 10];
const QUICK_AMOUNTS_APT = [1, 10, 25, 50, 100, 250];

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"
      aria-hidden
    />
  );
}

export default function HouseBalanceModal({
  open,
  onClose,
  playChain,
  playSymbol,
  balanceLabel,
  isLoadingBalance,
  depositAmount,
  onDepositAmountChange,
  withdrawAmount,
  onWithdrawAmountChange,
  balanceNative = 0,
  onDeposit,
  onWithdraw,
  onWithdrawAll,
  onRefresh,
  isDepositing,
  isPlayDepositing,
  isWithdrawing,
  canWithdraw,
  isPlayWalletReady,
  demoMode,
  onRefillDemo,
}) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState('deposit');
  const [bonusPreview, setBonusPreview] = useState(null);
  const [feeQuote, setFeeQuote] = useState(null);
  const ui = CHAIN_UI[playChain] || CHAIN_UI.solana;
  const depositBusy = isDepositing || isPlayDepositing;
  const {
    balance: walletNativeBalance,
    spendable: walletSpendable,
    loading: walletBalanceLoading,
    refresh: refreshWalletBalance,
    feeReserve: walletFeeReserve,
  } = useWalletNativeBalance(playChain, { enabled: open && isPlayWalletReady && !demoMode });
  const minimumDeposit =
    playChain === 'aptos'
      ? Number(process.env.NEXT_PUBLIC_APTOS_MIN_DEPOSIT_APT || 1)
      : 0.01;
  const minimumWithdraw =
    playChain === 'aptos' ? Number(process.env.NEXT_PUBLIC_APTOS_MIN_WITHDRAW_APT || 1) : 0.01;
  const quickAmounts = playChain === 'aptos' ? QUICK_AMOUNTS_APT : QUICK_AMOUNTS_SOL;
  const depositGross = parseFloat(depositAmount);
  const depositPreview = useMemo(() => {
    if (!feeQuote?.quote) return null;
    return { fee: feeQuote.quote.feeNative, net: feeQuote.quote.netNative };
  }, [feeQuote]);
  const withdrawGross = parseFloat(withdrawAmount);
  const withdrawPreview = useMemo(() => {
    if (!Number.isFinite(withdrawGross) || withdrawGross <= 0) return null;
    const fee = withdrawFeeFromGross(withdrawGross);
    const net = withdrawNetFromGross(withdrawGross);
    return { fee, net };
  }, [withdrawGross]);
  const exceedsWalletBalance =
    isPlayWalletReady &&
    !demoMode &&
    walletSpendable != null &&
    Number.isFinite(depositGross) &&
    depositGross > 0 &&
    depositGross > walletSpendable + 1e-9;
  const depositDisabled =
    !isPlayWalletReady ||
    demoMode ||
    !depositAmount ||
    parseFloat(depositAmount) < minimumDeposit ||
    depositBusy ||
    exceedsWalletBalance;
  const withdrawParsed = parseFloat(withdrawAmount);
  const withdrawDisabled =
    !isPlayWalletReady ||
    !canWithdraw ||
    !withdrawAmount ||
    !Number.isFinite(withdrawParsed) ||
    withdrawParsed < minimumWithdraw ||
    withdrawParsed > balanceNative ||
    isWithdrawing;

  useEffect(() => {
    if (open) refreshWalletBalance();
  }, [open, refreshWalletBalance]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || tab !== 'deposit') return;
    const gross = parseFloat(depositAmount);
    if (!Number.isFinite(gross) || gross <= 0) {
      setBonusPreview(null);
      setFeeQuote(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const [bonusRes, feeRes] = await Promise.all([
          fetch(
            `/api/deposit-bonus/config?chain=${encodeURIComponent(playChain)}&amount=${encodeURIComponent(gross)}`,
          ),
          fetch(
            `/api/platform-fees/quote?chain=${encodeURIComponent(playChain)}&amount=${encodeURIComponent(gross)}`,
          ),
        ]);
        const bonusJson = await bonusRes.json().catch(() => ({}));
        const feeJson = await feeRes.json().catch(() => ({}));
        setBonusPreview(bonusRes.ok ? bonusJson : null);
        setFeeQuote(feeRes.ok ? feeJson : null);
      } catch {
        setBonusPreview(null);
        setFeeQuote(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [open, tab, depositAmount, playChain]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="house-balance-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-[1] w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#0A0008] shadow-2xl shadow-black/60 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-emerald-500/[0.08] via-transparent to-fuchsia-500/[0.06] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-300/70">
                  Wallet
                </p>
                <h2 id="house-balance-title" className="font-display text-lg font-bold text-white sm:text-xl">
                  House balance
                </h2>
                <p className="mt-0.5 text-xs text-white/45">
                  Credits for in-app play · withdraw anytime
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onRefresh();
                    refreshWalletBalance();
                  }}
                  disabled={isLoadingBalance || walletBalanceLoading}
                  className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
                  title="Refresh balance"
                  aria-label="Refresh balance"
                >
                  <svg
                    className={`h-5 w-5 ${isLoadingBalance ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Balance hero */}
            <div className="px-5 pt-5 sm:px-6">
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-[#120010] p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-black/40 p-1.5">
                    <Image src={ui.logo} alt="" fill className="object-contain" sizes="44px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Available to play
                    </p>
                    <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-emerald-300 sm:text-3xl">
                      {isLoadingBalance ? (
                        <span className="text-white/40">Loading…</span>
                      ) : (
                        <>
                          {balanceLabel}
                          <span className="ml-1.5 text-base font-semibold text-white/50 sm:text-lg">
                            {playSymbol}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {isPlayWalletReady && !demoMode ? (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Connected wallet
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-mono text-sm font-semibold tabular-nums text-white/75">
                        {walletBalanceLoading && walletNativeBalance == null ? (
                          '…'
                        ) : walletNativeBalance != null ? (
                          <>
                            {walletNativeBalance.toFixed(4)}{' '}
                            <span className="text-white/45">{playSymbol}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </p>
                      {tab === 'deposit' ? (
                        <button
                          type="button"
                          disabled={
                            depositBusy ||
                            walletSpendable == null ||
                            walletSpendable < minimumDeposit
                          }
                          onClick={() => {
                            if (walletSpendable == null || walletSpendable <= 0) return;
                            const v = Math.floor(walletSpendable * 1e6) / 1e6;
                            onDepositAmountChange(String(v));
                          }}
                          className="rounded-md border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200/90 hover:bg-fuchsia-500/15 transition-colors disabled:opacity-30"
                        >
                          Max
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {demoMode && (
                  <div className="mt-3 space-y-2">
                    <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200/90">
                      Demo mode — play credits only. Deposits and withdrawals are simulated.
                    </p>
                    {onRefillDemo && (
                      <button
                        type="button"
                        onClick={onRefillDemo}
                        className="w-full rounded-lg border border-emerald-500/35 bg-emerald-500/15 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                      >
                        Refill to {demoStartNativeAmount()} {playSymbol}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 px-5 sm:px-6">
              <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
                {[
                  { id: 'deposit', label: 'Deposit' },
                  { id: 'withdraw', label: 'Withdraw' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      tab === id
                        ? 'bg-gradient-to-r from-red-magic/90 to-blue-magic/90 text-white shadow-md'
                        : 'text-white/45 hover:text-white/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 sm:px-6 sm:pb-6">
              {tab === 'deposit' ? (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-white/45">
                    Move {playSymbol} from your connected wallet into your house balance to place bets.
                  </p>
                  <FeeTierPreview quote={feeQuote?.quote} playSymbol={playSymbol} mode="deposit" />
                  <p className="text-[11px] text-white/40 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
                    Minimum deposit:{' '}
                    <span className="font-mono text-white/65">
                      {minimumDeposit} {playSymbol}
                    </span>
                    .
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => onDepositAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/25 focus:border-fuchsia-500/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
                      min="0"
                      step="0.00000001"
                      disabled={depositBusy}
                    />
                    <button
                      type="button"
                      onClick={onDeposit}
                      disabled={depositDisabled}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-fuchsia-900/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      {depositBusy ? (
                        <>
                          <Spinner />
                          <span className="hidden sm:inline">Sending</span>
                        </>
                      ) : (
                        'Deposit'
                      )}
                    </button>
                  </div>
                  {depositPreview && feeQuote?.quote ? (
                    <p className="text-[11px] text-emerald-200/80 font-mono">
                      You send {depositGross.toFixed(6).replace(/\.?0+$/, '')} {playSymbol} →{' '}
                      {feeQuote.quote.depositFeePct}% fee (
                      {depositPreview.fee.toFixed(6).replace(/\.?0+$/, '')} {playSymbol}) →{' '}
                      <span className="text-emerald-300">
                        {depositPreview.net.toFixed(6).replace(/\.?0+$/, '')} {playSymbol} to play
                      </span>
                    </p>
                  ) : null}
                  {exceedsWalletBalance ? (
                    <p className="text-[11px] text-amber-300/90 font-mono">
                      Insufficient {playSymbol} in wallet — max spendable{' '}
                      {walletSpendable?.toFixed(4)} {playSymbol} ({walletFeeReserve} {playSymbol}{' '}
                      reserved for fees)
                    </p>
                  ) : null}
                  {bonusPreview?.estimatedAptc > 0 && (
                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-100/90">
                      <span className="font-semibold text-amber-200">Deposit bonus:</span> earn ~{' '}
                      <span className="font-mono text-amber-100">
                        {Number(bonusPreview.estimatedAptc).toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}{' '}
                        APTC
                      </span>{' '}
                      ({bonusPreview.bonusPct ?? 5}% of deposit value). Locked for{' '}
                      {bonusPreview.lockDays ?? 14} days — claim on your{' '}
                      <span className="text-white/80">Profile → Earn</span>.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => onDepositAmountChange(amount.toString())}
                        disabled={depositBusy}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white/70 transition-colors hover:border-fuchsia-500/30 hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                      >
                        {amount} {playSymbol}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-white/45">
                    {canWithdraw
                      ? `Send ${playSymbol} from your house balance back to your connected wallet.`
                      : `You have no house balance yet. Deposit ${playSymbol} first, then withdraw after you finish playing.`}
                  </p>
                  <FeeTierPreview playSymbol={playSymbol} mode="withdraw" />
                  {canWithdraw ? (
                    <>
                      <p className="text-[11px] text-white/40 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
                        Minimum withdrawal:{' '}
                        <span className="font-mono text-white/65">
                          {minimumWithdraw} {playSymbol}
                        </span>
                        .
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => onWithdrawAmountChange(e.target.value)}
                          placeholder="0.00"
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                          min="0"
                          max={balanceNative}
                          step="0.00000001"
                          disabled={isWithdrawing}
                        />
                        <button
                          type="button"
                          onClick={onWithdraw}
                          disabled={withdrawDisabled}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isWithdrawing ? (
                            <>
                              <Spinner />
                              <span className="hidden sm:inline">Sending</span>
                            </>
                          ) : (
                            'Withdraw'
                          )}
                        </button>
                      </div>
                      {withdrawPreview ? (
                        <p className="text-[11px] text-emerald-200/80 font-mono">
                          Withdraw {withdrawGross.toFixed(6).replace(/\.?0+$/, '')} {playSymbol} → fee (
                          {withdrawPreview.fee.toFixed(6).replace(/\.?0+$/, '')} {playSymbol}) →{' '}
                          <span className="text-emerald-300">
                            {withdrawPreview.net.toFixed(6).replace(/\.?0+$/, '')} {playSymbol} to wallet
                          </span>
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {quickAmounts.map((amount) => {
                          const overBalance = amount > balanceNative;
                          return (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => onWithdrawAmountChange(amount.toString())}
                              disabled={isWithdrawing || overBalance}
                              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white/70 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              {amount} {playSymbol}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => onWithdrawAmountChange(balanceNative.toString())}
                          disabled={isWithdrawing || balanceNative <= 0}
                          className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs text-emerald-200/90 transition-colors hover:bg-emerald-500/15 disabled:opacity-35"
                        >
                          Max
                        </button>
                      </div>
                      {onWithdrawAll && (
                        <button
                          type="button"
                          onClick={onWithdrawAll}
                          disabled={!isPlayWalletReady || !canWithdraw || isWithdrawing}
                          className="w-full rounded-lg border border-white/10 py-2 text-xs font-semibold text-white/50 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-40"
                        >
                          Withdraw entire balance ({balanceLabel} {playSymbol})
                        </button>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <div className="h-[2px] w-full magic-gradient opacity-60" aria-hidden />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
