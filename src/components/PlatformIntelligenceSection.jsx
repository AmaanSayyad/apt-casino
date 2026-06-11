'use client';

import { useEffect, useRef, useState } from 'react';
import { useSharedPublicStats } from '@/hooks/useSharedStats';
import {
  FaChartLine,
  FaTrophy,
  FaWallet,
  FaUsers,
} from 'react-icons/fa';

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
  const { data: pub } = useSharedPublicStats();
  const [started, setStarted] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
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
  }, []);

  const allTime = [
    { key: 'totalRoundsPlayed', label: 'Total Rounds Played', icon: FaChartLine, value: pub?.totalRoundsPlayed ?? 0 },
    { key: 'playerRoundsWon', label: 'Player Rounds Won', icon: FaTrophy, value: pub?.playerRoundsWon ?? 0 },
    { key: 'depositsProcessed', label: 'Deposits Processed', icon: FaWallet, value: pub?.depositsProcessed ?? 0 },
    { key: 'uniqueTraders', label: 'Unique Traders', icon: FaUsers, value: pub?.uniqueTraders ?? 0 },
  ];

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
