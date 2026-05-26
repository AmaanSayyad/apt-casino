"use client";
import { useState, useRef, useEffect } from "react";
import PlinkoGame from "./components/PlinkoGame";
import GameHistory from "./components/GameHistory";
import GameControls from "./components/GameControls";
import PlinkoStrategyGuide from "./components/PlinkoStrategyGuide";
import PlinkoWinProbabilities from "./components/PlinkoWinProbabilities";
import PlinkoPayouts from "./components/PlinkoPayouts";
import PlinkoLeaderboard from "./components/PlinkoLeaderboard";
import { gameData, bettingTableData } from "./config/gameDetail";
import { useSelector } from 'react-redux';
import { motion } from "framer-motion";
import { Typography } from "@mui/material";
import { GiRollingDices, GiCardRandom, GiPokerHand } from "react-icons/gi";
import { FaPercentage, FaBalanceScale, FaChartLine, FaCoins, FaTrophy, FaPlay, FaExternalLinkAlt, FaBookOpen, FaCheckCircle } from "react-icons/fa";
import { useGameStats } from "@/hooks/useGameStats";
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';
import {
  loadGameBetHistory,
  saveGameBetHistory,
  fetchGameBetHistoryFromServer,
  mapPlinkoServerRow,
} from '@/lib/client/gameBetHistory';

