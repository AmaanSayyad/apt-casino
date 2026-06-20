'use client';

import Link from 'next/link';
import { APTC_LAUNCH_METRICS } from '@/lib/config/tokenomics';
import { isAptcLaunched } from '@/lib/config/launchStatus';

function fmtSol(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 100) return `${n.toFixed(1)} SOL`;
  if (n >= 1) return `${n.toFixed(2)} SOL`;
  return `${n.toFixed(3)} SOL`;
}

function fmtPct(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${Math.min(100, Math.max(0, n)).toFixed(1)}%`;
}

function phaseLabel(phase, isGraduated) {
  if (isGraduated || phase === 'graduated') return 'Graduated · Meteora DAMM v2';
  if (phase === 'bonding_curve') return 'Bonding curve · Meteora DBC';
  if (phase === 'pre_launch') return 'Pre-launch · Bags.fm';
  return 'Pool status';
}

function phaseTone(phase, isGraduated) {
  if (isGraduated || phase === 'graduated') return 'emerald';
  if (phase === 'bonding_curve') return 'fuchsia';
  return 'amber';
}

export default function BagsAnalyticsPanel({ bags, loading = false, compact = false }) {
  const launched = isAptcLaunched();
  const m = APTC_LAUNCH_METRICS;

  const phase = bags?.poolPhase ?? (launched ? 'unknown' : 'pre_launch');
  const isGraduated = bags?.isGraduated ?? false;
  const tone = phaseTone(phase, isGraduated);
  const progress =
    bags?.curveProgressPct ??
    (phase === 'pre_launch' ? 0 : null);
  const quoteSol =
    bags?.quoteReserveSol ??
    (phase === 'pre_launch' ? m.initialBuySolApprox : null);
  const gradTarget = bags?.graduationSolTarget ?? m.graduationSol;
  const lifetimeFees = bags?.lifetimeFeesSol;
  const claimedFees = bags?.totalFeesClaimedSol;

  const toneClasses = {
    emerald: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    fuchsia: 'border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200',
    amber: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  };

  const barPct =
    progress != null
      ? Math.min(100, Math.max(0, progress))
      : quoteSol != null && gradTarget > 0
        ? Math.min(100, (quoteSol / gradTarget) * 100)
        : 0;

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0f000c] ${
        compact ? 'p-4 md:p-5' : 'p-5 md:p-6'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40 mb-2">
            Bags · Meteora analytics
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${toneClasses[tone]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${isGraduated ? 'animate-pulse' : ''}`} />
              {phaseLabel(phase, isGraduated)}
            </span>
            {bags?.bagsApiConfigured ? (
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">Bags API</span>
            ) : (
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">On-chain + DexScreener</span>
            )}
          </div>
        </div>

        {bags?.bagsTokenUrl ? (
          <a
            href={bags.bagsTokenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 hover:text-white hover:border-white/25 transition-colors"
          >
            View on Bags
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ) : (
          <Link
            href="https://bags.fm/launch"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-200 hover:bg-fuchsia-500/20 transition-colors"
          >
            Launch on Bags
          </Link>
        )}
      </div>

      {!isGraduated && (
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3 text-xs text-white/50 mb-2">
            <span>Graduation progress</span>
            <span className="font-mono text-white/70">
              {loading ? '…' : `${fmtSol(quoteSol)} / ${fmtSol(gradTarget)}`}
              {!loading && progress != null ? ` · ${fmtPct(progress)}` : ''}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isGraduated ? 'bg-emerald-400' : 'bg-gradient-to-r from-fuchsia-500 to-purple-500'
              }`}
              style={{ width: loading ? '0%' : `${barPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            {phase === 'pre_launch'
              ? `Target: ${m.graduationSol} SOL raised on curve → auto-migrate to Meteora DAMM v2.`
              : 'SOL in the bonding curve toward the Meteora graduation threshold.'}
          </p>
        </div>
      )}

      <div className={`grid gap-3 ${compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
        <AnalyticsStat
          label="Curve SOL"
          value={loading ? '…' : fmtSol(quoteSol)}
          sub={isGraduated ? 'Migrated' : 'Quote reserve'}
        />
        <AnalyticsStat
          label="Lifetime fees"
          value={loading ? '…' : fmtSol(lifetimeFees)}
          sub="2% trade fee"
        />
        <AnalyticsStat
          label="Fees claimed"
          value={loading ? '…' : fmtSol(claimedFees)}
          sub="@aptcasinofun share"
        />
        <AnalyticsStat
          label="Graduation"
          value={loading ? '…' : isGraduated ? 'Complete' : fmtSol(gradTarget)}
          sub={isGraduated ? 'DAMM v2 live' : 'SOL threshold'}
        />
      </div>

      {(bags?.pools?.dbcPoolKey || bags?.pools?.dammV2PoolKey) && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
          {bags.pools.dbcPoolKey && (
            <PoolLink label="DBC pool" address={bags.pools.dbcPoolKey} />
          )}
          {bags.pools.dammV2PoolKey && (
            <PoolLink label="DAMM v2" address={bags.pools.dammV2PoolKey} />
          )}
        </div>
      )}
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

function PoolLink({ label, address }) {
  return (
    <a
      href={`https://solscan.io/account/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-mono text-white/55 hover:text-white/80 hover:border-white/20 transition-colors"
    >
      <span className="uppercase tracking-[0.12em] text-white/35">{label}</span>
      {address.slice(0, 4)}…{address.slice(-4)}
    </a>
  );
}
