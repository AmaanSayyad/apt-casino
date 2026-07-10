'use client';

import MermaidDiagram from '@/components/ui/MermaidDiagram';
import { GROUPED_FLOW, SECTION_MAP } from '@/lib/litepaper/sections';
import LitepaperAllocationBlock from './LitepaperAllocationBlock';

function sectionNumber(title) {
  const m = title.match(/^(\d+[A-Z]?)/);
  return m ? m[1] : '';
}

function sectionLabel(title) {
  return title.replace(/^\d+[A-Z]?\.?\s*/, '');
}

function SectionVisual({ section }) {
  if (section.mermaid) {
    return (
      <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 sm:ml-11">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/35">Diagram</p>
        <MermaidDiagram chart={section.mermaid} theme="dark" />
      </div>
    );
  }

  return null;
}

export default function LitepaperContent() {
  return (
    <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <nav className="lp-glass sticky top-28 max-h-[calc(100vh-8.5rem)] overflow-y-auto rounded-2xl p-4 md:top-32">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Contents</p>
          {GROUPED_FLOW.map((group) => (
            <div key={group.title} className="mb-5 last:mb-0">
              <p className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.2em] text-red-magic/70">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.ids.map((id) => (
                  <li key={id}>
                    <a href={`#${id}`} className="lp-toc-link rounded-r-lg">
                      <span className="lp-num mr-2">{sectionNumber(SECTION_MAP[id].title)}</span>
                      {sectionLabel(SECTION_MAP[id].title)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-10">
        {GROUPED_FLOW.map((group) => (
          <section key={group.title}>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-red-magic/50 to-transparent" />
              <h2 className="shrink-0 text-[11px] font-black uppercase tracking-[0.2em] text-red-magic/80">
                {group.title}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-red-magic/50 to-transparent" />
            </div>

            <div className="space-y-4">
              {group.ids.map((id) => {
                const section = SECTION_MAP[id];

                if (section.chart === 'allocation-donut') {
                  return (
                    <LitepaperAllocationBlock
                      key={section.id}
                      section={section}
                      sectionLabel={sectionLabel}
                      sectionNumber={sectionNumber}
                    />
                  );
                }

                const num = sectionNumber(section.title);

                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className="lp-section-card lp-glass rounded-2xl p-5 sm:p-6"
                  >
                    <header className="mb-4 flex items-start gap-3">
                      {num && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-black text-white/50">
                          {num}
                        </span>
                      )}
                      <h3 className="pt-0.5 text-lg font-bold leading-snug text-white sm:text-xl">
                        {sectionLabel(section.title)}
                      </h3>
                    </header>
                    <div className="space-y-3 pl-0 sm:pl-11">
                      {section.body.map((paragraph, i) => (
                        <p key={i} className="text-sm leading-7 text-white/72">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <SectionVisual section={section} />
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
