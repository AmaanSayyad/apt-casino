'use client';

import Link from 'next/link';
import {
  APTC_LAUNCH_METRICS,
  PUMP_LAUNCH_MODE,
  PUMP_LOGO_SRC,
  pumpTokenUrl,
} from '@/lib/config/tokenomics';
import { isAptcLaunched } from '@/lib/config/launchStatus';

function phaseLabel(phase, isGraduated) {
  if (isGraduated || phase === 'graduated') return 'Graduated · PumpSwap';
  if (phase === 'bonding_curve') return 'Bonding curve · Pump.fun';
  if (phase === 'pre_launch') return 'Pre-launch · Pump.fun';
  return 'Launch status';
}

function phaseTone(phase, isGraduated) {
  if (isGraduated || phase === 'graduated') return 'emerald';
  if (phase === 'bonding_curve') return 'fuchsia';
  return 'amber';
}

export default function PumpLaunchPanel({ pump, loading = false, compact = false }) {
  const launched = isAptcLaunched();
  const m = APTC_LAUNCH_METRICS;

  const phase = pump?.poolPhase ?? (launched ? 'unknown' : 'pre_launch');
  const isGraduated = pump?.isGraduated ?? false;
  const tone = phaseTone(phase, isGraduated);
  const gradTarget = pump?.graduationSolTarget ?? m.graduationSol;

  const toneClasses = {
    emerald: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    fuchsia: 'border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200',
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
            <img src={PUMP_LOGO_SRC} alt="Pump.fun" className="w-5 h-5 rounded-md object-contain" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
              Pump.fun launch
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${toneClasses[tone]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${isGraduated ? 'animate-pulse' : ''}`} />
              {phaseLabel(phase, isGraduated)}
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">
              {pump?.source === 'live' ? 'DexScreener' : 'Launch params'}
            </span>
          </div>
        </div>

        <a
          href={pump?.pumpTokenUrl ?? pumpTokenUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 hover:text-white hover:border-white/25 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PUMP_LOGO_SRC} alt="" className="w-3.5 h-3.5 rounded object-contain" aria-hidden />
          {launched ? 'View on Pump.fun' : 'Create on Pump.fun'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {!isGraduated && (
        <p className="mb-4 text-[11px] text-white/45 leading-relaxed">
          Default SOL-paired launch — curve completes at ~{gradTarget} SOL raised, then migrates to PumpSwap with LP
          burned. Creator dev buy target: ~{m.devHoldPct}% supply.
        </p>
      )}

      <div className={`grid gap-3 ${compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
        <AnalyticsStat
          label="Dev hold"
          value={loading ? '…' : `~${pump?.devHoldPct ?? m.devHoldPct}%`}
          sub="Creator buy at TGE"
        />
        <AnalyticsStat
          label="Curve fee"
          value={loading ? '…' : `${pump?.curveTotalFeePct ?? PUMP_LAUNCH_MODE.curveTotalFeePct}%`}
          sub="Pre-graduation"
        />
        <AnalyticsStat
          label="Creator fee"
          value={loading ? '…' : `${pump?.creatorFeePct ?? PUMP_LAUNCH_MODE.curveCreatorFeePct}%`}
          sub="→ @aptcasinofun"
        />
        <AnalyticsStat
          label="Graduation"
          value={loading ? '…' : isGraduated ? 'Complete' : `~${gradTarget} SOL`}
          sub={isGraduated ? 'PumpSwap live' : 'Curve target'}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2 text-[10px]">
        <DocLink href={PUMP_LAUNCH_MODE.feesDocsUrl} label="Fee schedule" />
        <DocLink href={PUMP_LAUNCH_MODE.publicDocsUrl} label="Program docs" />
        <DocLink href={PUMP_LAUNCH_MODE.createUrl} label="Create flow" />
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

function DocLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/55 hover:text-white/80 hover:border-white/20 transition-colors uppercase tracking-[0.12em]"
    >
      {label} →
    </a>
  );
}
