import Image from 'next/image';
import { APPLIED_PROGRAMS } from '@/lib/litepaper/sections';

export default function LitepaperPrograms() {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Applied for</p>
        <h2 className="font-display mt-1 text-xl font-bold text-white sm:text-2xl">Accelerators & programs</h2>
        <p className="mt-1 max-w-xl text-sm text-white/55">
          APT-Casino has applied to the following incubators and residency programs.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {APPLIED_PROGRAMS.map((program) => (
          <a
            key={program.name}
            href={program.href}
            target="_blank"
            rel="noreferrer"
            className="group lp-glass flex flex-col rounded-2xl p-5 transition-all hover:border-white/25 hover:bg-white/[0.05]"
          >
            <div className="mb-4 flex min-h-[140px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-black/60 p-6">
              <Image
                src={program.logo}
                alt={program.name}
                width={280}
                height={160}
                className="max-h-[100px] w-full max-w-[220px] object-contain transition-transform duration-300 group-hover:scale-110 sm:max-h-[120px]"
              />
            </div>
            <p className="text-center text-xs font-black uppercase leading-snug tracking-wide text-white/90">
              {program.name}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
