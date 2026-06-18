'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  X,
  Shield,
  Link2,
  Unlock,
  Sparkles,
} from 'lucide-react';

const TRADITIONAL = [
  'Hidden RNG algorithms',
  'Restrictive withdrawal policies',
  'Unclear bonus terms',
  'Centralized control of funds',
];

const APT_CASINO = [
  'Verifiable on-chain randomness',
  'Stake and earn while playing',
  'Transparent bonus system',
  'Self-custody of assets',
];

const FEATURES = [
  {
    id: 1,
    title: '100% Transparent & Provably Fair',
    description:
      'Verifiable on-chain randomness on Solana and Aptos. Complete transparency in every outcome.',
    icon: Shield,
    accent: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    id: 2,
    title: 'Cross-Chain Liquidity',
    description:
      'Play across chains and earn APTC while you game, with deep liquidity and minimal slippage.',
    icon: Link2,
    accent: 'from-violet-500/20 to-fuchsia-500/10',
    iconColor: 'text-violet-400',
  },
  {
    id: 3,
    title: 'No Restrictions',
    description:
      'Flexible withdrawals, clear bonus terms, and full control over your assets at all times.',
    icon: Unlock,
    accent: 'from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-400',
  },
];

export default function FeatureSection() {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:px-8 lg:px-16">
      <div className="absolute -top-40 left-20 h-80 w-80 rounded-full bg-red-magic/5 blur-[120px] z-0" />
      <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-blue-magic/5 blur-[120px] z-0" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex items-center justify-center gap-3 sm:justify-start">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-red-magic to-blue-magic" />
          <div className="text-center sm:text-left">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Key Features of APT-Casino
            </h2>
            <p className="mt-1 text-sm text-white/50">Fair gaming, multichain play, and real ownership</p>
          </div>
        </div>

        {/* Hero comparison */}
        <div className="mb-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Image */}
          <div className="lg:col-span-5">
            <div className="relative h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/40 to-blue-950/60 sm:h-[340px] lg:h-full lg:min-h-[380px]">
              {!imageError ? (
                <>
                  <Image
                    src="/images/casino-players.png"
                    alt="Casino players at the table"
                    fill
                    className="object-cover"
                    priority
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120010] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-display uppercase tracking-wider text-white/50">AptCasino</p>
                    <p className="mt-0.5 text-sm font-medium text-white/90">Play on Solana & Aptos</p>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div>
                    <Sparkles className="mx-auto mb-3 h-8 w-8 text-fuchsia-400/80" />
                    <h3 className="text-lg font-medium text-white">APT Casino</h3>
                    <p className="mt-1 text-sm text-white/60">Decentralized gaming, done right</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparison */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
              <p className="text-[11px] font-display uppercase tracking-[0.14em] text-white/40">
                Traditional vs APT-Casino
              </p>
              <h3 className="mt-1 font-display text-xl font-medium text-white sm:text-2xl">
                A new era of fair gaming
              </h3>

              <div className="mt-6 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-red-500/15 bg-red-950/20 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-300/90">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
                      <X className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    Traditional casinos
                  </h4>
                  <ul className="space-y-2.5">
                    {TRADITIONAL.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-white/55">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/70" strokeWidth={2} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-emerald-500/15 bg-emerald-950/15 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-300/90">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    APT-Casino
                  </h4>
                  <ul className="space-y-2.5">
                    {APT_CASINO.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-white/70">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" strokeWidth={2} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  <Image src="/logos/solana-sol-logo.png" alt="" width={14} height={14} className="rounded-full" />
                  Solana
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300">
                  <Image src="/logos/aptos-logo.png" alt="" width={14} height={14} className="rounded-full" />
                  Aptos
                </span>
                <p className="min-w-[200px] flex-1 text-xs leading-relaxed text-white/50 sm:text-sm">
                  Provably fair play with DeFi earn passive income through APTC staking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-white/20 hover:bg-white/[0.05] sm:p-6"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} ring-1 ring-white/10`}
                >
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} strokeWidth={1.75} />
                </div>

                <h3 className="mb-2 text-base font-medium text-white sm:text-lg">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{feature.description}</p>

                <div className="mt-4 h-0.5 w-8 rounded-full bg-white/15 transition-all group-hover:w-12 group-hover:bg-gradient-to-r group-hover:from-red-magic group-hover:to-blue-magic" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
