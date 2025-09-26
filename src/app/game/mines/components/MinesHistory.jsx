"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaHistory, FaStar, FaTrophy, FaChartBar, FaBomb, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { GiDiamonds, GiTreasureMap, GiGoldBar, GiDiamondTrophy } from "react-icons/gi";
import { HiClock, HiOutlineLightningBolt } from "react-icons/hi";
import { gameHistoryProofHref, gameHistoryProofLabel } from '@/lib/provablyFair/explorerLinks';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';

const MinesHistory = ({ gameHistory = [], userStats = {} }) => {
  const { chain } = usePlayCurrency();
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const defaultStats = {
    totalPlayed: 0,
    totalWon: 0,
    winRate: "0%",
    biggestWin: "0",
    avgMultiplier: "0x",
    profitLoss: "0",
  };

  const stats = { ...defaultStats, ...userStats };
  const history = gameHistory.length > 0 ? gameHistory : [];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="text-white/30 ml-1" size={10} />;
    return sortDirection === 'asc'
      ? <FaSortUp className="text-purple-400 ml-1" size={12} />
      : <FaSortDown className="text-purple-400 ml-1" size={12} />;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  const cardHoverVariants = {
    hover: {
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.2 }
    }
  };

  const rowClass = (game) =>
    game.outcome === 'win'
      ? 'bg-gradient-to-r from-green-900/20 to-green-800/5 border border-green-800/30'
      : 'bg-gradient-to-r from-red-900/20 to-red-800/5 border border-red-800/30';

  return (
    <motion.div className="bg-gradient-to-br from-[#290023]/80 to-[#150012]/90 rounded-xl border-2 border-purple-700/30 p-3 sm:p-5 shadow-xl shadow-purple-900/20 backdrop-blur-sm relative overflow-hidden">
      <motion.div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl -z-1" />
      <motion.div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl -z-1" />
      <motion.div className="absolute top-1/2 left-1/3 w-20 h-20 bg-pink-500/5 rounded-full blur-2xl -z-1" />

      <motion.div className="relative overflow-hidden mb-4 sm:mb-5">
        <motion.div className="flex items-center justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold flex items-center font-display min-w-0">
            <motion.div className="p-2 rounded-full bg-purple-900/30 mr-2 sm:mr-3 border border-purple-800/30 shadow-inner shrink-0">
              <FaHistory className="text-purple-400" />
            </motion.div>
            <span className="bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent truncate">
              Your Mines History
            </span>
          </h3>
          <motion.div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 px-3 py-1.5 rounded-full text-xs border border-purple-800/30 shadow-inner shrink-0">
            <span className="font-medium text-white/90">{history.length}</span>
            <span className="text-white/70"> Games</span>
          </motion.div>
        </motion.div>

        <motion.div className="h-px mt-3 bg-gradient-to-r from-purple-600/50 via-blue-600/30 to-transparent relative overflow-hidden">
          <motion.div
            className="h-full w-20 bg-gradient-to-r from-transparent via-white/70 to-transparent absolute"
            animate={{ x: ["0%", "100%"], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />
        </motion.div>
      </motion.div>

      <motion.div className="grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3 mb-4 sm:mb-5">
        {[
          { label: 'Games Played', value: stats.totalPlayed, icon: <FaChartBar className="mr-1.5 text-blue-400" />, valueClass: 'text-white' },
          { label: 'Games Won', value: stats.totalWon, icon: <FaTrophy className="mr-1.5 text-yellow-400" />, valueClass: 'text-white' },
          { label: 'Win Rate', value: stats.winRate, icon: <FaStar className="mr-1.5 text-orange-400" />, valueClass: 'text-white' },
          { label: 'Biggest Win', value: stats.biggestWin, icon: <GiDiamondTrophy className="mr-1.5" />, valueClass: 'text-green-400' },
          { label: 'Avg Multiplier', value: stats.avgMultiplier, icon: <HiOutlineLightningBolt className="mr-1.5" />, valueClass: 'text-yellow-400' },
          {
            label: 'Profit/Loss',
            value: stats.profitLoss,
            icon: <GiGoldBar className="mr-1.5" />,
            valueClass: stats.profitLoss.startsWith('-') ? 'text-red-400' : 'text-green-400',
          },
        ].map((item) => (
          <motion.div
            key={item.label}
            className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-xl p-2 sm:p-3 border border-purple-800/30 shadow-md"
            whileHover="hover"
            variants={cardHoverVariants}
          >
            <motion.div className="text-[10px] sm:text-xs text-white/60 mb-1 font-sans">{item.label}</motion.div>
            <motion.div className={`text-xs sm:text-sm font-semibold flex items-center mt-1 ${item.valueClass}`}>
              {item.icon}
              <span className="font-display truncate">{item.value}</span>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="bg-black/20 rounded-xl border border-purple-800/20 p-3 sm:p-4 shadow-inner">
        <motion.div className="hidden md:grid grid-cols-7 gap-2 pb-3 text-xs font-medium border-b border-purple-800/30 px-2">
          {[
            { field: 'id', label: 'Game' },
            { field: 'mines', label: 'Mines' },
            { field: 'bet', label: 'Bet' },
            { field: 'multiplier', label: 'Multiplier' },
            { field: 'payout', label: 'Payout' },
            { field: 'time', label: 'Time' },
          ].map(({ field, label }) => (
            <motion.div
              key={field}
              className="flex items-center cursor-pointer hover:text-white/90 transition-colors text-white/70"
              onClick={() => handleSort(field)}
            >
              {label} <SortIcon field={field} />
            </motion.div>
          ))}
          <motion.div className="text-white/70">TX</motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hidden md:block space-y-2 mt-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar"
        >
          {history.map((game) => (
            <motion.div
              key={game.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)", y: -2 }}
              className={`grid grid-cols-7 gap-2 p-3 text-xs rounded-lg transition-all ${rowClass(game)} shadow-sm`}
            >
              <motion.div className="flex items-center">
                <motion.div className={`w-5 h-5 rounded-full mr-1.5 flex items-center justify-center ${game.outcome === 'win' ? 'bg-green-900/40 text-green-400 border border-green-800/30' : 'bg-red-900/40 text-red-400 border border-red-800/30'}`}>
                  {game.outcome === 'win' ? '✓' : '✗'}
                </motion.div>
                <span className="text-white/90 font-medium">#{game.id}</span>
              </motion.div>
              <motion.div className="text-white/90 flex items-center">
                <FaBomb className="text-red-400 mr-1.5" size={10} />
                <span>{game.mines}</span>
              </motion.div>
              <motion.div className="text-white/90">{game.bet}</motion.div>
              <motion.div className={game.outcome === 'win' ? 'text-yellow-400 font-medium' : 'text-gray-500'}>{game.multiplier}</motion.div>
              <motion.div className={`font-medium ${game.outcome === 'win' ? 'text-green-400' : 'text-gray-500'}`}>{game.payout}</motion.div>
              <motion.div className="text-white/70">{game.time}</motion.div>
              <motion.div>
                {game.txHash ? (
                  <a
                    href={gameHistoryProofHref({ chain, txHash: game.txHash, explorerUrl: game.explorerUrl }) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                    title={gameHistoryProofLabel(chain)}
                  >
                    {game.txHash.slice(0, 6)}...{game.txHash.slice(-4)}
                  </a>
                ) : (
                  <span className="text-gray-500">pending</span>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="md:hidden space-y-2 mt-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar"
        >
          {history.map((game) => (
            <motion.div
              key={`mobile-${game.id}`}
              variants={itemVariants}
              className={`rounded-lg border p-3 text-xs shadow-sm ${rowClass(game)}`}
            >
              <motion.div className="flex items-start justify-between gap-2 mb-2">
                <motion.div className="flex items-center min-w-0">
                  <motion.div className={`w-5 h-5 rounded-full mr-1.5 shrink-0 flex items-center justify-center ${game.outcome === 'win' ? 'bg-green-900/40 text-green-400 border border-green-800/30' : 'bg-red-900/40 text-red-400 border border-red-800/30'}`}>
                    {game.outcome === 'win' ? '✓' : '✗'}
                  </motion.div>
                  <span className="text-white/90 font-medium truncate">#{game.id}</span>
                </motion.div>
                <span className="text-white/60 shrink-0">{game.time}</span>
              </motion.div>
              <motion.div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <motion.div>
                  <motion.div className="text-white/50 mb-0.5">Mines</motion.div>
                  <motion.div className="text-white/90 flex items-center">
                    <FaBomb className="text-red-400 mr-1" size={10} />
                    {game.mines}
                  </motion.div>
                </motion.div>
                <motion.div>
                  <motion.div className="text-white/50 mb-0.5">Bet</motion.div>
                  <motion.div className="text-white/90">{game.bet}</motion.div>
                </motion.div>
                <motion.div>
                  <motion.div className="text-white/50 mb-0.5">Multiplier</motion.div>
                  <motion.div className={`font-medium ${game.outcome === 'win' ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {game.multiplier}
                  </motion.div>
                </motion.div>
                <motion.div>
                  <motion.div className="text-white/50 mb-0.5">Payout</motion.div>
                  <motion.div className={`font-medium ${game.outcome === 'win' ? 'text-green-400' : 'text-gray-500'}`}>
                    {game.payout}
                  </motion.div>
                </motion.div>
              </motion.div>
              <motion.div className="mt-2 pt-2 border-t border-purple-800/20">
                {game.txHash ? (
                  <a
                    href={gameHistoryProofHref({ chain, txHash: game.txHash, explorerUrl: game.explorerUrl }) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                    title={gameHistoryProofLabel(chain)}
                  >
                    TX: {game.txHash.slice(0, 6)}...{game.txHash.slice(-4)}
                  </a>
                ) : (
                  <span className="text-gray-500">TX: pending</span>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {history.length === 0 && (
        <motion.div className="text-center py-12 sm:py-16 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <GiTreasureMap className="mx-auto text-5xl mb-3 text-purple-500/60" />
            <h4 className="text-lg font-medium text-white mb-2 font-display">No Game History Yet</h4>
            <p className="text-white/60 text-sm max-w-md mx-auto font-sans">
              Start playing to see your results! Your game history will track your wins, losses, and overall performance.
            </p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MinesHistory;
