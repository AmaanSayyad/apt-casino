'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Activity, Trophy, Wallet, Users, Zap } from 'lucide-react';
import { useSharedPublicStats } from '@/hooks/useSharedStats';

function useCountUp(target, duration = 1300, started = false) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!started || !Number.isFinite(target)) return;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
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

function StatCell({ label, value, display, icon: Icon, iconClass, gradient, started }) {
  const count = useCountUp(value, 1300, started);
  const shown = display ? display(count) : fmtCount(count);

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 px-4 py-5 sm:px-5 sm:py-6">
      <div className="flex items-center gap-1.5 text-white/55">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} strokeWidth={2} />
        <span className="whitespace-nowrap text-[10px] font-display uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <p
        className={`font-display text-2xl font-bold tabular-nums whitespace-nowrap sm:text-3xl bg-clip-text text-transparent ${gradient}`}
      >
        {shown}
      </p>
    </div>
  );
}

function ChainPanel({ name, logo, accent, labelColor, stats, started }) {
  const rounds = useCountUp(stats.rounds, 1100, started);
  const wins = useCountUp(stats.wins, 1100, started);
  const deposits = useCountUp(stats.deposits, 1100, started);

  const rows = [
    { label: 'Rounds', value: fmtCount(rounds) },
    { label: 'Wins', value: fmtCount(wins) },
    { label: 'Deposits', value: fmtCount(deposits) },
  ];

  return (
    <div className={`min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 ${accent}`}>
      <div className="mb-4 flex items-center gap-2.5">
        <Image src={logo} alt={name} width={20} height={20} className="rounded-full" />
        <span className={`font-display text-sm font-semibold ${labelColor}`}>{name}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-white/[0.06] bg-black/20 px-2 py-3 text-center">
            <p className="text-[10px] font-display uppercase tracking-wider text-white/40">{row.label}</p>
            <p className="mt-1 font-display text-base font-bold tabular-nums text-white sm:text-lg">{row.value}</p>
          </div>
        ))}
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
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const winRate = pub?.winRatePct ?? 0;
  const traders = pub?.uniqueTraders ?? 0;

  return (
    <section ref={sectionRef} className="px-4 py-16 md:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-red-magic to-blue-magic" />
              <span className="text-[11px] font-display uppercase tracking-[0.18em] text-white/45">
                Protocol analytics
              </span>
            </div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Platform{' '}
              <span className="bg-gradient-to-r from-red-magic to-blue-magic bg-clip-text text-transparent">
                Intelligence
              </span>
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/50">
              All-time play metrics across Solana and Aptos.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
              <Zap className="h-4 w-4 text-fuchsia-400" strokeWidth={2} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Win rate</p>
                <p className="font-display text-lg font-bold tabular-nums text-white">
                  {started ? `${winRate.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>
            {traders > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
                <Users className="h-4 w-4 text-white/50" strokeWidth={2} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Traders</p>
                  <p className="font-display text-lg font-bold tabular-nums text-white">{fmtCount(traders)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <StatCell
              label="Total rounds"
              value={pub?.totalRoundsPlayed ?? 0}
              icon={Activity}
              iconClass="text-violet-400"
              gradient="bg-gradient-to-r from-violet-300 to-fuchsia-300"
              started={started}
            />
            <StatCell
              label="Player wins"
              value={pub?.playerRoundsWon ?? 0}
              icon={Trophy}
              iconClass="text-amber-400"
              gradient="bg-gradient-to-r from-amber-200 to-orange-300"
              started={started}
            />
            <StatCell
              label="Deposits"
              value={pub?.depositsProcessed ?? 0}
              icon={Wallet}
              iconClass="text-emerald-400"
              gradient="bg-gradient-to-r from-emerald-200 to-teal-300"
              started={started}
            />
          </div>

          <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <ChainPanel
              name="Solana"
              logo="/logos/solana-sol-logo.png"
              accent="bg-emerald-500/[0.04]"
              labelColor="text-emerald-300"
              stats={{
                rounds: pub?.roundsByChain?.solana ?? 0,
                wins: pub?.winsByChain?.solana ?? 0,
                deposits: pub?.depositsByChain?.solana ?? 0,
              }}
              started={started}
            />
            <ChainPanel
              name="Aptos"
              logo="/logos/aptos-logo.png"
              accent="bg-sky-500/[0.04]"
              labelColor="text-sky-300"
              stats={{
                rounds: pub?.roundsByChain?.aptos ?? 0,
                wins: pub?.winsByChain?.aptos ?? 0,
                deposits: pub?.depositsByChain?.aptos ?? 0,
              }}
              started={started}
            />
          </div>
        </div>

        {pub?.supabaseConfigured === false && (
          <p className="mt-4 text-center text-xs text-amber-300/65">
            Set SUPABASE_SERVICE_ROLE_KEY for live deposit counters.
          </p>
        )}
      </div>
    </section>
  );
}
