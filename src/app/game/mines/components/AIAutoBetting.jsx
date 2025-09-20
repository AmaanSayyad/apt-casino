'use client';

import React, { useState } from 'react';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';
import { FaRobot, FaCog, FaBrain, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AIAutoBetting = ({
  onActivate,
  isActive,
  onSettings,
  strategy = 'balanced',
  onStrategyChange,
  autoSession = null,
}) => {
  const { symbol } = usePlayCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const handleModeChange = (mode) => {
    onStrategyChange?.(mode);
  };

  const getStrategyDescription = () => {
    switch (strategy) {
      case 'aggressive':
        return 'More tiles and mines per round — higher variance';
      case 'conservative':
        return 'Fewer tiles and mines — lower risk per round';
      default:
        return 'Moderate mines/tiles picked randomly each round';
    }
  };

  const roundsPlayed = autoSession?.roundsPlayed ?? 0;
  const totalRounds = autoSession?.totalRounds ?? 0;
  const sessionPnL = autoSession?.sessionPnL ?? 0;
  const currentBet = autoSession?.currentBet ?? null;

  return (
    <motion.div
      className="fixed z-20 bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] md:bottom-6 md:right-6 md:left-auto md:pb-0 md:w-[min(100vw-2rem,20rem)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        layout
        className={`overflow-hidden shadow-2xl border md:rounded-2xl ${
          isActive
            ? 'border-blue-500/50 bg-gradient-to-r from-blue-900/95 to-indigo-900/95'
            : 'border-purple-800/30 bg-gradient-to-r from-purple-900/90 to-black/90'
        }`}
      >
        <button
          type="button"
          className={`w-full p-3 flex justify-between items-center text-left ${
            isActive ? 'bg-blue-800/30' : 'bg-purple-900/30'
          }`}
          onClick={() => setIsOpen((v) => !v)}
        >
          <motion.div layout="position" className="flex items-center min-w-0">
            <div
              className={`p-2 rounded-full mr-3 shrink-0 ${
                isActive
                  ? 'bg-blue-900/50 border border-blue-600/30'
                  : 'bg-purple-900/50 border border-purple-800/30'
              }`}
            >
              <FaRobot className={`text-xl ${isActive ? 'text-blue-300' : 'text-purple-400'}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-white text-sm">AI Auto-Betting</h3>
              <p className={`text-xs truncate ${isActive ? 'text-blue-300' : 'text-purple-300'}`}>
                {isActive
                  ? totalRounds > 0
                    ? `Round ${roundsPlayed + 1} / ${totalRounds}`
                    : 'Running…'
                  : 'Inactive'}
              </p>
            </div>
          </motion.div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 ml-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ${isActive ? 'text-blue-300' : 'text-purple-300'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>

        {isOpen && (
          <div className="p-4 space-y-4">
            <motion.div
              layout
              className={`rounded-xl p-3 ${
                isActive
                  ? 'bg-blue-900/30 border border-blue-800/30'
                  : 'bg-purple-900/30 border border-purple-800/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-white flex items-center">
                  <FaBrain className={`mr-2 ${isActive ? 'text-blue-400' : 'text-purple-400'}`} />
                  What it does
                </h4>
                <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <p className="text-white/70 text-xs leading-relaxed">
                {isActive ? (
                  <>
                    Running auto-bet with your AI settings. Picks random mines/tiles in your
                    ranges, reveals tiles automatically, and stops at profit/loss limits.
                    {currentBet != null && (
                      <>
                        {' '}
                        Current bet:{' '}
                        <span className="text-white">
                          {Number(currentBet).toFixed(4)} {symbol}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  'Starts an auto-bet session using your strategy, bet limits, and mine/tile ranges from Settings. Connect wallet first.'
                )}
              </p>
            </motion.div>

            <motion.div layout>
              <h4 className="font-medium text-sm text-white flex items-center mb-2">
                <FaChartLine className={`mr-2 ${isActive ? 'text-blue-400' : 'text-purple-400'}`} />
                Strategy
              </h4>
              <motion.div layout className="grid grid-cols-3 gap-2">
                {['conservative', 'balanced', 'aggressive'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChange(mode)}
                    disabled={isActive}
                    className={`p-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                      strategy === mode
                        ? mode === 'conservative'
                          ? 'bg-green-900/50 border border-green-800/50 text-green-300'
                          : mode === 'aggressive'
                            ? 'bg-red-900/50 border border-red-800/50 text-red-300'
                            : 'bg-blue-900/50 border border-blue-800/50 text-blue-300'
                        : 'bg-black/30 border border-gray-800/50 text-white/70 hover:bg-black/40'
                    } ${isActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {mode}
                  </button>
                ))}
              </motion.div>
              <p className="mt-2 text-xs text-white/60">{getStrategyDescription()}</p>
            </motion.div>

            {isActive && autoSession?.active && (
              <motion.div layout className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 p-2 rounded-lg border border-blue-900/30">
                  <motion.div layout className="text-white/60 text-xs mb-1">Session P&amp;L</motion.div>
                  <div
                    className={`text-sm font-medium ${
                      sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {sessionPnL >= 0 ? '+' : ''}
                    {sessionPnL.toFixed(4)} {symbol}
                  </div>
                </div>
                <div className="bg-black/30 p-2 rounded-lg border border-blue-900/30">
                  <div className="text-white/60 text-xs mb-1">Rounds left</div>
                  <div className="text-white text-sm font-medium">
                    {Math.max(0, totalRounds - roundsPlayed)}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div layout className="flex gap-2">
              <button
                type="button"
                onClick={onSettings}
                className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-blue-900/50 border border-blue-800/30 text-blue-300 hover:bg-blue-800/50'
                    : 'bg-purple-900/50 border border-purple-800/30 text-purple-300 hover:bg-purple-800/50'
                }`}
              >
                <FaCog className="mr-1.5" />
                Settings
              </button>
              <button
                type="button"
                onClick={onActivate}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-red-600/80 hover:bg-red-700/80 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                }`}
              >
                {isActive ? 'Stop AI Agent' : 'Start AI Agent'}
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AIAutoBetting;
