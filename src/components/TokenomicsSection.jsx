'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  APTC_LAUNCH_PHASES,
  APTC_PROTOCOL_HOLDING,
  APTC_TOKENOMICS,
  APTC_UTILITY,
  GGR_FLYWHEEL_STEPS,
  getProtocolAllocationSummary,
} from '@/lib/config/tokenomics';

const AllocationDonut = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.AllocationDonut),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> }
);
const BuybackSplitDonut = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.BuybackSplitDonut),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> }
);
const GgrRevenueFunnel = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.GgrRevenueFunnel),
  { ssr: false, loading: () => <ChartSkeleton height={200} /> }
);

export default function TokenomicsSection() {
  const [buyback, setBuyback] = useState(null);

  useEffect(() => {
    fetch('/api/ggr/buyback')
      .then((r) => r.json())
      .then(setBuyback)
      .catch(() => {});
  }, []);

  const cfg = buyback?.config;
  const est = buyback?.estimates;

  return (
    <section id="tokenomics" className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-[#070005]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300/80 mb-2">Protocol token</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
              APTC
            </span>{' '}
            Tokenomics
          </h2>
          <p className="text-white/55 max-w-2xl mx-auto mt-3 text-sm md:text-base">
            APT Casino Token ties player activity to a deflationary flywheel. Public launch on{' '}
            <span className="text-white/80">{APTC_TOKENOMICS.launchVenue}</span>; the protocol accumulates{' '}
            {APTC_PROTOCOL_HOLDING.pctOfMaxSupply}% of supply ({APTC_PROTOCOL_HOLDING.tokensShort} APTC) for
            community, liquidity, treasury, staking, and partnerships.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <Stat label="Ticker" value={APTC_TOKENOMICS.symbol} />
          <Stat label="Chain" value={APTC_TOKENOMICS.chain} />
          <Stat label="Max supply" value={APTC_TOKENOMICS.maxSupply} />
          <Stat
            label="Protocol holding"
            value={`${APTC_PROTOCOL_HOLDING.pctOfMaxSupply}%`}
            sub={`${APTC_PROTOCOL_HOLDING.tokensShort} APTC target`}
          />
          <Stat label="Launch" value={APTC_TOKENOMICS.launchVenue} sub="Public TGE" />
          <Stat
            label="Est. GGR (30d)"
            value={est?.ggrUsd30d != null ? `$${fmtUsd(est.ggrUsd30d)}` : '—'}
            sub={est?.totalWageredUsd30d != null ? `from $${fmtUsd(est.totalWageredUsd30d)} wagered` : undefined}
          />
        </div>

        <div className="mb-12 p-[1px] bg-gradient-to-r from-fuchsia-500/30 via-purple-500/20 to-blue-magic/30 rounded-2xl">
          <div className="bg-[#120010] rounded-2xl p-6 md:p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Launch & accumulation</h3>
            <p className="text-sm text-white/55 mb-6 max-w-3xl">{APTC_TOKENOMICS.launch}</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {APTC_LAUNCH_PHASES.map((p) => (
                <div
                  key={p.step}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-magic/40 to-blue-magic/40 flex items-center justify-center text-white text-sm font-bold mb-3">
                    {p.step}
                  </div>
                  <p className="font-medium text-white text-sm mb-2">{p.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="p-[1px] bg-gradient-to-r from-red-magic/50 to-blue-magic/50 rounded-2xl">
            <div className="bg-[#120010] rounded-2xl p-6 md:p-8 h-full">
              <h3 className="text-xl font-semibold text-white mb-2">Protocol allocation (10%)</h3>
              <p className="text-xs text-white/45 mb-6">{getProtocolAllocationSummary()}</p>
              <AllocationDonut />
              <p className="text-xs text-white/40 mt-6 border-t border-white/10 pt-4">
                Slices total 100% of the {APTC_PROTOCOL_HOLDING.tokensShort} APTC protocol bucket — not % of
                the full 1B supply. Initial {APTC_PROTOCOL_HOLDING.launchBuyPct}% buy at Bags launch, then
                Meteora / open-market buys until {APTC_PROTOCOL_HOLDING.pctOfMaxSupply}% is held.
              </p>
            </div>
          </div>

          <div className="p-[1px] bg-gradient-to-r from-emerald-500/40 to-teal-500/40 rounded-2xl">
            <div className="bg-[#120010] rounded-2xl p-6 md:p-8 h-full">
              <h3 className="text-xl font-semibold text-white mb-2">GGR → buyback engine</h3>
              <p className="text-sm text-white/55 mb-6">
                Gross gaming revenue (GGR) is estimated from play volume × house edge. Industry peers route
                15–30% of GGR to token buybacks; APT-Casino publishes live config below.
              </p>
              <BuybackSplitDonut config={cfg} />
              {est?.projectedBuybackUsd30d != null && (
                <p className="text-xs text-white/50 border-t border-white/10 pt-4 mt-6">
                  Indicative 30d buyback budget:{' '}
                  <span className="text-emerald-300 font-mono">${fmtUsd(est.projectedBuybackUsd30d)}</span>
                  {est.projectedBurnAptc30d != null && est.aptcPriceUsd ? (
                    <>
                      {' '}
                      · est. burn{' '}
                      <span className="text-rose-300 font-mono">
                        {fmtNum(est.projectedBurnAptc30d)} APTC
                      </span>
                    </>
                  ) : null}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">Revenue flywheel</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GGR_FLYWHEEL_STEPS.map((s) => (
              <div
                key={s.step}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-red-magic/30 to-blue-magic/30 flex items-center justify-center text-white font-bold mb-3">
                  {s.step}
                </div>
                <p className="font-medium text-white text-sm">{s.title}</p>
                <p className="text-xs text-white/50 mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {APTC_UTILITY.map((u) => (
            <div key={u.title} className="rounded-xl border border-white/10 bg-[#1A0015] p-5">
              <h4 className="text-white font-semibold mb-2">{u.title}</h4>
              <p className="text-sm text-white/55">{u.body}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/35 mt-10 max-w-3xl mx-auto">
          Not financial advice. GGR and buyback figures are protocol estimates from wager volume and published
          house-edge parameters; on-chain buyback executions are logged when treasury ops run.
        </p>
      </div>
    </section>
  );
}

function ChartSkeleton({ height }) {
  return (
    <div
      className="w-full rounded-xl bg-white/[0.03] animate-pulse"
      style={{ height }}
      aria-hidden
    />
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A0015] p-4 text-center">
      <p className="text-[10px] uppercase tracking-widest text-white/45 mb-1">{label}</p>
      <p className="text-lg font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

function fmtUsd(n) {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function fmtNum(n) {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
