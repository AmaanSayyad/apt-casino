'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ACTIVE_GAMES_COUNT } from '@/lib/gameRegistry';
import { FaGamepad, FaShieldAlt } from 'react-icons/fa';
import { getPlayChainsForUi } from '@/lib/chains/registry';
import { CHAIN_UI } from '@/lib/chains/chainUi';

const TRUST = ['Provably fair', 'Multichain play', 'APTC rewards'];

function StatTile({ icon, label, value, sub, accent }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center transition-colors hover:border-white/20 hover:bg-white/[0.06]">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`}
        aria-hidden
      />
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-lg">
        {icon}
      </div>
      <p className="font-display text-2xl font-bold tabular-nums text-white md:text-3xl">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">{label}</p>
      {sub ? <p className="mt-1 text-[11px] text-white/40">{sub}</p> : null}
    </div>
  );
}

export default function LetsPlaySection() {
  const liveChains = getPlayChainsForUi();

  return (
    <section
      id="letsplay"
      className="relative overflow-hidden px-4 py-20 sm:px-8 md:py-28 lg:px-16"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-950/20 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-magic/10 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-1/4 h-64 w-64 rounded-full bg-blue-magic/10 blur-[80px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-red-magic/60 via-fuchsia-500/40 to-blue-magic/60 shadow-[0_24px_80px_-24px_rgba(192,38,211,0.45)]">
          <div className="overflow-hidden rounded-2xl bg-[#0a0008]/95 px-6 py-10 sm:px-10 sm:py-12">
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-300/60">
                Ready to play
              </p>
              <h2 className="font-display mt-3 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
                <span className="bg-gradient-to-r from-red-magic via-fuchsia-400 to-blue-magic bg-clip-text text-transparent">
                    APT-Casino
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55 sm:text-base">
                Connect on Solana or Aptos, pick a provably fair game, and play with transparent fees — no
                hidden limits, no black-box RNG.
              </p>

              {/* Chain pills */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {liveChains.map((chain) => (
                  <span
                    key={chain.id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-white/75"
                  >
                    <Image
                      src={CHAIN_UI[chain.id]?.logo ?? '/logos/solana-sol-logo.png'}
                      alt=""
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    {chain.label}
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                <StatTile
                  icon={<FaGamepad className="text-blue-magic" />}
                  label="Live games"
                  value={ACTIVE_GAMES_COUNT}
                  sub="Plinko · Mines · more"
                  accent="from-cyan-500/80 to-cyan-500/0"
                />
                <StatTile
                  icon={<FaShieldAlt className="text-emerald-400" />}
                  label="Chains live"
                  value={liveChains.length}
                  sub="Solana · Aptos"
                  accent="from-emerald-500/80 to-emerald-500/0"
                />
              </div>

              <div className="mt-10 flex justify-center">
                <Link
                  href="/game"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-fuchsia-900/40 transition hover:brightness-110"
                >
                  Launch game
                </Link>
              </div>

              {/* Trust row */}
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {TRUST.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/45"
                  >
                    <span className="h-1 w-1 rounded-full bg-emerald-400" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
