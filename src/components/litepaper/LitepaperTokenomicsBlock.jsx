'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  APTC_TOKENOMICS,
  APTC_UTILITY,
  APTC_WALLETS,
  getAllocationSummary,
  solscanAccountUrl,
  truncateAddress,
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
const TraderTransparencyPanel = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.TraderTransparencyPanel),
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300/70">$APTC</p>
        <h2 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
          <span className="bg-gradient-to-r from-red-magic to-blue-magic bg-clip-text text-transparent">
            Tokenomics
          </span>{' '}
          at a glance
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/55">
          {APTC_TOKENOMICS.maxSupply} max supply · rewards, staking & value accrual
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-white/45">{getAllocationSummary()}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lp-glass rounded-2xl p-5 sm:p-6">
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-white/45">
            Full supply allocation
          </p>
          <p className="mb-4 text-xs text-white/40">
            Liquidity · community · staking · protocol growth
          </p>
          <AllocationDonut variant="litepaper" />
        </div>
        <div className="lp-glass rounded-2xl p-5 sm:p-6">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/45">
            GGR → buyback pipeline
          </p>
          <GgrRevenueFunnel estimates={est} buybackPctOfGgr={cfg?.buybackPctOfGgr ?? 30} />
        </div>
      </div>

      <div className="mt-5">
        <TraderTransparencyPanel variant="litepaper" />
      </div>

      <div className="mt-5 lp-glass rounded-2xl p-5 sm:p-6 overflow-x-auto">
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/45">
          Wallet transparency
        </p>
        {APTC_WALLETS.some((w) => w.address) ? (
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-white/35 border-b border-white/10">
                <th className="pb-2 pr-3">Wallet</th>
                <th className="pb-2 pr-3">Amount</th>
                <th className="pb-2 pr-3">Address</th>
              </tr>
            </thead>
            <tbody>
              {APTC_WALLETS.filter((w) => w.address).map((w) => (
                <tr key={w.id} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white/85 font-medium">{w.label}</td>
                  <td className="py-2 pr-3 font-mono text-cyan-200/80">{w.amountShort}</td>
                  <td className="py-2">
                    <a
                      href={solscanAccountUrl(w.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-fuchsia-300/70 hover:text-fuchsia-200"
                    >
                      {truncateAddress(w.address, 5)} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs leading-6 text-white/55">
            Operations wallet addresses will be published with the public token release.
          </p>
        )}
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
