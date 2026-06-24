'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaClock, FaLock, FaCheckCircle } from 'react-icons/fa';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { fmtNative, fmtDate } from './ProfileDashboard';

function fmtAptc(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  if (v > 0 && v < 0.0001) return v.toExponential(2);
  return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function DepositAptcBonusPanel({
  depositAptcBonus,
  chain,
  wallet,
  demoMode,
  onClaimed,
}) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [solanaPayout, setSolanaPayout] = useState('');
  const { getWalletAuth } = useWalletAuth();

  const bonus = depositAptcBonus;
  const needsSolanaPayout = chain === 'aptos';
  const canClaim = (bonus?.claimableAptc ?? 0) > 0;

  const lockLabel = useMemo(() => {
    if (!bonus?.nextUnlockAt) return null;
    const ms = new Date(bonus.nextUnlockAt).getTime() - Date.now();
    if (ms <= 0) return null;
    const days = Math.ceil(ms / 86400000);
    return days === 1 ? '1 day' : `${days} days`;
  }, [bonus?.nextUnlockAt]);

  if (!bonus) return null;

  const hasAnyRewards =
    (bonus.lockedAptc ?? 0) > 0 ||
    (bonus.claimableAptc ?? 0) > 0 ||
    (bonus.claimedAptc ?? 0) > 0 ||
    (bonus.recent?.length ?? 0) > 0;
  const accrualOff = bonus.accrualEnabled === false;

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
      const res = await fetch('/api/profile/deposit-bonus/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      setSuccess(`Claimed ${fmtAptc(data.claimedAptc)} APTC`);
      await onClaimed?.();
    } catch (e) {
      setError(e.message || 'Could not claim APTC');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/35 via-[#1A0015]/80 to-purple-950/25 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
            <FaCoins className="text-amber-300" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Deposit APTC bonus</h3>
            <p className="text-xs text-white/55 mt-0.5">
              {bonus.bonusPct ?? bonus.bonusBps / 100}% of each deposit&apos;s USD value in APTC ·{' '}
              {bonus.lockDays}-day lock before claim
            </p>
          </div>
        </div>
        {canClaim && (
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming || demoMode || (needsSolanaPayout && !solanaPayout.trim())}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-black shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {claiming ? 'Claiming…' : `Claim ${fmtAptc(bonus.claimableAptc)} APTC`}
          </button>
        )}
      </div>

      {needsSolanaPayout && canClaim && (
        <div className="mt-3">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
            Solana wallet for APTC payout
          </label>
          <input
            type="text"
            value={solanaPayout}
            onChange={(e) => setSolanaPayout(e.target.value)}
            placeholder="Your Solana address (SPL)"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder:text-white/30"
          />
        </div>
      )}

      {accrualOff && (
        <p className="mt-3 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2 leading-relaxed">
          APTC price is not configured yet, so new deposit bonuses cannot be calculated. Set{' '}
          <span className="font-mono text-amber-100">APTC_USD_PRICE_OVERRIDE</span> or{' '}
          <span className="font-mono text-amber-100">DEPOSIT_APTC_USD_FALLBACK</span> in server env,
          then make a deposit (or refresh after your admin applies the migration).
        </p>
      )}
      {!accrualOff && !hasAnyRewards && (
        <p className="mt-3 text-xs text-white/50">
          No deposit bonuses yet. Fund your house balance from the wallet menu — you will earn 5% of
          each deposit&apos;s USD value in APTC after it confirms.
        </p>
      )}
      {demoMode && (
        <p className="mt-3 text-xs text-amber-200/80">Turn off Demo mode to claim real APTC.</p>
      )}
      {error && (
        <p className="mt-3 text-xs text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
          {success}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat
          icon={<FaLock className="text-amber-300/80" />}
          label="Locked"
          value={`${fmtAptc(bonus.lockedAptc)} APTC`}
          hint={lockLabel ? `Next unlock ~${lockLabel}` : undefined}
        />
        <MiniStat
          icon={<FaCheckCircle className="text-emerald-300/80" />}
          label="Ready to claim"
          value={`${fmtAptc(bonus.claimableAptc)} APTC`}
          accent="text-emerald-300"
        />
        <MiniStat
          icon={<FaClock className="text-white/50" />}
          label="Already claimed"
          value={`${fmtAptc(bonus.claimedAptc)} APTC`}
        />
      </div>

      {bonus.recent?.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[420px] text-xs">
            <thead className="bg-white/[0.03] text-left text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-3 py-2">Deposit</th>
                <th className="px-3 py-2 text-right">APTC</th>
                <th className="px-3 py-2">Unlock</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bonus.recent.map((row) => {
                const unlocked =
                  row.status === 'claimed' ||
                  (row.status === 'locked' && new Date(row.unlockAt).getTime() <= Date.now());
                return (
                  <tr key={row.id} className="border-t border-white/5 text-white/75">
                    <td className="px-3 py-2 font-mono">
                      {fmtNative(row.depositNative, { max: 4 })} {row.chain === 'solana' ? 'SOL' : 'APT'}
                    </td>
                    <td className="px-3 py-2 text-right text-amber-200/90">+{fmtAptc(row.rewardAptc)}</td>
                    <td className="px-3 py-2 text-white/50">{fmtDate(row.unlockAt)}</td>
                    <td className="px-3 py-2">
                      {row.status === 'claimed' ? (
                        <span className="text-emerald-300">Claimed</span>
                      ) : unlocked ? (
                        <span className="text-cyan-300">Claimable</span>
                      ) : (
                        <span className="text-amber-200/80">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function MiniStat({ icon, label, value, hint, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40">
        {icon}
        {label}
      </div>
      <p className={`mt-1 font-mono text-sm font-semibold ${accent || 'text-white'}`}>{value}</p>
      {hint && <p className="text-[10px] text-white/40 mt-0.5">{hint}</p>}
    </div>
  );
}
