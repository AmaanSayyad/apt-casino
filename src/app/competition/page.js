'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaTrophy, FaGamepad, FaChartLine, FaBolt, FaMedal } from 'react-icons/fa';
import PageShell, { PageCard, SectionHeading } from '@/components/layout/PageShell';
import CompetitionLeaderboardPanel from '@/components/CompetitionLeaderboardPanel';
const GAMES = [
  { href: '/game/plinko', name: 'Plinko', color: 'from-pink-500/20 to-rose-600/10 border-pink-400/30' },
  { href: '/game/mines', name: 'Mines', color: 'from-amber-500/20 to-orange-600/10 border-amber-400/30' },
  { href: '/game/roulette', name: 'Roulette', color: 'from-emerald-500/20 to-teal-600/10 border-emerald-400/30' },
  { href: '/game/wheel', name: 'Spin Wheel', color: 'from-violet-500/20 to-purple-600/10 border-violet-400/30' },
];

const STEPS = [
  {
    n: 1,
    icon: FaBolt,
    title: 'Register',
    desc: 'Connect Solana and pay the APTC entry fee to join the active Volume Cup.',
  },
  {
    n: 2,
    icon: FaGamepad,
    title: 'Play',
    desc: 'Wager on qualifying games — only volume after signup counts.',
  },
  {
    n: 3,
    icon: FaMedal,
    title: 'Win',
    desc: 'Top wallets by wagered volume share the APTC prize pool.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function CompetitionPage() {
  return (
    <PageShell
      badge="On-chain competition"
      title="Volume Cup"
      description="Seasonal wager-volume tournaments on Solana. Register with APTC, play qualifying games with the same wallet, and climb live standings for APTC prizes."
      maxWidth="6xl"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Volume Cup' }]}
    >
      <motion.section
        className="mb-10 grid gap-4 sm:grid-cols-3"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {STEPS.map((s) => (
          <motion.div
            key={s.n}
            variants={fadeUp}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5 transition-colors hover:border-amber-500/25"
          >
            <motion.div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
            <div className="relative flex gap-4 items-start">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-400/25 to-orange-600/10 font-bold text-amber-100">
                <s.icon className="text-lg" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
                  Step {s.n}
                </p>
                <p className="mt-0.5 font-semibold text-white">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{s.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.section>

      <PageCard
        gradient="from-amber-500/40 via-orange-500/30 to-yellow-500/30"
        className="mb-10"
      >
        <SectionHeading
          icon={<FaTrophy className="text-amber-300" />}
          title="Live standings"
          subtitle="Real-time volume leaderboard — refresh or wait for auto-updates every minute."
        />
        <CompetitionLeaderboardPanel />
      </PageCard>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4 }}
      >
        <SectionHeading
          icon={<FaGamepad className="text-purple-300" />}
          title="Qualifying games"
          subtitle="When an event lists specific games, only those bets count toward cup volume."
        />
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {GAMES.map((g, i) => (
            <motion.div
              key={g.href}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={g.href}
                className={`group flex flex-col items-center rounded-xl border bg-gradient-to-br ${g.color} p-5 text-center transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-900/15`}
              >
                <FaGamepad className="mb-2 text-2xl text-white/35 transition-colors group-hover:text-white/75" />
                <span className="text-sm font-semibold text-white">{g.name}</span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-white/35 group-hover:text-amber-200/70">
                  Play now
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm text-purple-300 transition-colors hover:text-white"
        >
          <FaChartLine /> View all-time PnL leaderboard
        </Link>
      </motion.section>
    </PageShell>
  );
}
