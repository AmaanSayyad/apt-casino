'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FaChartLine,
  FaTrophy,
  FaWallet,
  FaUsers,
  FaBolt,
  FaCoins,
  FaMedal,
} from 'react-icons/fa';
import { formatCombinedNative } from '@/lib/formatVolume';

function useCountUp(target, duration = 1400, started = false) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!started || !target) return;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(target * eased);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, started]);

  return value;
}

function fmtCount(n) {
  if (n == null || !Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

function fmtCombined(byChain, fallback) {
  if (byChain && Object.keys(byChain).length) return formatCombinedNative(byChain);
  if (fallback != null && Number.isFinite(fallback)) {
    return formatCombinedNative({ aptos: fallback });
  }
  return '0';
}

function StatCard({ label, value, display, icon: Icon, started }) {
  const count = useCountUp(value, 1400, started);
  const shown = display ? display(count) : fmtCount(count);
  return (
    <div className="bg-[#1A0015] rounded-lg p-5 flex items-center gap-4 border border-white/5">
      <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-r from-red-magic/30 to-blue-magic/30">
        <Icon className="text-white text-xl" />
      </div>
      <div className="min-w-0">
        <h3 className="text-white/70 text-sm">{label}</h3>
        <p className="text-white text-2xl font-bold tabular-nums leading-tight">{shown}</p>
      </div>
    </div>
  );
}

export default function PlatformIntelligenceSection() {
  const [pub, setPub] = useState(null);
  const [live, setLive] = useState(null);
  const [started, setStarted] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [p, l] = await Promise.all([
          fetch('/api/stats/public').then((r) => r.json()).catch(() => ({})),
          fetch('/api/stats/live').then((r) => r.json()).catch(() => ({})),
        ]);
        if (cancelled) return;
        setPub(p);
        setLive(l);
      } catch {
        if (!cancelled) {
          setPub({});
          setLive({});
        }
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!sectionRef.current || pub === null) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [pub]);

  const allTime = [
    { key: 'totalRoundsPlayed', label: 'Total Rounds Played', icon: FaChartLine, value: pub?.totalRoundsPlayed ?? 0 },
    { key: 'playerRoundsWon', label: 'Player Rounds Won', icon: FaTrophy, value: pub?.playerRoundsWon ?? 0 },
    { key: 'depositsProcessed', label: 'Deposits Processed', icon: FaWallet, value: pub?.depositsProcessed ?? 0 },
    { key: 'uniqueTraders', label: 'Unique Traders', icon: FaUsers, value: pub?.uniqueTraders ?? 0 },
  ];

  const liveStats = [
    { key: 'activePlayers', label: 'Active Players (24h)', icon: FaBolt, value: live?.activePlayers ?? 0 },
    {
      key: 'totalWagered',
      label: 'Total Wagered (all chains)',
      icon: FaCoins,
      value: 1,
      display: () =>
        fmtCombined(live?.totalWagered24hByChain, live?.totalWageredApt),
    },
    { key: 'dailyWinners', label: 'Daily Winners (24h)', icon: FaMedal, value: live?.dailyWinners ?? 0 },
  ];

  const recentWinners = live?.recentWinners ?? [];

  return (
    <section ref={sectionRef} className="py-16 md:py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-red-magic to-blue-magic" />
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300/80">Protocol Analytics</p>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-3">
          Platform{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
            Intelligence
          </span>
        </h2>
        <p className="text-white/55 text-center max-w-2xl mx-auto mb-10">
          Real-time metrics across Solana and Aptos play — house balances, on-chain history, and Supabase multichain
          play events{pub?.supabaseConfigured ? ' and deposit counters' : ''}.
        </p>

        <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl">
          <div className="bg-[#120010] rounded-xl p-5 md:p-7">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white/80 text-sm font-semibold tracking-wide">All-time</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {allTime.map((s) => (
                <StatCard key={s.key} label={s.label} value={s.value} icon={s.icon} started={started} />
              ))}
            </div>

            <div className="flex items-center gap-2 mt-8 mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-white/80 text-sm font-semibold tracking-wide">Live (last 24h)</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStats.map((s) => (
                <StatCard
                  key={s.key}
                  label={s.label}
                  value={s.value}
                  icon={s.icon}
                  display={s.display}
                  started={started}
                />
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-white font-medium mb-4 flex items-center">
                <div className="w-1 h-4 magic-gradient rounded-full mr-2" />
                Recent Big Winners
              </h3>

              {recentWinners.length === 0 ? (
                <p className="text-white/50 text-sm">No wins recorded yet. Play a round to appear here.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentWinners.map((winner, idx) => (
                    <div
                      key={`${winner.wallet}-${winner.timestampSec}-${idx}`}
                      className="p-[1px] bg-gradient-to-r from-red-magic/40 to-blue-magic/40 rounded-lg"
                    >
                      <div className="bg-[#1A0015] rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-white font-medium truncate font-mono text-sm" title={winner.wallet}>
                            {winner.walletShort || 'Player'}
                          </p>
                          <span className="text-xs text-white/50 shrink-0 ml-2">{winner.timeAgo}</span>
                        </div>
                        <p className="text-sm text-white/70 mb-1">Game: {winner.game}</p>
                        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-magic to-blue-magic tabular-nums">
                          {winner.payoutDisplay ||
                            `${winner.payoutApt?.toLocaleString('en-US', { maximumFractionDigits: 4 }) ?? '0'} SOL · APT`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pub && pub.supabaseConfigured === false && (
              <p className="mt-6 text-center text-xs text-amber-300/70">
                Set SUPABASE_SERVICE_ROLE_KEY to enable Deposits Processed and Unique Traders.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
