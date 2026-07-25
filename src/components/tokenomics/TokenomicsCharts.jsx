'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  APTC_ALLOCATION,
  APTC_TOKENOMICS,
  APTC_TRANSPARENCY,
  APTC_TRADER_GREEN_FLAGS,
  APTC_RED_FLAGS_WE_AVOID,
  BUYBACK_SPLIT_COLORS,
  CREATOR_BUY_DEPLOYMENT,
} from '@/lib/config/tokenomics';
import { APTC_LISTING_TIERS } from '@/lib/config/listingTiers';

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

/** Breakdown of how the creator ops wallet deploys initial buy + fee share */
export function CreatorBuyUses({ variant = 'default' }) {
  const isLitepaper = variant === 'litepaper';
  const featured = CREATOR_BUY_DEPLOYMENT.find((row) => row.highlight) ?? CREATOR_BUY_DEPLOYMENT[0];
  const rest = CREATOR_BUY_DEPLOYMENT.filter((row) => !row.highlight);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#120010] ${
        isLitepaper ? 'p-5 sm:p-6' : 'p-4 md:p-5'
      }`}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-fuchsia-600/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia-300/70">
              Creator ops wallet
            </p>
            <h4 className="mt-1 text-base sm:text-lg font-semibold text-white">
              Listings-first deployment
            </h4>
          </div>
          <a
            href="https://x.com/aptcasinofun"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-fuchsia-200/90 hover:bg-fuchsia-500/20 transition-colors"
          >
            @aptcasinofun
          </a>
        </div>

        {/* Stacked allocation bar */}
        <div className="mb-1 flex h-2.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
          {CREATOR_BUY_DEPLOYMENT.map((row) => (
            <div
              key={row.label}
              className="h-full transition-opacity hover:opacity-100 opacity-90"
              style={{ width: `${row.pct}%`, backgroundColor: row.fill }}
              title={`${row.label} · ${row.pct}%`}
            />
          ))}
        </div>
        <div className="mb-5 flex flex-wrap gap-x-3 gap-y-1">
          {CREATOR_BUY_DEPLOYMENT.map((row) => (
            <span key={row.label} className="inline-flex items-center gap-1.5 text-[10px] text-white/40">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: row.fill }} />
              {row.pct}%
            </span>
          ))}
        </div>

        {/* Featured listings block */}
        <div className="mb-4 rounded-xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-950/50 via-[#1a0018] to-violet-950/30 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <div>
              <p className="text-sm font-semibold text-white">{featured.label}</p>
              <p className="text-xs text-white/45 mt-0.5">Largest share of ops wallet deployment</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-fuchsia-200">{featured.pct}%</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {APTC_LISTING_TIERS.map((tier) => (
              <div
                key={tier.tier}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5"
              >
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300/80 w-28">
                  Tier {tier.tier}
                </span>
                <p className="flex-1 text-xs text-white/55 leading-snug">{tier.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Remaining buckets — clean rows */}
        <ul className="space-y-2">
          {rest.map((row) => (
            <li
              key={row.label}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/10"
                style={{ backgroundColor: row.fill }}
              />
              <span className="flex-1 min-w-0 text-sm text-white/80">{row.label}</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-white/90">{row.pct}%</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[11px] leading-relaxed text-white/40 border-t border-white/[0.06] pt-3">
          {APTC_TRANSPARENCY.opsWalletRule}
        </p>
      </div>
    </div>
  );
}

const INTEGRITY_GUARANTEES = [
  { label: 'No wash volume', sub: 'Organic casino GGR only' },
  { label: 'No fake FDV', sub: 'Market-priced LP' },
  { label: 'No dumps', sub: 'One public ops wallet' },
];

/** Sniper / bot / degen due-diligence — explicit green flags */
export function TraderTransparencyPanel({ variant = 'default' }) {
  const isLitepaper = variant === 'litepaper';
  const t = APTC_TRANSPARENCY;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#1A0015] ${
        isLitepaper ? 'p-6 sm:p-8' : 'p-5 md:p-6'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-emerald-500/8 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <div className="mb-6 max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
            Trader due diligence
          </p>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold text-white tracking-tight">{t.headline}</h3>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">{t.subhead}</p>
        </div>

        {/* Hero guarantees */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {INTEGRITY_GUARANTEES.map((g) => (
            <div
              key={g.label}
              className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-transparent px-4 py-3.5"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
                  ✓
                </span>
                <p className="text-sm font-semibold text-white">{g.label}</p>
              </div>
              <p className="text-[11px] text-white/45 pl-7">{g.sub}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-3xl">{t.pledge}</p>

        {/* Compact checklist */}
        <div className={`grid gap-x-10 ${isLitepaper ? 'sm:grid-cols-2' : 'lg:grid-cols-2'}`}>
          {APTC_TRADER_GREEN_FLAGS.map((row) => (
            <div
              key={row.term}
              className="flex gap-3 py-3.5 border-b border-white/[0.06] last:border-b-0"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-[10px] text-emerald-300">
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm font-medium text-white/90">{row.term}</p>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90">
                    {row.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/45 leading-snug">{row.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300/60 mb-2.5">
            We don&apos;t run these
          </p>
          <div className="flex flex-wrap gap-1.5">
            {APTC_RED_FLAGS_WE_AVOID.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-md border border-rose-500/15 bg-rose-950/30 px-2 py-1 text-[10px] text-rose-200/70"
              >
                <span className="text-rose-400/80" aria-hidden>
                  ×
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
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
