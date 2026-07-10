'use client';

import MermaidDiagram from '@/components/ui/MermaidDiagram';
import { FEATURED_DIAGRAMS } from '@/lib/litepaper/diagrams';

export default function LitepaperDiagramGallery() {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-magic/80">Visual reference</p>
        <h2 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">Protocol diagrams</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Interactive Mermaid charts — pan, zoom, and drag inside each panel.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {FEATURED_DIAGRAMS.map((d) => (
          <div key={d.id} className="lp-glass flex flex-col rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-bold text-white">{d.title}</h3>
            <p className="mt-1 text-xs text-white/45">{d.caption}</p>
            <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3">
              <MermaidDiagram chart={d.chart} theme="dark" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
