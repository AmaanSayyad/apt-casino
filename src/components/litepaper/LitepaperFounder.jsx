import Image from 'next/image';

const LINKS = [
  { label: 'GitHub', href: 'https://github.com/AmaanSayyad' },
  { label: 'Portfolio', href: 'https://amaan-sayyad-portfolio.vercel.app' },
  { label: 'LinkedIn', href: 'https://in.linkedin.com/in/amaan-sayyad-' },
  { label: 'X', href: 'https://x.com/amaanbiz' },
];

const BULLETS = [
  '5+ years in Web3; 15+ projects across DeFi, SocialFi, GameFi and GambleFi.',
  '70+ hackathons participated · 45+ wins.',
  '8 Web3 companies — development, advocacy, and growth.',
  'Built communities, reviewed 500+ projects, led grants-level execution.',
];

export default function LitepaperFounder() {
  return (
    <section className="mt-12">
      <div className="lp-gradient-border">
        <div className="lp-gradient-inner overflow-hidden rounded-2xl">
          <div className="grid lg:grid-cols-[minmax(200px,280px)_1fr]">
            <div className="relative aspect-[4/5] min-h-[280px] bg-black/60 lg:min-h-full">
              <Image
                src="/Amaan.jpg"
                alt="Amaan Sayyad"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 280px"
                priority={false}
              />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200/80">Founder</p>
              <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">Amaan Sayyad</h2>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
                An entrepreneur, growth hacker, serial builder, and someone who chose building over everything else.
              </p>
              <ul className="mt-4 space-y-2">
                {BULLETS.map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-white/65">
                    <span className="text-red-magic/80">·</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                {LINKS.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white/75 transition-colors hover:border-white/25 hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