export default function Plinko() {
  const userBalance = useSelector((state) => state.balance.userBalance);

  const [currentRows, setCurrentRows] = useState(16);
  const [currentRiskLevel, setCurrentRiskLevel] = useState("High");
  const [currentBetAmount, setCurrentBetAmount] = useState(0.1);
  const [gameHistory, setGameHistory] = useState([]);
  const plinkoGameRef = useRef(null);
  const historyReadyRef = useRef(false);
  const { address: playAddress } = usePlayWallet();
  const { chain: playChain } = usePlayCurrency();

  // Smooth scroll helper
  const scrollToElement = (elementId) => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(elementId);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    historyReadyRef.current = false;
    if (!playAddress) {
      setGameHistory([]);
      historyReadyRef.current = true;
      return;
    }

    let cancelled = false;
    (async () => {
      const cached = loadGameBetHistory('plinko', playChain, playAddress);
      if (cached.length > 0) {
        if (!cancelled) setGameHistory(cached);
      } else {
        const fromServer = await fetchGameBetHistoryFromServer(
          'plinko',
          playChain,
          playAddress,
          mapPlinkoServerRow,
        );
        if (!cancelled && fromServer.length > 0) {
          setGameHistory(fromServer);
          saveGameBetHistory('plinko', playChain, playAddress, fromServer);
        }
      }
      if (!cancelled) historyReadyRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [playAddress, playChain]);

  useEffect(() => {
    if (!playAddress || !historyReadyRef.current) return;
    saveGameBetHistory('plinko', playChain, playAddress, gameHistory);
  }, [gameHistory, playAddress, playChain]);

  // Header component adapted from Roulette header
  const PlinkoHeader = () => {
    const { display, loading } = useGameStats('plinko');
    const gameStatistics = {
      totalBets: loading ? '…' : display.totalBets,
      totalVolume: loading ? '…' : display.volume,
      maxWin: loading ? '…' : display.maxWin,
    };
    return (
      <div className="site-page-top site-page-pad-x relative mb-6 text-white md:mb-8">
        <div className="relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            {/* Left Column - Game Info */}
            <div className="md:w-1/2">
              <div className="flex items-center">
                <div className="mr-3 p-3 bg-gradient-to-br from-purple-900/40 to-fuchsia-700/10 rounded-lg shadow-lg shadow-purple-900/10 border border-purple-800/20">
                  <GiRollingDices className="text-3xl text-fuchsia-300" />
                </div>
                <div>
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-400 font-sans">Games / Plinko</p>
                    <span className="text-xs px-2 py-0.5 bg-purple-900/30 rounded-full text-purple-300 font-display">Classic</span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 rounded-full text-green-300 font-display">Live</span>
                  </motion.div>
                  <motion.h1
                    className="text-3xl md:text-4xl font-bold font-display bg-gradient-to-r from-pink-300 to-amber-300 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    Plinko
                  </motion.h1>
                </div>
              </div>
              <motion.p
                className="text-white/70 mt-2 max-w-xl font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Choose your bet, risk level and rows, then drop the ball and watch it bounce through the pegs to a multiplier slot.
              </motion.p>

              {/* Game highlights */}
              <motion.div
                className="flex flex-wrap gap-4 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center text-sm bg-gradient-to-r from-purple-900/30 to-fuchsia-800/10 px-3 py-1.5 rounded-full">
                  <FaPercentage className="mr-1.5 text-amber-400" />
                  <span className="font-sans">Configurable risk</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-purple-900/30 to-fuchsia-800/10 px-3 py-1.5 rounded-full">
                  <GiPokerHand className="mr-1.5 text-blue-400" />
                  <span className="font-sans">8–16 rows</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-purple-900/30 to-fuchsia-800/10 px-3 py-1.5 rounded-full">
                  <FaBalanceScale className="mr-1.5 text-green-400" />
                  <span className="font-sans">Provably fair</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats and Quick links */}
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-purple-900/20 to-fuchsia-800/5 rounded-xl p-4 border border-purple-800/20 shadow-lg shadow-purple-900/10">
                <motion.div
                  className="grid grid-cols-3 gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 mb-1">
                      <FaChartLine className="text-blue-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Total Bets</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.totalBets}</div>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600/20 mb-1">
                      <FaCoins className="text-yellow-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Volume</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.totalVolume}</div>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/20 mb-1">
                      <FaTrophy className="text-yellow-500" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Max Win</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.maxWin}</div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex flex-wrap justify-between gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <button onClick={() => scrollToElement('strategy')} className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-800/40 to-fuchsia-900/20 rounded-lg text-white font-medium text-sm hover:from-purple-700/40 hover:to-fuchsia-800/20 transition-all duration-300">
                    <GiCardRandom className="mr-2" />
                    Strategy Guide
                  </button>
                  <button onClick={() => scrollToElement('payouts')} className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-800/40 to-blue-900/20 rounded-lg text-white font-medium text-sm hover:from-blue-700/40 hover:to-blue-800/20 transition-all duration-300">
                    <FaCoins className="mr-2" />
                    Payout Tables
                  </button>
                  <button onClick={() => scrollToElement('history')} className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-800/40 to-purple-900/20 rounded-lg text-white font-medium text-sm hover:from-purple-700/40 hover:to-purple-800/20 transition-all duration-300">
                    <FaChartLine className="mr-2" />
                    Game History
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="w-full h-0.5 bg-gradient-to-r from-pink-600 via-blue-500/30 to-transparent mt-6"></div>
        </div>
      </div>
    );
  };

  const handleBetAmountChange = (amount) => {
    console.log('Main page received bet amount:', amount);
    setCurrentBetAmount(amount);
  };

  const handleBet = (amount) => {
    const bet =
      typeof amount === 'number' && Number.isFinite(amount) ? amount : currentBetAmount;
    if (bet > 0) setCurrentBetAmount(bet);
    if (plinkoGameRef.current?.dropBall) {
      plinkoGameRef.current.dropBall(bet);
    }
  };

  const handleBetHistoryChange = (newBetResult) => {
    setGameHistory(prev => {
      // Check if this entry already exists (e.g. updating with TX hash)
      const existingIndex = prev.findIndex(item => item.id === newBetResult.id);

      if (existingIndex !== -1) {
        // Update existing entry
        const updatedHistory = [...prev];
        updatedHistory[existingIndex] = newBetResult;
        return updatedHistory;
      } else {
        // Add new entry
        return [newBetResult, ...prev].slice(0, 100);
      }
    });
  };

  const handleRowChange = (newRows) => {
    console.log('Main page: Row change requested to:', newRows);
    setCurrentRows(newRows);
    // Don't reset bet amount, let GameControls handle it
    console.log('Main page: Row changed, keeping bet amount:', currentBetAmount);
    // The PlinkoGame component will automatically update when the rowCount prop changes
  };

  const handleRiskLevelChange = (newRiskLevel) => {
    console.log('Main page: Risk level change requested to:', newRiskLevel);
    setCurrentRiskLevel(newRiskLevel);
    // Don't reset bet amount, let GameControls handle it
    console.log('Main page: Risk level changed, keeping bet amount:', currentBetAmount);
    // The PlinkoGame component will automatically update when the riskLevel prop changes
  };

  return (
    <div className="site-game-page bg-[#070005] text-white">
      {/* Header */}
      <PlinkoHeader />

      {/* Main Game Area */}
      <div className="site-page-pad-x pb-8 sm:pb-12">
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-8">
          {/* Left Panel - Game Controls */}
          <div className="w-full xl:w-1/4">
            <GameControls
              onBet={handleBet}
              onRowChange={handleRowChange}
              onRiskLevelChange={handleRiskLevelChange}
              onBetAmountChange={handleBetAmountChange}
              initialRows={currentRows}
              initialRiskLevel={currentRiskLevel}
            />
          </div>

          {/* Right Panel - Plinko Board */}
          <div className="w-full xl:w-3/4">
            <PlinkoGame
              ref={plinkoGameRef}
              rowCount={currentRows}
              riskLevel={currentRiskLevel}
              onRowChange={handleRowChange}
              betAmount={currentBetAmount}
              onBetHistoryChange={handleBetHistoryChange}
            />
          </div>
        </div>
      </div>

      {/* Game Description with Video */}
      <div className="site-page-pad-x pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Video on left */}
          <div>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-purple-600/40 transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/60"
              style={{
                background: 'linear-gradient(135deg, rgba(104, 29, 219, 0.1), rgba(216, 38, 51, 0.05))',
                border: '2px solid rgba(104, 29, 219, 0.4)'
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${gameData.youtube}?si=${gameData.youtube}`}
                title={`${gameData.title} Tutorial`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Description on right */}
          <div className="relative bg-gradient-to-br from-[#1A0015]/95 to-[#0d0008]/90 rounded-xl border border-purple-700/30 p-6 text-gray-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-pink-500 via-fuchsia-500 to-blue-500" />

            <div className="flex items-center gap-3 mb-5 pt-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-purple-600/20 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-900/30">
                <FaBookOpen className="text-pink-300" size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-pink-300 bg-clip-text text-transparent">
                  How to Play {gameData.title}
                </h3>
                <p className="text-xs text-white/50">Quick reference · drop, watch, win</p>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-relaxed">
              {gameData.paragraphs.map((paragraph, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg bg-black/20 border border-purple-500/10 hover:border-purple-500/30 transition-colors"
                >
                  <FaCheckCircle className="text-pink-400 mt-1 flex-shrink-0" size={14} />
                  <p className="text-gray-300">{paragraph}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-800/30 to-fuchsia-700/20 border border-purple-500/30 text-white/80">
                8–16 rows
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-800/30 to-rose-700/20 border border-pink-500/30 text-white/80">
                Low / Medium / High risk
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-800/30 to-green-700/20 border border-emerald-500/30 text-white/80">
                Up to 1000×
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game History Section */}
      <div className="site-page-pad-x pb-12 scroll-mt-20" id="history">
        <div className="relative bg-gradient-to-br from-[#1A0015]/95 to-[#0d0008]/90 rounded-xl border border-purple-700/30 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-pink-500 via-fuchsia-500 to-blue-500 z-10" />
          <div className="p-6 pt-7">
            <GameHistory history={gameHistory} />
          </div>
        </div>
      </div>

      {/* Strategy + Probabilities + (side-by-side) Payouts & Leaderboard */}
      <div className="site-page-pad-x pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 scroll-mt-20" id="strategy">
            <PlinkoStrategyGuide />
          </div>
          <div className="lg:col-span-1">
            <PlinkoWinProbabilities risk={currentRiskLevel} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 scroll-mt-20" id="payouts">
            <PlinkoPayouts />
          </div>
          <div className="lg:col-span-2">
            <PlinkoLeaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
