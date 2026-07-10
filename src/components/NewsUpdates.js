'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { litepaperPath } from '@/lib/siteMetadata';
import dynamic from 'next/dynamic';
import { ROADMAP_DIAGRAM_CARDS } from '@/lib/config/roadmapDiagrams';

const MermaidDiagram = dynamic(() => import('@/components/ui/MermaidDiagram'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] items-center justify-center rounded-xl border border-white/10 bg-black/30 text-xs text-white/40 sm:h-[380px]">
      Rendering diagram…
    </div>
  ),
});

const STATUS_STYLES = {
  in_progress: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
  planned: 'bg-white/5 text-white/60 border-white/15',
  shipped: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
};

const CATEGORY_DOT = {
  Platform: 'bg-purple-400',
  Governance: 'bg-emerald-400',
  Partnership: 'bg-sky-400',
  Security: 'bg-rose-400',
  Community: 'bg-fuchsia-400',
  Tournaments: 'bg-amber-400',
};

function RoadmapDiagramPanel({ card, className = '' }) {
  return (
    <div className={`roadmap-glass flex h-full flex-col rounded-2xl p-5 sm:p-6 ${className}`}>
      <h3 className="text-sm font-bold text-white">{card.title}</h3>
      <p className="mt-1 text-xs text-white/45">{card.caption}</p>
      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2 sm:p-3">
        <MermaidDiagram chart={card.chart} theme="dark" compact layout="default" />
      </div>
    </div>
  );
}

function MilestoneRow({ item }) {
  const statusClass = STATUS_STYLES[item.status] || STATUS_STYLES.planned;
  const dot = CATEGORY_DOT[item.category] || 'bg-white/40';
  const isExternal = item.link && /^https?:\/\//i.test(item.link);

  const inner = (
    <div className="group flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/15 hover:bg-white/[0.04]">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded border ${statusClass}`}>
            {item.statusLabel}
          </span>
          <span className="text-[10px] text-white/35">{item.category}</span>
        </div>
        <p className="text-sm font-medium text-white leading-snug group-hover:text-white">{item.title}</p>
        {item.excerpt ? (
          <p className="mt-1 text-xs text-white/45 line-clamp-2 leading-relaxed">{item.excerpt}</p>
        ) : null}
      </div>
      {item.link ? (
        <span className="shrink-0 self-center text-red-magic/80 group-hover:text-blue-magic text-xs" aria-hidden>
          →
        </span>
      ) : null}
    </div>
  );

  if (item.link) {
    return (
      <Link
        href={item.link}
        className="block"
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}

export default function NewsUpdates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/roadmap');
        const d = await r.json();
        setItems(d.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ['All', ...[...set].sort()];
  }, [items]);

  const filtered = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  const phasesCard = ROADMAP_DIAGRAM_CARDS.find((c) => c.id === 'phases');
  const sequenceCard = ROADMAP_DIAGRAM_CARDS.find((c) => c.id === 'sequence');

  return (
    <section id="roadmap" className="roadmap-section py-16 md:py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
          <div className="flex items-center">
            <div className="w-1 h-6 bg-gradient-to-r from-red-magic to-blue-magic rounded-full mr-3" />
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Roadmap</h2>
          </div>
          <Link
            href={litepaperPath('roadmap')}
            className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors"
          >
            Full litepaper →
          </Link>
        </div>
        <p className="text-white/55 text-sm max-w-2xl mb-10">
          Pan, zoom, and drag each chart — milestone list below is synced from the public roadmap.
        </p>

        {loading ? (
          <p className="text-white/50">Loading roadmap…</p>
        ) : items.length === 0 ? (
          <div className="roadmap-glass rounded-2xl p-8 max-w-2xl">
            <p className="text-white font-medium mb-1">Roadmap loading soon.</p>
            <p className="text-white/50 text-sm">Run npm run seed:roadmap or check /api/roadmap.</p>
          </div>
        ) : (
          <>
            <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              {phasesCard ? (
                <RoadmapDiagramPanel card={phasesCard} className="h-full" />
              ) : null}
              {sequenceCard ? (
                <RoadmapDiagramPanel card={sequenceCard} className="h-full" />
              ) : null}
            </div>

            {/* Milestone index */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300/80">
                  Milestone index
                </p>
                {categories.length > 2 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          activeCategory === category
                            ? 'bg-gradient-to-r from-red-magic to-blue-magic text-white'
                            : 'roadmap-glass text-white/60 hover:text-white'
                        }`}
                        onClick={() => setActiveCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="roadmap-glass rounded-2xl p-4 sm:p-5 max-h-[520px] overflow-y-auto custom-scrollbar space-y-2">
                {filtered.map((item) => (
                  <MilestoneRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
