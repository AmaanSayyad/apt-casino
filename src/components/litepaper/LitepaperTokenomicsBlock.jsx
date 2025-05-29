'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  APTC_LAUNCH_PHASES,
  APTC_PROTOCOL_HOLDING,
  APTC_TOKENOMICS,
  APTC_UTILITY,
  getProtocolAllocationSummary,
} from '@/lib/config/tokenomics';
import LitepaperBuybackRails from './LitepaperBuybackRails';

const AllocationDonut = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.AllocationDonut),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);
const GgrRevenueFunnel = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.GgrRevenueFunnel),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

function ChartPlaceholder() {
  return <div className="h-[220px] animate-pulse rounded-xl bg-white/5" />;
}

export default function LitepaperTokenomicsBlock() {
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
    <section id="tokenomics-visual" className="mb-12 scroll-mt-24">
      <div className="mb-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300/70">APTC</p>
        <h2 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
          <span className="bg-gradient-to-r from-red-magic to-blue-magic bg-clip-text text-transparent">
            Tokenomics
          </span>{' '}
          at a glance
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/55">
          {APTC_TOKENOMICS.maxSupply} max supply · {APTC_TOKENOMICS.chain} · launch on{' '}
          {APTC_TOKENOMICS.launchVenue}
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-white/45">{getProtocolAllocationSummary()}</p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {APTC_LAUNCH_PHASES.map((p) => (
          <div key={p.step} className="lp-glass rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300/60">
              Step {p.step}
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{p.title}</p>
            <p className="mt-1.5 text-xs leading-6 text-white/55">{p.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lp-glass rounded-2xl p-5 sm:p-6">
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-white/45">
            Protocol allocation ({APTC_PROTOCOL_HOLDING.pctOfMaxSupply}%)
          </p>
          <p className="mb-4 text-xs text-white/40">100% of {APTC_PROTOCOL_HOLDING.tokensShort} APTC bucket</p>
          <AllocationDonut />
        </div>
        <div className="lp-glass rounded-2xl p-5 sm:p-6">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/45">
            GGR → buyback pipeline
          </p>
          <GgrRevenueFunnel
            estimates={est}
            buybackPctOfGgr={cfg?.buybackPctOfGgr ?? 30}
          />
        </div>
      </div>

      <div className="mt-5">
        <LitepaperBuybackRails />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {APTC_UTILITY.map((u) => (
          <div key={u.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-bold text-white/90">{u.title}</p>
            <p className="mt-1.5 text-xs leading-6 text-white/55">{u.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
