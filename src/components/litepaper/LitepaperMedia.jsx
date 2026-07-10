import Image from 'next/image';
import { PITCH_DECK_EMBED, PITCH_DECK_URL } from '@/lib/pitchDeck';
import { ADVISORY_BOARD, ADVISOR_ACCENT_STYLES } from '@/lib/config/socialProofSlides';

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
          className="hidden shrink-0 text-xs font-semibold text-red-magic underline sm:inline"
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
            <a href={PITCH_DECK_URL} target="_blank" rel="noreferrer" className="text-xs text-red-magic underline">
              Open in Figma →
            </a>
          </div>
        </div>
        <div className="lp-glass flex flex-col rounded-2xl lg:col-span-2">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Advisory</p>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-2 p-3">
            {ADVISORY_BOARD.map((advisor) => {
              const accent = ADVISOR_ACCENT_STYLES[advisor.accent] ?? ADVISOR_ACCENT_STYLES.cyan;
              const inner = (
                <>
                  <Image
                    src={advisor.src}
                    alt={advisor.alt}
                    fill
                    className={`object-contain p-1 ${advisor.blurred ? 'advisory-card-img--blur scale-105' : ''}`}
                    sizes="280px"
                  />
                  {advisor.blurred && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-[10px] font-bold uppercase tracking-widest text-white/60">
                      Confirmed
                    </div>
                  )}
                </>
              );

              const className = `relative min-h-[100px] overflow-hidden rounded-xl border bg-[#0a0008] ${accent.border} ${
                advisor.xUrl ? 'cursor-pointer transition-colors hover:border-white/25' : ''
              }`;

              return advisor.xUrl ? (
                <a
                  key={advisor.id}
                  href={advisor.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${advisor.name} on X`}
                  className={className}
                >
                  {inner}
                </a>
              ) : (
                <div key={advisor.id} className={className}>
                  {inner}
                </div>
              );
            })}
          </div>
          <p className="px-4 py-3 text-xs leading-6 text-white/50">
            Aptos, Movement & BNB Chain advisors backing $APTC rollout.
          </p>
        </div>
      </div>
    </section>
  );
}
