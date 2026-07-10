'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaBullhorn,
  FaChartLine,
  FaCheck,
  FaChevronDown,
  FaClock,
  FaCoins,
  FaCopy,
  FaExternalLinkAlt,
  FaGift,
  FaKey,
  FaLock,
  FaSignOutAlt,
  FaTicketAlt,
  FaUnlock,
  FaUserFriends,
  FaVideo,
} from 'react-icons/fa';

import { SolscanLink, SolscanMark } from '@/components/ui/SolscanMark';

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

function fmtShortDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtDateOnly(value) {
  if (!value) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function xProfileUrl(handle) {
  const raw = String(handle || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw.split('?')[0];
  const h = raw.replace(/^@/, '');
  return h ? `https://x.com/${encodeURIComponent(h)}` : null;
}

function xProfileLabel(handle) {
  const raw = String(handle || '').trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const segment = new URL(raw).pathname.replace(/^\//, '').split('/')[0];
      return segment ? `@${segment}` : raw;
    } catch {
      return raw;
    }
  }
  return raw.startsWith('@') ? raw : `@${raw}`;
}

function telegramUrl(username) {
  const raw = String(username || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw.split('?')[0];
  const u = raw.replace(/^@/, '');
  return u ? `https://t.me/${encodeURIComponent(u)}` : null;
}

function telegramLabel(username) {
  const raw = String(username || '').trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const segment = new URL(raw).pathname.replace(/^\//, '').split('/')[0];
      return segment ? `@${segment}` : raw;
    } catch {
      return raw;
    }
  }
  return raw.startsWith('@') ? raw : `@${raw}`;
}

function DetailRow({ label, children, multiline = false }) {
  return (
    <div
      className={`flex gap-4 px-5 py-4 ${multiline ? 'flex-col sm:flex-row sm:items-start sm:justify-between' : 'justify-between items-center'}`}
    >
      <dt className="text-white/45 shrink-0">{label}</dt>
      <dd className={`text-white/85 ${multiline ? 'sm:max-w-[65%] sm:text-right' : 'text-right'}`}>{children}</dd>
    </div>
  );
}

function useCountdown(secondsRemaining) {
  const [remaining, setRemaining] = useState(secondsRemaining ?? 0);

  useEffect(() => {
    setRemaining(secondsRemaining ?? 0);
  }, [secondsRemaining]);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  return useMemo(() => {
    if (remaining <= 0) return { done: true, label: 'Complete', seconds: 0 };
    const d = Math.floor(remaining / 86400);
    const h = Math.floor((remaining % 86400) / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    parts.push(`${h}h`, `${m}m`, `${s}s`);
    return { done: false, label: parts.join(' '), seconds: remaining };
  }, [remaining]);
}

function lockTermsCopy(allocation) {
  if (!allocation) return 'the configured cliff and lock period';
  const { cliffDays, lockDays } = allocation;
  if (cliffDays === lockDays) return `the ${lockDays}-day cliff & lock`;
  return `the ${cliffDays}-day cliff and ${lockDays}-day total lock`;
}

const STATUS = {
  locked: {
    title: 'Allocation locked',
    tone: 'amber',
    pill: 'Locked',
    icon: FaLock,
  },
  ready: {
    title: 'Unlock complete — payout queued',
    body: 'Your lock period has ended. APT Casino ops will send APTC to your registered Solana wallet shortly.',
    tone: 'emerald',
    pill: 'Ready for payout',
    icon: FaUnlock,
  },
  fulfilled: {
    title: 'APTC delivered',
    body: 'Your allocation has been sent. Check your wallet and the transaction link below.',
    tone: 'cyan',
    pill: 'Delivered',
    icon: FaCheck,
  },
  revoked: {
    title: 'Allocation revoked',
    body: 'This allocation is no longer active. Contact the APT Casino team if you believe this is an error.',
    tone: 'rose',
    pill: 'Revoked',
    icon: FaLock,
  },
};

const TONE_STYLES = {
  amber: {
    border: 'border-amber-500/35',
    bg: 'bg-amber-950/25',
    text: 'text-amber-300',
    pill: 'bg-amber-500/15 text-amber-200 ring-amber-500/30',
    glow: 'from-amber-500/20',
  },
  emerald: {
    border: 'border-emerald-500/35',
    bg: 'bg-emerald-950/25',
    text: 'text-emerald-300',
    pill: 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30',
    glow: 'from-emerald-500/20',
  },
  cyan: {
    border: 'border-cyan-500/35',
    bg: 'bg-cyan-950/25',
    text: 'text-cyan-300',
    pill: 'bg-cyan-500/15 text-cyan-200 ring-cyan-500/30',
    glow: 'from-cyan-500/20',
  },
  rose: {
    border: 'border-rose-500/35',
    bg: 'bg-rose-950/25',
    text: 'text-rose-300',
    pill: 'bg-rose-500/15 text-rose-200 ring-rose-500/30',
    glow: 'from-rose-500/20',
  },
};

function VestingTimeline({ allocation, cliffCountdown, unlockCountdown }) {
  const lockedMs = new Date(allocation.lockedAt).getTime();
  const cliffMs = new Date(allocation.cliffEndsAt).getTime();
  const unlockMs = new Date(allocation.unlockAt).getTime();
  const now = Date.now();
  const total = Math.max(1, unlockMs - lockedMs);
  const progress = Math.min(100, Math.max(0, ((now - lockedMs) / total) * 100));
  const cliffPct = Math.min(100, Math.max(0, ((cliffMs - lockedMs) / total) * 100));
  const cliffDone = cliffCountdown.done;
  const unlockDone = unlockCountdown.done;

  const steps = [
    { id: 'start', label: 'Allocated', date: allocation.lockedAt, done: true },
    { id: 'cliff', label: 'Cliff ends', date: allocation.cliffEndsAt, done: cliffDone },
    { id: 'unlock', label: 'Full unlock', date: allocation.unlockAt, done: unlockDone },
    {
      id: 'payout',
      label: allocation.effectiveStatus === 'fulfilled' ? 'Paid out' : 'Payout',
      date: allocation.fulfilledAt,
      done: allocation.effectiveStatus === 'fulfilled',
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Vesting schedule</p>
          <p className="text-sm text-white/70 mt-1">
            {allocation.cliffDays}-day cliff · {allocation.lockDays}-day total lock
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-white/50">{Math.round(progress)}% elapsed</span>
      </div>

      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden mb-6">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
        {cliffPct > 0 && cliffPct < 100 ? (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80"
            style={{ left: `${cliffPct}%` }}
            title="Cliff milestone"
          />
        ) : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-xl border px-3 py-3 ${
              step.done ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {step.done ? (
                <FaCheck className="text-emerald-400 text-[10px]" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-white/20" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">{step.label}</span>
            </div>
            <p className="text-xs text-white/75">{step.date ? fmtShortDate(step.date) : '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KolPortalClient({ slug }) {
  const [password, setPassword] = useState('');
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const cliffCountdown = useCountdown(allocation?.secondsUntilCliff);
  const unlockCountdown = useCountdown(allocation?.secondsUntilUnlock);

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

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading && !authed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-white/60">
        <div className="h-10 w-10 rounded-full border-2 border-fuchsia-500/30 border-t-fuchsia-400 animate-spin" />
        <p className="text-sm">Loading partner portal…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-[1px] bg-gradient-to-br from-fuchsia-500/40 via-violet-500/20 to-transparent">
          <div className="rounded-2xl bg-[#0c0510]/95 p-8 shadow-2xl backdrop-blur">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/50 to-fuchsia-600/30 ring-1 ring-white/10">
                <FaUserFriends className="text-fuchsia-200 text-2xl" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-300/80">APTC KOL program</p>
              <h1 className="mt-2 text-2xl font-display font-bold text-white">Partner portal</h1>
              <p className="mt-2 text-sm text-white/50">
                Private view for <span className="font-mono text-white/70">/kol/{slug}</span>
              </p>
            </div>
            <form onSubmit={login} className="space-y-4">
              <label className="block text-sm">
                <span className="text-white/60">Portal password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder:text-white/25 focus:border-fuchsia-500/50 focus:outline-none"
                  placeholder="Provided by APT Casino team"
                  required
                  autoComplete="current-password"
                />
              </label>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-semibold text-white shadow-lg shadow-fuchsia-900/30 disabled:opacity-50"
              >
                {authLoading ? 'Verifying…' : 'View my allocation'}
              </button>
            </form>
            <p className="mt-6 text-center text-[11px] text-white/35">
              Do not share your portal password. Contact APT Casino if you need a reset.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusKey = allocation.effectiveStatus || 'locked';
  const status = STATUS[statusKey] || STATUS.locked;
  const tone = TONE_STYLES[status.tone] || TONE_STYLES.amber;
  const StatusIcon = status.icon;
  const statusBody =
    statusKey === 'locked'
      ? `Your APTC partner allocation is reserved. Tokens unlock after ${lockTermsCopy(allocation)}, then the team processes your payout.`
      : status.body;

  const earningsTracks = [
    {
      title: 'Live streaming rewards',
      desc: '0.1% / 0.2% / 0.3% of platform revenue for 5 / 15 / 30+ minute sessions.',
      href: '/live',
      icon: <FaVideo className="text-cyan-300" />,
      cta: 'Go live',
    },
    {
      title: 'Referral monetization',
      desc: 'Earn up to 20% of qualified first deposits in APTC via your referral link.',
      href: '/referral',
      icon: <FaBullhorn className="text-blue-300" />,
      cta: 'Referral hub',
    },
    {
      title: 'Daily rewards',
      desc: 'Promote daily streak loops — up to ~30 APTC on the top day.',
      href: '/profile',
      icon: <FaGift className="text-amber-300" />,
      cta: 'Profile rewards',
    },
    {
      title: 'Deposit cashback',
      desc: 'Up to 1% cashback on net deposits for active Solana players.',
      href: '/profile',
      icon: <FaCoins className="text-emerald-300" />,
      cta: 'Cashback',
    },
    {
      title: 'APTC staking',
      desc: 'Guide holders into fixed-term pools — APY tiers from 30% to 360%.',
      href: '/stake',
      icon: <FaLock className="text-violet-300" />,
      cta: 'Stake page',
    },
    {
      title: 'OTC lottery',
      desc: 'Size-friendly SOL → APTC entries that skip thin DEX books.',
      href: '/otc-lottery',
      icon: <FaTicketAlt className="text-rose-300" />,
      cta: 'OTC lottery',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <div className={`relative overflow-hidden rounded-2xl border ${tone.border} ${tone.bg} p-6 sm:p-8`}>
        <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${tone.glow} to-transparent blur-3xl`} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Partner allocation</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-display font-bold text-white">{allocation.displayName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone.pill}`}>
                <StatusIcon className="text-[10px]" /> {status.pill}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60 ring-1 ring-white/10">
                {allocation.pctOfSupply}% of max supply
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-mono text-white/50 ring-1 ring-white/10">
                /kol/{allocation.slug}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <FaSignOutAlt /> Sign out
          </button>
        </div>
        <p className="relative mt-4 max-w-2xl text-sm text-white/65 leading-relaxed">{statusBody}</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45 mb-2">
            <FaCoins className="text-amber-400" /> Your allocation
          </div>
          <p className="text-3xl sm:text-4xl font-display font-bold text-white tabular-nums leading-none">
            {fmtNum(allocation.amountAptc)}
          </p>
          <p className="text-sm text-amber-200/70 mt-2">APTC tokens</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45 mb-2">
            <FaClock className="text-violet-400" /> Cliff countdown
          </div>
          <p className="text-2xl font-display font-bold text-white tabular-nums">
            {cliffCountdown.done ? 'Cliff passed' : cliffCountdown.label}
          </p>
          <p className="text-xs text-white/50 mt-2">{fmtDate(allocation.cliffEndsAt)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-transparent p-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45 mb-2">
            <FaUnlock className="text-fuchsia-400" /> Full unlock
          </div>
          <p className="text-2xl font-display font-bold text-white tabular-nums">
            {unlockCountdown.done ? 'Unlocked' : unlockCountdown.label}
          </p>
          <p className="text-xs text-white/50 mt-2">{fmtDate(allocation.unlockAt)}</p>
        </div>
      </div>

      <VestingTimeline allocation={allocation} cliffCountdown={cliffCountdown} unlockCountdown={unlockCountdown} />

      {/* Details */}
      <div className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3">
          <h3 className="text-sm font-semibold text-white">Allocation details</h3>
        </div>
        <dl className="divide-y divide-white/5 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4">
            <dt className="text-white/45 shrink-0">Payout wallet</dt>
            <dd className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs sm:text-sm text-white/85 break-all text-right sm:text-left">
                {allocation.walletAddress}
              </span>
              <button
                type="button"
                onClick={() => copyText(allocation.walletAddress, 'wallet')}
                className="shrink-0 rounded-lg border border-white/10 p-2 text-white/50 hover:text-white hover:bg-white/5"
                title="Copy wallet"
              >
                {copied === 'wallet' ? <FaCheck className="text-emerald-400 text-xs" /> : <FaCopy className="text-xs" />}
              </button>
              <a
                href={`https://solscan.io/account/${allocation.walletAddress}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg border border-white/10 p-2 text-white/50 hover:text-cyan-300 hover:bg-white/5 inline-flex items-center justify-center"
                title="View on Solscan"
              >
                <SolscanMark size={14} />
              </a>
            </dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-white/45">Lock started</dt>
            <dd className="text-white/85">{fmtDate(allocation.lockedAt)}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-white/45">Cliff period</dt>
            <dd className="text-white/85 text-right">
              {allocation.cliffDays} days
              <span className="block text-xs text-white/45">ends {fmtDate(allocation.cliffEndsAt)}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-white/45">Total lock</dt>
            <dd className="text-white/85 text-right">
              {allocation.lockDays} days
              <span className="block text-xs text-white/45">unlock {fmtDate(allocation.unlockAt)}</span>
            </dd>
          </div>
          {allocation.xHandle ? (
            <DetailRow label="X">
              <a
                href={xProfileUrl(allocation.xHandle)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                {xProfileLabel(allocation.xHandle)}
                <FaExternalLinkAlt className="text-[10px] opacity-70" />
              </a>
            </DetailRow>
          ) : null}
          {allocation.country ? <DetailRow label="Country">{allocation.country}</DetailRow> : null}
          {allocation.telegram ? (
            <DetailRow label="Tg">
              <a
                href={telegramUrl(allocation.telegram)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                {telegramLabel(allocation.telegram)}
                <FaExternalLinkAlt className="text-[10px] opacity-70" />
              </a>
            </DetailRow>
          ) : null}
          {allocation.avgPostViews != null ? (
            <DetailRow label="Avg post views">{fmtNum(allocation.avgPostViews)}</DetailRow>
          ) : null}
          {allocation.promotionCondition ? (
            <DetailRow label="Promotion condition" multiline>
              <span className="whitespace-pre-wrap text-sm leading-relaxed">{allocation.promotionCondition}</span>
            </DetailRow>
          ) : null}
          {allocation.broughtBy ? <DetailRow label="Brought by">{allocation.broughtBy}</DetailRow> : null}
          {allocation.broughtOn ? (
            <DetailRow label="Brought on">{fmtDateOnly(allocation.broughtOn)}</DetailRow>
          ) : null}
          {allocation.fulfillmentTxHash ? (
            <div className="flex justify-between gap-4 items-center px-5 py-4">
              <dt className="text-white/45">Payout transaction</dt>
              <dd>
                <SolscanLink
                  href={`https://solscan.io/tx/${allocation.fulfillmentTxHash}`}
                  size={13}
                  className="text-cyan-300 hover:text-cyan-200 font-mono text-xs"
                >
                  View on Solscan
                </SolscanLink>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Password — collapsible */}
      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setPwOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaKey className="text-violet-400 text-sm" />
            <span className="text-sm font-semibold text-white">Portal password</span>
          </div>
          <FaChevronDown className={`text-white/40 text-xs transition-transform ${pwOpen ? 'rotate-180' : ''}`} />
        </button>
        {pwOpen ? (
          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-xs text-white/45 mb-4">
              Update your private portal password. Your APT Casino contact can see the latest value in the admin dashboard.
            </p>
            <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-2 max-w-xl">
              <label className="block text-sm sm:col-span-2">
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
              {pwError ? <p className="text-sm text-rose-300 sm:col-span-2">{pwError}</p> : null}
              {pwMessage ? <p className="text-sm text-emerald-300 sm:col-span-2">{pwMessage}</p> : null}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="rounded-lg bg-violet-600/90 hover:bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {pwLoading ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>

      {/* Earnings hub */}
      <section className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <FaChartLine className="text-fuchsia-300" />
          <h3 className="text-base font-semibold text-white">Grow your partner income</h3>
        </div>
        <p className="text-xs text-white/50 mb-5 max-w-2xl leading-relaxed">
          Stack multiple earning tracks — streams, referrals, staking, OTC, and promos — to maximize total partner revenue beyond your APTC allocation.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {earningsTracks.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-white/10 bg-black/30 p-4 hover:border-fuchsia-500/30 hover:bg-fuchsia-500/5 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-white/5 p-2 ring-1 ring-white/10 group-hover:ring-fuchsia-500/20">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{item.desc}</p>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-fuchsia-300/90 mt-2.5">
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
