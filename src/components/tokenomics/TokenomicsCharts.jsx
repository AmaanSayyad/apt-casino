'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  APTC_ALLOCATION,
  APTC_TOKENOMICS,
  BUYBACK_SPLIT_COLORS,
  CREATOR_BUY_DEPLOYMENT,
  CREATOR_BUY_PURPOSE,
} from '@/lib/config/tokenomics';

const CHART_TOOLTIP = {
  contentStyle: {
    background: 'rgba(18, 0, 16, 0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#fff',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  itemStyle: { color: '#e9d5ff' },
  labelStyle: { color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
};

function DonutCenter({ title, subtitle }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-[10px] uppercase tracking-widest text-white/40">{title}</span>
      <span className="text-lg md:text-xl font-bold text-white tabular-nums">{subtitle}</span>
    </div>
  );
}

/** Supply allocation donut + legend */
export function AllocationDonut({ variant = 'default' }) {
  const isLitepaper = variant === 'litepaper';
  const data = APTC_ALLOCATION.map((row) => ({
    name: row.label,
    value: row.pct,
    fill: row.fill,
  }));

  return (
    <div className={isLitepaper ? 'space-y-8' : 'space-y-4'}>
      <div
        className={
          isLitepaper
            ? 'grid gap-8 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:items-center lg:gap-10'
            : 'flex flex-col lg:flex-row items-center gap-6'
        }
      >
        <div
          className={
            isLitepaper
              ? 'relative mx-auto aspect-square w-full max-w-[280px] shrink-0 lg:mx-0'
              : 'relative mx-auto aspect-square w-full max-w-[240px] shrink-0'
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                dataKey="value"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} formatter={(value) => [`${value}%`, 'Allocation']} />
            </PieChart>
          </ResponsiveContainer>
          <DonutCenter title="Max supply" subtitle={`${APTC_TOKENOMICS.symbol} · 1B`} />
        </div>

        <ul
          className={
            isLitepaper
              ? 'w-full min-w-0 space-y-3 self-center'
              : 'min-w-0 w-full flex-1 space-y-2.5'
          }
        >
          {APTC_ALLOCATION.map((row) => (
            <li
              key={row.label}
              className={`flex items-start gap-3 text-sm ${
                isLitepaper ? 'rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3' : ''
              }`}
            >
              <span
                className={`shrink-0 rounded-full ring-2 ring-white/10 mt-0.5 ${
                  isLitepaper ? 'h-3 w-3' : 'h-2.5 w-2.5'
                }`}
                style={{ backgroundColor: row.fill }}
              />
              <span className="flex-1 min-w-0 text-white/80">
                <span className="block font-medium">{row.label}</span>
                {row.tokensShort && (
                  <span className="text-[11px] text-white/40 font-mono">{row.tokensShort}</span>
                )}
                {row.detail && (
                  <span
                    className={`block mt-1 leading-relaxed text-white/45 ${
                      isLitepaper ? 'text-xs' : 'text-[10px] leading-snug'
                    }`}
                  >
                    {row.detail}
                  </span>
                )}
              </span>
              <span
                className={`font-mono tabular-nums text-white shrink-0 ${
                  isLitepaper ? 'text-lg font-semibold' : 'text-sm font-medium'
                }`}
              >
                {row.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <CreatorBuyUses variant={variant} />
    </div>
  );
}

/** Breakdown of how the 230M creator initial buy is deployed */
export function CreatorBuyUses({ variant = 'default' }) {
  const isLitepaper = variant === 'litepaper';

  return (
    <div
      className={`w-full rounded-xl border border-white/10 bg-[#120010] ${
        isLitepaper ? 'p-5 sm:p-6' : 'p-4 md:p-5'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-200/80">
            Creator buy · 230M deployment
          </p>
          <p className="mt-1 text-sm font-medium text-white/90">How the 23% is used</p>
        </div>
        <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-200/90">
          @aptcasinofun
        </span>
      </div>
      <p className="text-xs text-white/45 leading-relaxed mb-4 max-w-3xl">{CREATOR_BUY_PURPOSE}</p>
      <div className={`grid gap-3 ${isLitepaper ? 'sm:grid-cols-2 xl:grid-cols-5' : 'grid-cols-2 lg:grid-cols-5'}`}>
        {CREATOR_BUY_DEPLOYMENT.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.fill }}
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50 tabular-nums">
                {row.pct}%
              </span>
            </div>
            <p className="text-xs font-medium text-white/80 leading-snug">{row.label}</p>
            <p className="mt-1 font-mono text-[11px] text-white/40 tabular-nums">{row.tokensShort}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** GGR buyback split donut */
export function BuybackSplitDonut({ config }) {
  if (!config) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-white/40">
        Loading buyback config…
      </div>
    );
  }

  const data = [
    { name: 'Permanent burn', value: config.burnPctOfBuyback, fill: BUYBACK_SPLIT_COLORS.burn },
    { name: 'Staking pool', value: config.stakerPctOfBuyback, fill: BUYBACK_SPLIT_COLORS.stakers },
    { name: 'Treasury reserve', value: config.treasuryPctOfBuyback, fill: BUYBACK_SPLIT_COLORS.treasury },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-full max-w-[200px] aspect-square mx-auto shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={3}
              dataKey="value"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip {...CHART_TOOLTIP} formatter={(value) => [`${value}%`, 'of buyback']} />
          </PieChart>
        </ResponsiveContainer>
        <DonutCenter title="Buyback" subtitle={`${config.buybackPctOfGgr}% GGR`} />
      </div>

      <ul className="flex-1 w-full space-y-3 text-sm">
        <li className="flex items-start gap-2 pb-2 border-b border-white/10">
          <span
            className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
            style={{ backgroundColor: BUYBACK_SPLIT_COLORS.toMarket }}
          />
          <span className="text-white/80">
            <span className="text-emerald-400 font-semibold">{config.buybackPctOfGgr}%</span> of GGR → APTC
            market buyback
          </span>
        </li>
        {data.map((row) => (
          <li key={row.name} className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.fill }} />
            <span className="text-white/75 flex-1">{row.name}</span>
            <span className="font-mono font-semibold tabular-nums" style={{ color: row.fill }}>
              {formatPct(row.value)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Wager → GGR → buyback pipeline (indicative 30d) */
export function GgrRevenueFunnel({ estimates, buybackPctOfGgr = 30 }) {
  const wagered = estimates?.totalWageredUsd30d ?? 0;
  const ggr = estimates?.ggrUsd30d ?? 0;
  const buyback = estimates?.projectedBuybackUsd30d ?? 0;
  const hasVolume = wagered > 0;

  const stages = [
    {
      step: 1,
      label: 'Wager volume',
      hint: '30-day play across chains',
      value: wagered,
      accent: '#818cf8',
      glow: 'shadow-indigo-500/20',
      border: 'border-indigo-400/25',
      bg: 'from-indigo-950/80 to-violet-950/40',
    },
    {
      step: 2,
      label: 'Gross gaming revenue',
      hint: 'Estimated house edge on volume',
      value: ggr,
      accent: '#c084fc',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-400/25',
      bg: 'from-purple-950/80 to-fuchsia-950/40',
    },
    {
      step: 3,
      label: 'APTC buyback budget',
      hint: `${buybackPctOfGgr}% of GGR routed to market`,
      value: buyback,
      accent: '#34d399',
      glow: 'shadow-emerald-500/20',
      border: 'border-emerald-400/25',
      bg: 'from-emerald-950/80 to-teal-950/40',
    },
  ];

  const maxVal = Math.max(wagered, ggr, buyback, 1);

  return (
    <div className="w-full">
      <div className="hidden md:flex items-stretch gap-0">
        {stages.map((s, i) => (
          <div key={s.step} className="flex flex-1 items-center min-w-0">
            <FunnelStageCard stage={s} fillPct={(s.value / maxVal) * 100} hasVolume={hasVolume} />
            {i < stages.length - 1 && <FunnelConnector />}
          </div>
        ))}
      </div>

      <div className="md:hidden space-y-3">
        {stages.map((s, i) => (
          <div key={s.step}>
            <FunnelStageCard stage={s} fillPct={(s.value / maxVal) * 100} hasVolume={hasVolume} />
            {i < stages.length - 1 && (
              <div className="flex justify-center py-2 text-white/25" aria-hidden>
                ↓
              </div>
            )}
          </div>
        ))}
      </div>

      {!hasVolume && (
        <p className="text-xs text-white/40 text-center mt-5 max-w-md mx-auto">
          Live wager data will flow through this pipeline as players bet on-chain.
        </p>
      )}
    </div>
  );
}

function FunnelStageCard({ stage, fillPct, hasVolume }) {
  return (
    <div
      className={`relative flex-1 min-w-0 rounded-xl border bg-gradient-to-br ${stage.bg} ${stage.border} p-4 md:p-5 shadow-lg ${stage.glow} overflow-hidden`}
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5" aria-hidden>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(100, Math.max(hasVolume ? 8 : 0, fillPct))}%`,
            backgroundColor: stage.accent,
            opacity: hasVolume ? 0.85 : 0.25,
          }}
        />
      </div>
      <div className="relative">
        <span
          className="inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold mb-3"
          style={{ backgroundColor: `${stage.accent}33`, border: `1px solid ${stage.accent}55`, color: '#fff' }}
        >
          {stage.step}
        </span>
        <p className="text-sm font-medium text-white/90">{stage.label}</p>
        <p className="text-[11px] text-white/45 mt-0.5 mb-3">{stage.hint}</p>
        <p className="text-2xl md:text-3xl font-bold tabular-nums text-white">${fmtUsd(stage.value)}</p>
      </div>
    </div>
  );
}

function FunnelConnector() {
  return (
    <div className="shrink-0 w-8 lg:w-12 flex items-center justify-center text-white/25" aria-hidden>
      <svg className="w-full max-w-[48px] h-3" viewBox="0 0 48 12" fill="none">
        <path
          d="M0 6h40m0 0l-5-5m5 5l-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function fmtUsd(n) {
  if (!Number.isFinite(n)) return '0.00';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function formatPct(n) {
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
