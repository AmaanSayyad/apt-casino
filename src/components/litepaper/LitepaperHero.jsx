import Link from 'next/link';
import {
  getLitepaperSocialLinks,
  LITEPAPER_UPDATED,
  LITEPAPER_VERSION,
  PITCH_DECK_URL,
  PROJECT_GITHUB,
} from '@/lib/litepaper/sections';

const QUICK_LINKS = [
  { label: 'Play', href: '/game', primary: true },
  { label: 'Stake', href: '/stake' },
  { label: 'Pitch deck', href: PITCH_DECK_URL, external: true },
  { label: 'GitHub', href: PROJECT_GITHUB, external: true },
];

const HIGHLIGHTS = [
  {
    label: 'Live chains',
    value: 'Solana · Aptos',
    accent: 'from-cyan-500/80 to-cyan-500/0',
  },
  {
    label: 'Core games',
    value: ['Plinko · Mines', 'Roulette · Wheel'],
    accent: 'from-fuchsia-500/80 to-fuchsia-500/0',
  },
  {
    label: 'Platform fee',
    value: '10% deposit / withdraw',
    accent: 'from-amber-500/80 to-amber-500/0',
  },
  {
    label: 'GGR → APTC',
    value: '30% buyback · 50% burn',
    accent: 'from-rose-500/80 to-rose-500/0',
  },
];

function StatCard({ label, value, accent }) {
  const valueContent = Array.isArray(value) ? (
    <div className="mt-2 space-y-0.5">
      {value.map((line) => (
        <p key={line} className="text-[13px] font-semibold leading-tight text-white/90">
          {line}
        </p>
      ))}
    </div>
  ) : (
    <p className="mt-2 text-[13px] font-semibold leading-snug text-white/90">{value}</p>
  );

  return (
    <div className="group relative flex min-h-[88px] flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.07]">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`}
        aria-hidden
      />
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">{label}</p>
      {valueContent}
    </div>
  );
}

export default function LitepaperHero() {
  const socialLinks = getLitepaperSocialLinks();

  return (
    <header className="lp-animate-in mb-12 lg:mb-14">
      <div className="lp-gradient-border lp-hero-shell overflow-hidden rounded-2xl">
        <div className="lp-gradient-inner lp-hero-inner relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-11">
          <div className="relative z-[1] flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-0">
            {/* Left — title & actions */}
            <div className="flex min-w-0 flex-1 flex-col justify-center lg:pr-10 xl:pr-12">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40">
                Official technical document
              </p>
              <h1 className="font-display mt-2.5 text-[2.15rem] font-black uppercase leading-[1.05] tracking-tight sm:text-4xl lg:text-[2.85rem] xl:text-[3.15rem]">
                <span className="bg-gradient-to-r from-red-magic via-fuchsia-400 to-blue-magic bg-clip-text text-transparent">
                  APT-Casino
                </span>{' '}
                <span className="text-white">Litepaper</span>
              </h1>
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/60 sm:text-base lg:max-w-none">
                Multichain GambleFi with provably fair games, gasless play, and $APTC.
          
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {QUICK_LINKS.map(({ label, href, primary, external }) => {
                  const cls = primary
                    ? 'inline-flex items-center rounded-full bg-gradient-to-r from-red-magic to-blue-magic px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-magic/25 transition hover:brightness-110'
                    : 'inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white';
                  if (external) {
                    return (
                      <a key={label} href={href} target="_blank" rel="noreferrer" className={cls}>
                        {label}
                      </a>
                    );
                  }
                  return (
                    <Link key={label} href={href} className={cls}>
                      {label}
                    </Link>
                  );
                })}
              </div>
              {socialLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2" aria-label="Community links">
                  {socialLinks.map(({ label, href }) => {
                    const cls =
                      'inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white';
                    return (
                      <a key={label} href={href} target="_blank" rel="noreferrer" className={cls}>
                        {label}
                      </a>
                    );
                  })}
                </div>
              )}
              <p className="mt-5 text-[11px] text-white/35">
                <span className="font-mono text-white/50">{LITEPAPER_VERSION}</span>
                <span className="mx-2 opacity-50">·</span>
                Updated <span className="font-mono text-white/50">{LITEPAPER_UPDATED}</span>
              </p>
            </div>

            {/* Divider */}
            <div
              className="hidden w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-white/15 to-transparent lg:block"
              aria-hidden
            />

            {/* Right — at a glance */}
            <div className="flex w-full shrink-0 flex-col justify-center lg:w-[min(100%,420px)] lg:pl-10 xl:pl-12">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-fuchsia-300/50">
                At a glance
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {HIGHLIGHTS.map((item) => (
                  <StatCard key={item.label} {...item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
