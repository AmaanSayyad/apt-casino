'use client';

import { FaBookOpen, FaCheckCircle, FaDice, FaShieldAlt, FaPercentage } from 'react-icons/fa';
import { gameData } from '../config/gameDetail';

const HIGHLIGHTS = [
  {
    icon: FaPercentage,
    title: '2.7% house edge',
    body: 'Single zero (0–36) — better odds than American double-zero wheels.',
    accent: 'text-amber-300',
    border: 'border-amber-500/25',
    bg: 'from-amber-900/20 to-amber-950/10',
  },
  {
    icon: FaShieldAlt,
    title: 'Provably fair',
    body: 'Verifiable on-chain randomness on Solana and Aptos — every spin is transparent.',
    accent: 'text-emerald-300',
    border: 'border-emerald-500/25',
    bg: 'from-emerald-900/20 to-emerald-950/10',
  },
  {
    icon: FaDice,
    title: 'Up to 35:1',
    body: 'Straight-up numbers, splits, streets, dozens, red/black — mix inside and outside bets.',
    accent: 'text-rose-300',
    border: 'border-rose-500/25',
    bg: 'from-rose-900/20 to-rose-950/10',
  },
];

const CHIPS = ['37 pockets', '2.7% edge', '35:1 max', 'Solana · Aptos'];

export default function RouletteGameIntro() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-purple-600/35 bg-gradient-to-br from-purple-900/15 to-rose-900/10 transition-all duration-300 hover:border-rose-500/45">
        <iframe
          src={`https://www.youtube.com/embed/${gameData.youtube}?si=${gameData.youtube}`}
          title={`${gameData.title} Tutorial`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div className="relative flex flex-col rounded-2xl border border-purple-700/30 bg-gradient-to-br from-[#1A0015]/95 to-[#0d0008]/90 p-5 sm:p-6 lg:p-7 text-gray-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-400" />

        <div className="flex items-start gap-4 mb-6 pt-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-500/35 bg-gradient-to-br from-rose-500/25 to-purple-600/15 shadow-lg shadow-rose-900/20">
            <FaBookOpen className="text-rose-300" size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent">
              {gameData.title}
            </h3>
            <p className="text-sm text-white/55 mt-1">Classic wheel · provably fair · multichain</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex gap-4 rounded-xl border ${item.border} bg-gradient-to-r ${item.bg} p-4 sm:p-4.5 transition-colors hover:border-white/20`}
              >
                <Icon className={`${item.accent} mt-1 shrink-0`} size={18} />
                <div className="min-w-0">
                  <p className={`text-base font-semibold ${item.accent}`}>{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {CHIPS.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80"
            >
              <FaCheckCircle className="text-emerald-400/90" size={12} />
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
