'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaRegGem, FaBomb, FaCoins, FaTimes, FaChevronDown } from 'react-icons/fa';
import { GiMineTruck } from 'react-icons/gi';

const STORAGE_KEY = 'mines-how-to-dismissed';

export function shouldShowMinesHowToHint() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== '1';
}

export function dismissMinesHowToHint() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, '1');
}

export default function MinesHowToModal({
  open,
  onClose,
  totalTiles,
  minesHouseEdgePct,
}) {
  const [showFormula, setShowFormula] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleDismissForever = () => {
    dismissMinesHowToHint();
    onClose();
  };

  const steps = [
    {
      icon: FaRegGem,
      iconClass: 'text-cyan-400',
      bg: 'from-cyan-500/15 to-blue-600/10 border-cyan-500/25',
      title: 'Reveal gems',
      body: 'Each safe tile raises your multiplier.',
    },
    {
      icon: FaBomb,
      iconClass: 'text-red-400',
      bg: 'from-red-500/15 to-orange-600/10 border-red-500/25',
      title: 'Avoid mines',
      body: 'Hit one mine and you lose the round bet.',
    },
    {
      icon: FaCoins,
      iconClass: 'text-amber-400',
      bg: 'from-amber-500/15 to-yellow-600/10 border-amber-500/25',
      title: 'Cash out',
      body: 'Lock in profit anytime before a mine.',
    },
  ];

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mines-how-to-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        aria-label="Close how to play"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="relative w-full max-w-md rounded-2xl border border-purple-500/30 bg-gradient-to-b from-[#1f0a1c]/95 to-[#0d0610]/98 shadow-2xl shadow-purple-900/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/30">
                <GiMineTruck className="text-xl text-red-400" />
              </div>
              <div className="min-w-0">
                <h3 id="mines-how-to-title" className="text-lg font-bold text-white leading-tight">
                  How to play
                </h3>
                <p className="text-sm text-white/55 mt-0.5">
                  5×5 grid · pick tiles · cash out when you want
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-2 mb-4">
            {steps.map(({ icon: Icon, iconClass, bg, title, body }) => (
              <div
                key={title}
                className={`rounded-xl border bg-gradient-to-br p-3 ${bg}`}
              >
                <Icon className={`text-lg mb-2 ${iconClass}`} />
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-white/60 mt-1 leading-snug">{body}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/50 text-center mb-4">
            More mines = higher risk and bigger multipliers on the ladder below.
          </p>

          <button
            type="button"
            onClick={() => setShowFormula((v) => !v)}
            className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
          >
            <span>Payout formula & house edge</span>
            <FaChevronDown
              className={`text-white/40 transition-transform ${showFormula ? 'rotate-180' : ''}`}
            />
          </button>

          {showFormula && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 overflow-hidden"
            >
              <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
                <code className="block font-mono text-purple-200/90 mb-2 break-all">
                  fairMultiplier = {totalTiles} / ({totalTiles} − mines − gemsRevealed)
                </code>
                <p className="text-white/60 leading-relaxed">
                  Banked multiplier uses that fair value ×{' '}
                  <span className="text-amber-300/90">(1 − {minesHouseEdgePct.toFixed(1)}%)</span>
                  {' '}— same ladder as the strip under the grid.
                </p>
              </div>
            </motion.div>
          )}

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/30"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={handleDismissForever}
              className="sm:flex-none px-4 py-2.5 rounded-xl border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/25 transition-colors"
            >
              Don&apos;t show again
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
