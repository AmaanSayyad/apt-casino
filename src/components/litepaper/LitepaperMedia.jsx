import Image from 'next/image';
import { PITCH_DECK_EMBED, PITCH_DECK_URL } from '@/lib/pitchDeck';

export default function LitepaperMedia() {
  return (
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Media</p>
          <h2 className="font-display mt-1 text-xl font-bold text-white sm:text-2xl">Deck & advisory</h2>
        </div>
        <a
          href={PITCH_DECK_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden shrink-0 text-xs font-semibold text-blue-magic underline sm:inline"
        >
          Open in Figma →
        </a>
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lp-glass overflow-hidden rounded-2xl lg:col-span-3">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Pitch deck</p>
          </div>
          <iframe
            src={PITCH_DECK_EMBED}
            title="APT-Casino pitch deck"
            className="aspect-video w-full min-h-[320px] bg-black lg:min-h-[400px]"
            allowFullScreen
          />
          <div className="border-t border-white/10 px-4 py-3 sm:hidden">
            <a href={PITCH_DECK_URL} target="_blank" rel="noreferrer" className="text-xs text-blue-magic underline">
              Open in Figma →
            </a>
          </div>
        </div>
        <div className="lp-glass flex flex-col rounded-2xl lg:col-span-2">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Advisory</p>
          </div>
          <div className="relative flex-1 min-h-[200px] overflow-hidden">
            <Image
              src="/Lucas Advisor.JPG"
              alt="Advisory board"
              fill
              className="lp-advisor-blur object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <span className="absolute bottom-3 right-3 rounded-full border border-emerald-400/40 bg-emerald-500/25 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-100 backdrop-blur-sm">
              Confirmed
            </span>
          </div>
          <p className="px-4 py-3 text-xs leading-6 text-white/50">
            Ecosystem advisors and partners — see homepage for full logo grid.
          </p>
        </div>
      </div>
    </section>
  );
}
