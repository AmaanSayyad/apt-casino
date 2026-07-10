'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, Zap } from 'lucide-react';
import { IpoLogoIcon } from '@/components/IpoStackLogos';
import { SolscanMark } from '@/components/ui/SolscanMark';

const POLL_MS = 18_000;
const SOLSCAN_TX = 'https://solscan.io/tx/';

function fmt(n, opts = {}) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, opts);
}

function fmtUsd(n) {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function shortWallet(wallet) {
  if (!wallet || wallet.length < 12) return wallet || '—';
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

const PLACEHOLDER_ITEMS = [
  { id: 'wait-1', kind: 'placeholder', text: 'Watching for live buys…' },
  { id: 'wait-2', kind: 'placeholder', text: 'New buys appear here in real time' },
  { id: 'wait-3', kind: 'placeholder', text: 'Every purchase is on-chain · tap to verify on Solscan' },
];

function ActivityChip({ item }) {
  if (item.kind === 'placeholder') {
    return (
      <span className="ipo-activity-chip ipo-activity-chip--placeholder">
        <Zap className="h-3.5 w-3.5 text-fuchsia-300/80 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">{item.text}</span>
      </span>
    );
  }

  const settling = item.status === 'pending_supply';

  return (
    <a
      href={item.solTxHash ? `${SOLSCAN_TX}${item.solTxHash}` : undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="ipo-activity-chip group"
      title={item.wallet}
    >
      <SolscanMark size={13} className="opacity-80 group-hover:opacity-100" />
      <span className="font-mono text-fuchsia-200/90 group-hover:text-fuchsia-100 transition-colors">
        {shortWallet(item.wallet)}
      </span>
      <span className="text-white/25" aria-hidden>
        ·
      </span>
      <span className="inline-flex items-center gap-1 text-white/70">
        <IpoLogoIcon logoId="solana" size={14} />
        <span className="tabular-nums font-semibold text-white/85">{fmt(item.solAmount, { maximumFractionDigits: 2 })}</span>
        <span className="text-white/45">SOL</span>
      </span>
      <span className="text-white/30" aria-hidden>
        →
      </span>
      <span className="inline-flex items-center gap-1 text-emerald-200/90">
        <IpoLogoIcon logoId="aptc" size={14} className="rounded-sm" />
        <span className="tabular-nums font-semibold">{fmt(item.aptcAmount, { maximumFractionDigits: 0 })}</span>
        <span className="text-emerald-200/60">APTC</span>
      </span>
      <span className="text-white/25 hidden sm:inline" aria-hidden>
        ·
      </span>
      <span className="tabular-nums text-white/40 hidden sm:inline">{fmtUsd(item.usdValue)}</span>
      <span className="text-white/25" aria-hidden>
        ·
      </span>
      <span className="text-white/35 tabular-nums">{timeAgo(item.createdAt)}</span>
      {settling ? (
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/90">
          settling
        </span>
      ) : null}
    </a>
  );
}

export default function IpoRecentBuyersTicker({ phase = 'upcoming', className = '' }) {
  const reduceMotion = useReducedMotion();
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/ipo/recent?limit=24', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        setActivity(
          (j.activity || []).map((row) => ({
            ...row,
            kind: 'purchase',
          })),
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const items = useMemo(() => {
    const base = activity.length > 0 ? activity : PLACEHOLDER_ITEMS;
    return [...base, ...base];
  }, [activity]);

  const isLive = phase === 'live';
  const duration = activity.length > 8 ? '42s' : activity.length > 3 ? '32s' : '28s';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`ipo-activity-ticker rounded-xl border border-white/[0.08] bg-[#0a0008]/90 overflow-hidden ${className}`}
      role="region"
      aria-label="Live IPO purchase activity"
    >
      <div className="flex items-stretch min-h-[2.75rem]">
        <div className="ipo-activity-ticker-label shrink-0 flex items-center gap-2 border-r border-white/[0.08] bg-fuchsia-500/[0.08] px-3 md:px-4">
          <span className="relative flex h-2 w-2">
            {!reduceMotion && isLive ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            ) : null}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isLive ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]' : 'bg-amber-400'
              }`}
            />
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            <Activity className="h-3.5 w-3.5 text-fuchsia-300/80" aria-hidden />
            {isLive ? 'Live activity' : phase === 'ended' ? 'Final buys' : 'IPO feed'}
          </span>
          <span className="sm:hidden text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">Live</span>
        </div>

        <div className="ipo-activity-ticker-inner relative flex-1 min-w-0">
          <div className="ipo-activity-ticker-fade ipo-activity-ticker-fade--left" aria-hidden />
          <div className="ipo-activity-ticker-fade ipo-activity-ticker-fade--right" aria-hidden />
          <div
            className="ipo-activity-ticker-track"
            style={{ '--ipo-activity-duration': duration }}
          >
            {items.map((item, idx) => (
              <ActivityChip key={`${item.id}-${idx}`} item={item} />
            ))}
          </div>
        </div>

        {!loading && activity.length > 0 ? (
          <div className="hidden md:flex shrink-0 items-center border-l border-white/[0.08] px-3 text-[10px] font-semibold tabular-nums text-white/40">
            {activity.length} recent
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
