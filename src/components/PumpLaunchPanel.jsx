'use client';

import {
  APTC_LAUNCH_METRICS,
  VIRTUALS_LAUNCH_MODE,
  VIRTUALS_LOGO_SRC,
  virtualsTokenUrl,
} from '@/lib/config/tokenomics';
import { isAptcLaunched } from '@/lib/config/launchStatus';

function phaseLabel(phase, isLive) {
  if (isLive || phase === 'live' || phase === 'graduated') return 'Live · Robinhood';
  if (phase === 'bonding_curve') return 'Launching · Virtuals';
  if (phase === 'pre_launch') return 'Pre-launch · Virtuals';
  return 'Launch status';
}

function phaseTone(phase, isLive) {
  if (isLive || phase === 'live' || phase === 'graduated') return 'emerald';
  if (phase === 'bonding_curve') return 'teal';
  return 'amber';
}

/** Launch panel — Virtuals Protocol on Robinhood (keeps PumpLaunchPanel export name for imports). */
export default function PumpLaunchPanel({ pump, loading = false, compact = false }) {
  const launched = isAptcLaunched();
  const m = APTC_LAUNCH_METRICS;
  const v = VIRTUALS_LAUNCH_MODE;

  const phase = pump?.poolPhase ?? (launched ? 'live' : 'pre_launch');
  const isLive = launched || pump?.isGraduated || phase === 'live' || phase === 'graduated';
  const tone = phaseTone(phase, isLive);

  const toneClasses = {
    emerald: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    teal: 'border-teal-400/25 bg-teal-500/10 text-teal-200',
    amber: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0f000c] ${
        compact ? 'p-4 md:p-5' : 'p-5 md:p-6'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={VIRTUALS_LOGO_SRC} alt="Virtuals" className="w-5 h-5 rounded-md object-contain" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
              Virtuals · Robinhood
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${toneClasses[tone]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${isLive ? 'animate-pulse' : ''}`} />
              {phaseLabel(phase, isLive)}
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">
              {pump?.source === 'live' ? 'DexScreener' : v.scheduledLaunchLabel}
            </span>
          </div>
        </div>

        <a
          href={pump?.pumpTokenUrl ?? pump?.virtualsTokenUrl ?? virtualsTokenUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 hover:text-white hover:border-white/25 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={VIRTUALS_LOGO_SRC} alt="" className="w-3.5 h-3.5 rounded object-contain" aria-hidden />
          {launched ? 'View on Virtuals' : 'View on Virtuals'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {!isLive && (
        <p className="mb-4 text-[11px] text-white/45 leading-relaxed">
          Agent token on EconomyOS · {v.liquidityPoolPct}% Uniswap LP · {v.veVirtualAirdropPct}% veVIRTUAL
          airdrop · {v.teamInitialBuyPct}% team pre-buy ({v.teamCliffMonths}mo cliff · {v.teamVestMonths}mo vest) ·
          anti-sniper {v.antiSniperSeconds}s.
        </p>
      )}

      <div className={`grid gap-3 ${compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
        <AnalyticsStat
          label="LP"
          value={loading ? '…' : `${v.liquidityPoolPct}%`}
          sub="Uniswap · Robinhood"
        />
        <AnalyticsStat
          label="veVIRTUAL"
          value={loading ? '…' : `${v.veVirtualAirdropPct}%`}
          sub="Staker airdrop"
        />
        <AnalyticsStat
          label="Team buy"
          value={loading ? '…' : `${v.teamInitialBuyPct}%`}
          sub={`${v.teamCliffMonths}mo cliff · ${v.teamVestMonths}mo vest`}
        />
        <AnalyticsStat
          label="Anti-sniper"
          value={loading ? '…' : `${v.antiSniperSeconds}s`}
          sub={`Pre-buy ~${v.preBuyVirtualAmount} VIRTUAL`}
        />
      </div>
    </div>
  );
}

function AnalyticsStat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-1 text-sm md:text-base font-semibold text-white font-mono">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-white/35">{sub}</p> : null}
    </div>
  );
}
