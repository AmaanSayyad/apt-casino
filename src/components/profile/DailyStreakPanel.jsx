'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaFire, FaCheckCircle, FaGift } from 'react-icons/fa';
import { useWalletAuth } from '@/hooks/useWalletAuth';
function fmtAptc(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function dayTileClass(state) {
  if (state === 'claimed') {
    return 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200';
  }
  if (state === 'today') {
    return 'border-amber-400/60 bg-amber-500/15 text-amber-100 ring-2 ring-amber-400/40';
  }
  return 'border-white/10 bg-white/[0.03] text-white/45';
}

export default function DailyStreakPanel({ dailyStreak, chain, wallet, demoMode, onClaimed }) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [solanaPayout, setSolanaPayout] = useState('');
  const { getWalletAuth } = useWalletAuth();

  const streak = dailyStreak;
  const needsSolanaPayout = chain === 'aptos';
  const canClaim = streak?.canClaimToday && (streak?.todayRewardAptc ?? 0) > 0;

  const resetHint = useMemo(() => {
    if (!streak?.lastCheckInDate || streak.claimedToday) return null;
    const last = new Date(`${streak.lastCheckInDate}T12:00:00Z`);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);
    if (diffDays > 1) return 'Streak reset — start again at day 1.';
    return null;
  }, [streak?.lastCheckInDate, streak?.claimedToday]);

  if (!streak?.enabled) return null;

  const handleClaim = async () => {
    setError(null);
    setSuccess(null);
    setClaiming(true);
    try {
      const walletAuth = await getWalletAuth(wallet, chain, { fresh: true });
      if (!walletAuth) {
        throw new Error('Sign the wallet ownership prompt in your wallet to claim.');
      }
      const body = { wallet, chain, walletAuth };
      if (needsSolanaPayout && solanaPayout.trim()) {
        body.solanaPayoutWallet = solanaPayout.trim();
      }
      const res = await fetch('/api/profile/streak/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      setSuccess(
        `Day ${data.streakDay} claimed — ${fmtAptc(data.rewardAptc)} APTC sent to your wallet.`,
      );
      await onClaimed?.();
    } catch (e) {
      setError(e.message || 'Could not claim daily reward');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-orange-500/25 bg-gradient-to-br from-orange-950/30 via-[#1A0015]/80 to-[#070005] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30">
            <FaFire className="text-orange-300" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Daily streak</h3>
            <p className="text-xs text-white/55 mt-0.5">
              Check in once per day (UTC) · APTC rewards scale through day {streak.maxStreakDay}
            </p>
          </div>
        </div>
        {canClaim ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming || demoMode || (needsSolanaPayout && !solanaPayout.trim())}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-sm font-bold text-black shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {claiming ? 'Claiming…' : `Claim ${fmtAptc(streak.todayRewardAptc)} APTC`}
          </button>
        ) : streak.claimedToday ? (
          <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
            <FaCheckCircle /> Claimed today
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Current streak</p>
          <p className="text-xl font-bold text-white tabular-nums">
            {streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Best streak</p>
          <p className="text-xl font-bold text-orange-200 tabular-nums">
            {streak.longestStreak} day{streak.longestStreak === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Total earned</p>
          <p className="text-xl font-bold text-amber-200 tabular-nums">
            {fmtAptc(streak.totalAptcClaimed)} APTC
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(streak.weekPreview ?? []).map((d) => (
          <div
            key={d.day}
            className={`flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 ${dayTileClass(d.state)}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wide">Day {d.day}</span>
            <FaGift className="my-1 opacity-80" size={14} />
            <span className="text-xs font-bold tabular-nums">{fmtAptc(d.rewardAptc)}</span>
            {d.state === 'claimed' ? (
              <FaCheckCircle className="mt-1 text-emerald-400" size={12} />
            ) : d.state === 'today' ? (
              <span className="mt-1 text-[9px] font-bold uppercase text-amber-300">Today</span>
            ) : null}
          </div>
        ))}
      </div>

      {needsSolanaPayout && canClaim ? (
        <div className="mt-4">
          <label htmlFor="streak-solana-payout" className="text-xs text-white/50">
            Solana wallet for APTC payout (required on Aptos)
          </label>
          <input
            id="streak-solana-payout"
            type="text"
            value={solanaPayout}
            onChange={(e) => setSolanaPayout(e.target.value)}
            placeholder="Your Solana address"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
        </div>
      ) : null}

      {resetHint ? <p className="mt-3 text-xs text-rose-300/90">{resetHint}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}
      {demoMode && canClaim ? (
        <p className="mt-2 text-xs text-white/40">Connect a real wallet to claim daily rewards.</p>
      ) : null}
    </motion.div>
  );
}
