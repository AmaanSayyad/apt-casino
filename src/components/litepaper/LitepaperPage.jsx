'use client';

import '@/styles/litepaper.css';
import LitepaperHero from './LitepaperHero';
import LitepaperStory from './LitepaperStory';
import LitepaperMedia from './LitepaperMedia';
import LitepaperDiagramGallery from './LitepaperDiagramGallery';
import LitepaperPrograms from './LitepaperPrograms';
import LitepaperContent from './LitepaperContent';

export default function LitepaperPage() {
  return (
    <main className="litepaper-root site-page-top min-h-screen pb-20">
      <div className="w-full px-5 pb-12 sm:px-8 md:px-12 lg:px-16 xl:px-20 lg:pb-16">
        <LitepaperHero />

        <LitepaperStory />
        <LitepaperMedia />
        <LitepaperDiagramGallery />
        <LitepaperPrograms />
        <LitepaperContent />
      </div>
    </main>
  );
}
