'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGift, FaCoins, FaInfoCircle } from 'react-icons/fa';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { fmtNative } from './ProfileDashboard';

export default function CashbackPanel({
  cashback,
  nativeLabel,
  chain,
  wallet,
  onClaimed,
  demoMode,
}) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { getWalletAuth } = useWalletAuth();

  if (!cashback || chain !== 'solana') return null;

  const {
    capNative,
    unlockedNative,
    claimedNative,
    claimableNative,
    progressPct,
    totalBetsCount,
    canClaim,
    isBusted,
    depositsNetNative,
    houseBalanceNative,
  } = cashback;

  const pendingNative = Math.max(0, unlockedNative - claimedNative);
  const showClaimControl = canClaim || pendingNative > 0;

  const handleClaim = async () => {
    setError(null);
    setSuccess(null);
    setClaiming(true);
    try {
      const walletAuth = await getWalletAuth(wallet, 'solana', { fresh: true });
      if (!walletAuth) {
        throw new Error('Sign the wallet ownership prompt to claim cashback.');
      }
      const res = await fetch('/api/profile/cashback/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, chain: 'solana', walletAuth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      setSuccess(`Claimed ${fmtNative(data.creditedNative)} ${nativeLabel}`);
      await onClaimed?.(data.balanceNative);
    } catch (e) {
      setError(e.message || 'Could not claim cashback');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-[#1A0015]/80 to-purple-950/30 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <FaGift className="text-emerald-300" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">SOL cashback</h3>
            <p className="text-xs text-white/55 mt-0.5">
              Up to 1% of net deposits · unlocked as you play all games
            </p>
          </div>
        </div>
        {showClaimControl && (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleClaim}
              disabled={!canClaim || claiming || demoMode}
              title={
                canClaim
                  ? undefined
                  : `Use your house balance first (currently ${fmtNative(houseBalanceNative)} ${nativeLabel}). Claim unlocks when balance is ~0.`
              }
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-bold text-black shadow-lg disabled:cursor-not-allowed disabled:from-white/15 disabled:to-white/10 disabled:text-white/50"
            >
              {claiming
                ? 'Claiming…'
                : `Claim ${fmtNative(canClaim ? claimableNative : pendingNative)} ${nativeLabel}`}
            </button>
            {!canClaim && pendingNative > 0 && (
              <span className="text-[10px] text-white/45 text-right max-w-[200px]">
                Unlocks when house balance is empty
              </span>
            )}
          </div>
        )}
      </div>

      {demoMode && (
        <p className="mt-3 text-xs text-amber-200/80">
          Turn off Demo mode to claim real SOL cashback.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Cashback cap (1%)" value={`${fmtNative(capNative)} ${nativeLabel}`} />
        <MiniStat label="Unlocked" value={`${fmtNative(unlockedNative)} ${nativeLabel}`} accent="text-emerald-300" />
        <MiniStat label="Already claimed" value={`${fmtNative(claimedNative)} ${nativeLabel}`} />
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/45 mb-1">
          <span>Progress toward cap</span>
          <span>{progressPct.toFixed(1)}% · {totalBetsCount} bets tracked</span>
        </div>
        <div className="h-2 rounded-full bg-black/40 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progressPct)}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-black/30 border border-white/10 p-3">
        <FaInfoCircle className="text-emerald-400/70 shrink-0 mt-0.5" size={14} />
        <p className="text-xs text-white/60 leading-relaxed">
          {isBusted ? (
            <>
              Your house balance is empty. You can claim up to{' '}
              <strong className="text-emerald-300">{fmtNative(claimableNative)} {nativeLabel}</strong> (1% of your{' '}
              {fmtNative(depositsNetNative)} {nativeLabel} net deposits, minus prior claims).
            </>
          ) : (
            <>
              Each bet on Plinko, Mines, Roulette, and Wheel unlocks 1% of that wager toward your cap. You have{' '}
              <strong className="text-emerald-300/90">
                {fmtNative(pendingNative)} {nativeLabel}
              </strong>{' '}
              ready to claim once your house balance ({fmtNative(houseBalanceNative)} {nativeLabel}) is used up —
              then you receive the full remaining cashback up to your 1% cap.
            </>
          )}
        </p>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 text-sm text-emerald-300 flex items-center gap-2">
          <FaCoins /> {success}
        </p>
      )}
    </motion.div>
  );
}

function MiniStat({ label, value, accent = 'text-white' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}
