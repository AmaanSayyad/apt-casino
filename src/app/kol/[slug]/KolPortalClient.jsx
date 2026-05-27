'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaClock,
  FaCoins,
  FaExternalLinkAlt,
  FaBullhorn,
  FaChartLine,
  FaGift,
  FaLock,
  FaKey,
  FaSignOutAlt,
  FaTicketAlt,
  FaUnlock,
  FaUserFriends,
  FaVideo,
} from 'react-icons/fa';

function fmtNum(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function useCountdown(secondsUntilUnlock) {
  const [remaining, setRemaining] = useState(secondsUntilUnlock ?? 0);

  useEffect(() => {
    setRemaining(secondsUntilUnlock ?? 0);
  }, [secondsUntilUnlock]);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  return useMemo(() => {
    if (remaining <= 0) return { done: true, label: 'Lock period complete' };
    const d = Math.floor(remaining / 86400);
    const h = Math.floor((remaining % 86400) / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    return { done: false, label: `${d}d ${h}h ${m}m ${s}s` };
  }, [remaining]);
}

const STATUS_COPY = {
  locked: {
    title: 'Allocation locked',
    body: 'Your APTC partner allocation is reserved. Tokens unlock after the 14-day cliff, then the team processes your payout.',
    tone: 'amber',
  },
  ready: {
    title: 'Unlock complete — payout queued',
    body: 'Your lock period has ended. APT Casino ops will send APTC to your registered Solana wallet shortly.',
    tone: 'emerald',
  },
  fulfilled: {
    title: 'APTC delivered',
    body: 'Your allocation has been sent. Check your wallet and the transaction link below.',
    tone: 'cyan',
  },
  revoked: {
    title: 'Allocation revoked',
    body: 'This allocation is no longer active. Contact the APT Casino team if you believe this is an error.',
    tone: 'rose',
  },
};

export default function KolPortalClient({ slug }) {
  const [password, setPassword] = useState('');
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const countdown = useCountdown(allocation?.secondsUntilUnlock);

  const loadAllocation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/kol/${slug}/allocation`, { credentials: 'include' });
      if (r.status === 401) {
        setAuthed(false);
        setAllocation(null);
        return;
      }
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load');
      setAllocation(j.allocation);
      setAuthed(true);
    } catch (e) {
      setError(e.message || 'Failed to load');
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadAllocation();
    const id = setInterval(() => {
      if (authed) void loadAllocation();
    }, 30_000);
    return () => clearInterval(id);
  }, [loadAllocation, authed]);

  const login = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/kol/${slug}/auth`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Invalid password');
      setAllocation(j.allocation);
      setAuthed(true);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await fetch(`/api/kol/${slug}/auth`, { method: 'DELETE', credentials: 'include' });
    setAuthed(false);
    setAllocation(null);
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwMessage('');
    setPwError('');
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMessage('');
    setPwError('');
    try {
      const r = await fetch(`/api/kol/${slug}/password`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwForm),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Password update failed');
      setAllocation(j.allocation);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMessage('Password updated successfully.');
    } catch (err) {
      setPwError(err.message || 'Password update failed');
    } finally {
      setPwLoading(false);
    }
  };

  const statusKey = allocation?.effectiveStatus || 'locked';
  const status = STATUS_COPY[statusKey] || STATUS_COPY.locked;

  if (loading && !authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white/60">
        Loading partner portal…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border border-purple-500/30 bg-[#120818]/90 p-8 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/40 to-fuchsia-600/20 flex items-center justify-center">
              <FaUserFriends className="text-fuchsia-300 text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">KOL Partner Portal</h1>
              <p className="text-xs text-white/50">Private allocation view</p>
            </div>
          </div>
          <form onSubmit={login} className="space-y-4">
            <label className="block text-sm">
              <span className="text-white/60">Portal password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white"
                placeholder="Provided by APT Casino team"
                required
                autoComplete="current-password"
              />
            </label>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 font-medium text-white disabled:opacity-50"
            >
              {authLoading ? 'Verifying…' : 'View allocation'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const toneBorder =
    status.tone === 'emerald'
      ? 'border-emerald-500/40'
      : status.tone === 'cyan'
        ? 'border-cyan-500/40'
        : status.tone === 'rose'
          ? 'border-rose-500/40'
          : 'border-amber-500/40';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Partner allocation</p>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-white to-fuchsia-200 bg-clip-text text-transparent">
            {allocation.displayName}
          </h1>
          <p className="text-sm text-white/50 mt-1">APTC KOL program · {allocation.pctOfSupply}% of max supply</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white px-3 py-1.5 rounded-lg border border-white/10"
        >
          <FaSignOutAlt /> Sign out
        </button>
      </div>

      <div className={`rounded-2xl border ${toneBorder} bg-[#120818]/80 p-6`}>
        <div className="flex items-center gap-2 mb-2">
          {statusKey === 'locked' ? (
            <FaLock className="text-amber-400" />
          ) : statusKey === 'fulfilled' ? (
            <FaUnlock className="text-cyan-400" />
          ) : (
            <FaClock className="text-emerald-400" />
          )}
          <h2 className="text-lg font-semibold text-white">{status.title}</h2>
        </div>
        <p className="text-sm text-white/65 leading-relaxed">{status.body}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wide mb-2">
            <FaCoins className="text-amber-400" /> Allocation
          </div>
          <p className="text-3xl font-display font-bold text-white tabular-nums">{fmtNum(allocation.amountAptc)}</p>
          <p className="text-sm text-white/50 mt-1">APTC tokens</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wide mb-2">
            <FaClock className="text-violet-400" /> Unlock timer
          </div>
          <p className="text-2xl font-display font-bold text-white tabular-nums">
            {countdown.done ? 'Unlocked' : countdown.label}
          </p>
          <p className="text-sm text-white/50 mt-1">{fmtDate(allocation.unlockAt)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-white/45">Payout wallet</span>
          <span className="font-mono text-white/80 text-right break-all">{allocation.walletAddress}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/45">Lock started</span>
          <span className="text-white/80">{fmtDate(allocation.lockedAt)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/45">Lock duration</span>
          <span className="text-white/80">{allocation.lockDays} days</span>
        </div>
        {allocation.fulfillmentTxHash ? (
          <div className="flex justify-between gap-4 items-center pt-2 border-t border-white/10">
            <span className="text-white/45">Payout tx</span>
            <a
              href={`https://solscan.io/tx/${allocation.fulfillmentTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 font-mono text-xs"
            >
              View on Solscan <FaExternalLinkAlt />
            </a>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaKey className="text-violet-400 text-sm" />
          <h3 className="text-sm font-semibold text-white">Change portal password</h3>
        </div>
        <p className="text-xs text-white/45 mb-4">
          Set a new password for this portal. Your APT Casino contact can see the updated password in the admin dashboard.
        </p>
        <form onSubmit={changePassword} className="space-y-3 max-w-md">
          <label className="block text-sm">
            <span className="text-white/60">Current password</span>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
              required
              autoComplete="current-password"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/60">New password</span>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/60">Confirm new password</span>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          {pwError ? <p className="text-sm text-rose-300">{pwError}</p> : null}
          {pwMessage ? <p className="text-sm text-emerald-300">{pwMessage}</p> : null}
          <button
            type="submit"
            disabled={pwLoading}
            className="rounded-lg bg-violet-600/90 hover:bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pwLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      <section className="rounded-xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaChartLine className="text-fuchsia-300 text-sm" />
          <h3 className="text-sm font-semibold text-white">Partner earnings hub</h3>
        </div>
        <p className="text-xs text-white/50 mb-4 leading-relaxed">
          Increase your total partner income by combining multiple tracks. You can promote these flows to different
          audience types — traders, stream viewers, long-term holders, and community members.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              title: 'Live streaming rewards',
              desc: 'Earn 0.1% / 0.2% / 0.3% of platform revenue at 5 / 15 / 30+ minute live sessions.',
              href: '/live',
              icon: <FaVideo className="text-cyan-300" />,
              cta: 'Go live',
            },
            {
              title: 'Referral monetization',
              desc: 'Drive users through your referral funnel and earn up to 2% of qualified deposits in APTC.',
              href: '/referral',
              icon: <FaBullhorn className="text-blue-300" />,
              cta: 'Referral hub',
            },
            {
              title: 'Daily rewards campaigns',
              desc: 'Promote daily streak loops (up to ~30 APTC on top day) to lift retention and repeat plays.',
              href: '/profile',
              icon: <FaGift className="text-amber-300" />,
              cta: 'View profile rewards',
            },
            {
              title: 'Cashback on deposits',
              desc: 'Promote up to 1% cashback on net deposits for active Solana users.',
              href: '/profile',
              icon: <FaCoins className="text-emerald-300" />,
              cta: 'Cashback details',
            },
            {
              title: 'Staking income',
              desc: 'Guide long-term users into APTC staking with APY tiers currently from 30% to 360%.',
              href: '/stake',
              icon: <FaLock className="text-violet-300" />,
              cta: 'Open staking',
            },
            {
              title: 'OTC lottery access',
              desc: 'Run OTC pushes where users often avoid DEX-style swap/LP/slippage fee stack (savings vary).',
              href: '/otc-lottery',
              icon: <FaTicketAlt className="text-rose-300" />,
              cta: 'Open OTC lottery',
            },
            {
              title: 'Coupon + deposit promo campaigns',
              desc: 'Share coupon drops (e.g. +0.02 SOL) and deposit milestones (e.g. $500 => $50 APTC).',
              href: '/profile',
              icon: <FaGift className="text-fuchsia-300" />,
              cta: 'See active promos',
            },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="rounded-lg border border-white/10 bg-black/30 p-3 hover:border-white/20 hover:bg-black/40 transition"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{item.desc}</p>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-blue-magic mt-2">
                    {item.cta} →
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
