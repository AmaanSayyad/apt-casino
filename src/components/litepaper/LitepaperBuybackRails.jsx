'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { BUYBACK_SPLIT_COLORS } from '@/lib/config/tokenomics';
import MermaidDiagram from '@/components/ui/MermaidDiagram';

const FEE_FLOW_MERMAID = `flowchart LR
    DEP[Deposit 100%] --> FEE1[Platform fee 10%]
    DEP --> PLAY[House balance 90%]
    PLAY --> GGR[GGR from house edge]
    GGR --> BB[Buyback on Uniswap / Robinhood]
    BB --> B1[Burn 50%]
    BB --> B2[Stakers 35%]
    BB --> B3[Treasury 15%]`;

const CHART_TOOLTIP = {
  contentStyle: {
    background: 'rgba(18, 0, 16, 0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#fff',
  },
};

const DEFAULT_CONFIG = {
  buybackPctOfGgr: 30,
  burnPctOfBuyback: 50,
  stakerPctOfBuyback: 35,
  treasuryPctOfBuyback: 15,
};

export default function LitepaperBuybackRails() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    fetch('/api/ggr/buyback')
      .then((r) => r.json())
      .then((d) => d?.config && setConfig(d.config))
      .catch(() => {});
  }, []);

  const segments = [
    { name: 'Burn', value: config.burnPctOfBuyback, fill: BUYBACK_SPLIT_COLORS.burn },
    { name: 'Stakers', value: config.stakerPctOfBuyback, fill: BUYBACK_SPLIT_COLORS.stakers },
    { name: 'Treasury', value: config.treasuryPctOfBuyback, fill: BUYBACK_SPLIT_COLORS.treasury },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lp-glass rounded-2xl p-5 sm:p-6">
        <p className="mb-1 text-xs font-black uppercase tracking-widest text-white/45">
          Revenue distribution
        </p>
        <p className="mb-5 text-xs text-white/50">
          Of every buyback tranche — {config.buybackPctOfGgr}% of GGR routed to open-market APTC purchases
        </p>

        <div className="mb-6 flex h-14 overflow-hidden rounded-xl border border-white/10">
          {segments.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-center transition-all"
              style={{ width: `${s.value}%`, backgroundColor: s.fill }}
              title={`${s.name}: ${s.value}%`}
            >
              {s.value >= 18 && (
                <span className="text-[10px] font-black uppercase text-black/70">{s.value}%</span>
              )}
            </div>
          ))}
        </div>

        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segments} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={72}
                tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${v}%`, 'Share']} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {segments.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
          {segments.map((s) => (
            <li key={s.name} className="rounded-lg border border-white/10 bg-black/30 px-2 py-2">
              <p className="text-lg font-bold tabular-nums" style={{ color: s.fill }}>
                {s.value}%
              </p>
              <p className="text-[10px] uppercase tracking-wide text-white/50">{s.name}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="lp-glass rounded-2xl p-5 sm:p-6">
        <p className="mb-1 text-xs font-black uppercase tracking-widest text-white/45">Fee & buyback flow</p>
        <p className="mb-4 text-xs text-white/50">How platform fees and GGR connect to APTC sinks</p>
        <MermaidDiagram chart={FEE_FLOW_MERMAID} theme="dark" />
      </div>
    </div>
  );
}
