'use client';

import { useEffect, useMemo, useState } from 'react';
import { IPO_COPY, APTC_BANNER_SRC } from '@/lib/config/ipo';
import { IpoLogoIcon } from '@/components/IpoStackLogos';

const TONE_CLASS = {
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  white: 'border-white/20 bg-white/5 text-white/70',
};

function phaseBadgeFor(phase) {
  if (phase === 'live') return { text: 'Live · Round open', tone: 'emerald' };
  if (phase === 'upcoming') return { text: 'Opens soon', tone: 'amber' };
  if (phase === 'between_rounds') return { text: 'Between rounds', tone: 'amber' };
  return { text: 'Sale ended', tone: 'white' };
}

export default function IpoBanner({ className = '' }) {
  const [phase, setPhase] = useState('upcoming');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch('/api/ipo/stats', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (!cancelled && j.phase) setPhase(j.phase);
        }
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const phaseBadge = useMemo(() => phaseBadgeFor(phase), [phase]);
  const toneClass = TONE_CLASS[phaseBadge.tone];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={APTC_BANNER_SRC}
        alt="APTC IPO"
        className="w-full h-56 md:h-72 lg:h-80 object-cover object-[center_35%] opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070005] via-[#070005]/40 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <IpoLogoIcon logoId="metaplex" size={22} />
            <IpoLogoIcon logoId="metadao" size={22} />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
              Solana · Metaplex Genesis · MetaDAO
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">{IPO_COPY.headline}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${toneClass}`}>
          {phaseBadge.text}
        </span>
      </div>
    </div>
  );
}
