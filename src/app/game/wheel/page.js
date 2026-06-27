"use client";

import { useState, useEffect, useRef } from "react";
import GameWheel from "../../../components/wheel/GameWheel";
import BettingPanel from "../../../components/wheel/BettingPanel";
import GameHistory from "../../../components/wheel/GameHistory";
import { calculateResult } from "../../../lib/gameLogic";
import { motion } from "framer-motion";
import { FaHistory, FaTrophy, FaInfoCircle, FaChartLine, FaCoins, FaChevronDown, FaPercentage, FaBalanceScale } from "react-icons/fa";
import { GiCardRandom, GiWheelbarrow, GiSpinningBlades, GiTrophyCup } from "react-icons/gi";
import { HiOutlineTrendingUp, HiOutlineChartBar } from "react-icons/hi";
import { useSelector, useDispatch } from 'react-redux';
import { setBalance } from '@/store/balanceSlice';
import { useNotification } from '@/components/NotificationSystem';
import { useGameLogger } from '@/hooks/useGameLogger';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { usePlayBalance } from '@/hooks/usePlayBalance';
import { houseEdgePercent } from '@/lib/houseEdge';
import { useGameStats } from '@/hooks/useGameStats';
import { useProvableFairness } from '@/hooks/useProvableFairness';
import { computeWheelPayoutNative, resolveWheelSegmentIndex, buildExpandedWheelSegments, wheelRotationForSegmentIndex } from '@/lib/wheel/wheelSegments';

// Import new components
import WheelVideo from "./components/WheelVideo";
import WheelDescription from "./components/WheelDescription";
import WheelStrategyGuide from "./components/WheelStrategyGuide";
import WheelProbability from "./components/WheelProbability";
import WheelHistory from "./components/WheelHistory";
import WheelLeaderboard from "./components/WheelLeaderboard";
import {
  loadGameBetHistory,
  saveGameBetHistory,
  fetchGameBetHistoryFromServer,
  mapWheelServerRow,
} from '@/lib/client/gameBetHistory';

export default function Home() {
  const [betAmount, setBetAmount] = useState(0.1);
  const [risk, setRisk] = useState("medium");
  const [noOfSegments, setSegments] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameMode, setGameMode] = useState("manual");
  const [currentMultiplier, setCurrentMultiplier] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const historyReadyRef = useRef(false);
  const [targetMultiplier, setTargetMultiplier] = useState(null);
  const [wheelPosition, setWheelPosition] = useState(() =>
    wheelRotationForSegmentIndex(0, buildExpandedWheelSegments('medium', 10).length),
  );
  const [hasSpun, setHasSpun] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [result, setResult] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [detectedColor, setDetectedColor] = useState(null);
  const [detectedMultiplier, setDetectedMultiplier] = useState(null);

  const dispatch = useDispatch();
  const { userBalance, isLoading: isLoadingBalance, demoMode } = useSelector((state) => state.balance);
  const notification = useNotification();
  const { logGame } = useGameLogger();
  const { address: playAddress, connected: playConnected, chainLabel } = usePlayWallet();
  const { balanceNative, settleNative, symbol, chain: playChain } = usePlayBalance();
  const spinTimeoutRef = useRef(null);
  const fairness = useProvableFairness('wheel', playAddress);
  const [forcedSegmentIndex, setForcedSegmentIndex] = useState(null);
  const [landedSegmentIndex, setLandedSegmentIndex] = useState(null);
  // symbol drives bet labels in BettingPanel (SOL vs APT)

  const syncWheelToSegment = (segmentIndex) => {
    const wheel = buildExpandedWheelSegments(risk, noOfSegments);
    const count = wheel.length;
    const idx = ((segmentIndex % count) + count) % count;
    setWheelPosition(wheelRotationForSegmentIndex(idx, count));
    setLandedSegmentIndex(idx);
    return idx;
  };

  useEffect(() => {
    const wheel = buildExpandedWheelSegments(risk, noOfSegments);
    setWheelPosition(wheelRotationForSegmentIndex(0, wheel.length));
    setLandedSegmentIndex(null);
    setHasSpun(false);
  }, [risk, noOfSegments]);

  useEffect(() => {
    historyReadyRef.current = false;
    if (!playAddress) {
      setGameHistory([]);
      historyReadyRef.current = true;
      return;
    }

    let cancelled = false;
    (async () => {
      const cached = loadGameBetHistory('wheel', playChain, playAddress);
      if (cached.length > 0) {
        if (!cancelled) setGameHistory(cached);
      } else {
        const fromServer = await fetchGameBetHistoryFromServer(
          'wheel',
          playChain,
          playAddress,
          mapWheelServerRow,
        );
        if (!cancelled && fromServer.length > 0) {
          setGameHistory(fromServer);
          saveGameBetHistory('wheel', playChain, playAddress, fromServer);
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
    saveGameBetHistory('wheel', playChain, playAddress, gameHistory);
  }, [gameHistory, playAddress, playChain]);

  const clearSpinTimeout = () => {
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }
  };

  useEffect(() => () => clearSpinTimeout(), []);

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSpinComplete = async (result, {
    bet,
    segmentOverride,
    fairnessRound,
  }) => {
    try {
      clearSpinTimeout();
      const segmentIndex = syncWheelToSegment(
        segmentOverride != null
          ? segmentOverride
          : result?.segmentIndex != null
            ? result.segmentIndex
            : 0,
      );

      const payout = computeWheelPayoutNative(bet, risk, noOfSegments, segmentIndex);
      const { rawMultiplier, adjustedMultiplier, payoutNative: winAmount, segment } = payout;

      setDetectedColor(segment.color);
      setDetectedMultiplier(rawMultiplier);
      setCurrentMultiplier(adjustedMultiplier);

      const newHistoryItem = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        game: 'Wheel',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        betAmount: bet.toFixed(5),
        multiplier: `${rawMultiplier.toFixed(2)}x`,
        payout: winAmount.toFixed(5),
        result: segmentIndex,
        color: segment.color,
        txHash: null,
        fairnessProof: null,
      };

      setGameHistory((prev) => [newHistoryItem, ...prev]);

      let fairnessProof = null;
      if (fairness.enabled && fairnessRound) {
        fairnessProof = await fairness.reveal(
          { segmentIndex, multiplier: rawMultiplier },
          fairnessRound,
        );
        fairness.reset();
      }

      if (playAddress) {
        const gameResult = `${risk}_${noOfSegments}segments_${rawMultiplier.toFixed(2)}x_${segment.color}`;
        logGame({
          gameType: 'wheel',
          playerAddress: playAddress,
          betAmount: bet,
          result: gameResult,
          payout: winAmount,
          fairnessProof,
        })
          .then((res) => {
            if (res?.success) {
              setGameHistory((prev) =>
                prev.map((item) =>
                  item.id === newHistoryItem.id
                    ? {
                        ...item,
                        txHash: res.transactionHash || res.proofReference || null,
                        explorerUrl: res.explorerUrl || null,
                        fairnessProof: fairnessProof || item.fairnessProof,
                      }
                    : item,
                ),
              );
            }
          })
          .catch((error) => {
            console.error('Failed to log wheel game:', error);
          });
      }

      setHasSpun(true);

      const settled = await settleNative(
        bet,
        adjustedMultiplier > 0 ? winAmount : 0,
        playAddress,
        'wheel',
        {
          risk,
          segments: noOfSegments,
          fairnessProof: fairnessProof || undefined,
        },
      );

      const credited = settled.payoutAmountNative ?? winAmount;

      if (!settled.ok) {
        notification.error(settled.error || 'Could not update balance');
      } else if (adjustedMultiplier > 0) {
        notification.success(
          `${segment.color} ${rawMultiplier.toFixed(2)}x → ${Number(credited).toFixed(8)} ${symbol} (${adjustedMultiplier.toFixed(2)}x after edge)`,
        );
      } else {
        notification.info(`Game over — landed on ${rawMultiplier.toFixed(2)}x`);
      }
    } catch (e) {
      console.error('Wheel settle failed:', e);
      notification.error('Could not update balance for this spin');
    } finally {
      setIsSpinning(false);
      window.wheelBetCallback = null;
    }
  };

  const beginSpinAnimation = (segmentOverride, fairnessRound, bet) => {
    clearSpinTimeout();
    window.wheelBetCallback = null;

    window.wheelBetCallback = async (result) => {
      await handleSpinComplete(result, { bet, segmentOverride, fairnessRound });
    };

    spinTimeoutRef.current = setTimeout(() => {
      const cb = window.wheelBetCallback;
      if (!cb) return;
      window.wheelBetCallback = null;
      const idx = segmentOverride != null ? segmentOverride : 0;
      void cb({ segmentIndex: idx, multiplier: 0 });
    }, 12000);

    setForcedSegmentIndex(segmentOverride);
    setIsSpinning(true);
  };

  // Game modes
  const manulBet = async () => {
    if (betAmount <= 0 || isSpinning) return;

    if (!playConnected || !playAddress) {
      notification.warning(`Connect your ${chainLabel} wallet first`);
      return;
    }

    const currentBalance = balanceNative;
    if (currentBalance < betAmount) {
      notification.warning(
        `Insufficient balance. You have ${currentBalance.toFixed(8)} ${symbol} but need ${betAmount} ${symbol}`,
      );
      return;
    }

    try {
      setHasSpun(false);
      setLandedSegmentIndex(null);

      let segmentOverride = null;
      let fairnessRound = null;
      if (fairness.enabled) {
        fairnessRound = await fairness.begin();
        segmentOverride = resolveWheelSegmentIndex(
          fairnessRound.seedBytes,
          risk,
          noOfSegments,
        );
      }

      beginSpinAnimation(segmentOverride, fairnessRound, betAmount);
    } catch (e) {
      console.error('Bet failed:', e);
      notification.error(`Bet failed: ${e?.message || e}`);
      clearSpinTimeout();
      window.wheelBetCallback = null;
      setIsSpinning(false);
    }
  };

  const autoBet = async ({
    numberOfBets,
    winIncrease = 0,
    lossIncrease = 0,
    stopProfit: rawStopProfit = 0,
    stopLoss: rawStopLoss = 0,
    betAmount: initialBetAmount,
    risk,
    noOfSegments,
  }) => {
    if (!playConnected || !playAddress) {
      notification.warning(`Connect your ${chainLabel} wallet first`);
      return;
    }

    if (isSpinning) return;

    const totalRounds = Math.max(1, Number(numberOfBets) || 10);
    const stopProfit = parseFloat(rawStopProfit) || 0;
    const stopLoss = parseFloat(rawStopLoss) || 0;
    const baseBet = Number(initialBetAmount) || 0.1;
    const winPct = Number(winIncrease) || 0;
    const lossPct = Number(lossIncrease) || 0;

    let currentBet = baseBet;
    let totalProfit = 0;
    let runningBalance = balanceNative;

    for (let i = 0; i < totalRounds; i++) {
      if (runningBalance < currentBet) {
        notification.warning(
          `Insufficient balance for bet ${i + 1}. Need ${currentBet} ${symbol} but have ${runningBalance.toFixed(8)} ${symbol}`,
        );
        break;
      }

      setHasSpun(false);

      let segmentOverride = null;
      let fairnessRound = null;
      if (fairness.enabled) {
        fairnessRound = await fairness.begin();
        segmentOverride = resolveWheelSegmentIndex(
          fairnessRound.seedBytes,
          risk,
          noOfSegments,
        );
      }

      setLandedSegmentIndex(null);

      const roundResult = await new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (window.wheelBetCallback) {
            window.wheelBetCallback = null;
            setIsSpinning(false);
            resolve(null);
          }
        }, 12000);

        window.wheelBetCallback = async (result) => {
          clearTimeout(timeoutId);
          window.wheelBetCallback = null;

          const segmentIndex = syncWheelToSegment(
            segmentOverride != null
              ? segmentOverride
              : result?.segmentIndex != null
                ? result.segmentIndex
                : 0,
          );

          const payout = computeWheelPayoutNative(
            currentBet,
            risk,
            noOfSegments,
            segmentIndex,
          );
          const profit = payout.payoutNative - currentBet;

          resolve({
            segmentIndex,
            rawMultiplier: payout.rawMultiplier,
            actualMultiplier: payout.adjustedMultiplier,
            winAmount: payout.payoutNative,
            profit,
            detectedColor: payout.segment.color,
          });
        };

        setForcedSegmentIndex(segmentOverride);
        setIsSpinning(true);
      });

      setIsSpinning(false);

      if (!roundResult) {
        notification.error('Auto bet stopped — spin did not complete.');
        break;
      }

      const {
        segmentIndex,
        rawMultiplier,
        actualMultiplier,
        winAmount,
        profit,
        detectedColor,
      } = roundResult;

      setCurrentMultiplier(actualMultiplier);
      setDetectedMultiplier(rawMultiplier);
      setHasSpun(true);

      let fairnessProof = null;
      if (fairness.enabled && fairnessRound) {
        fairnessProof = await fairness.reveal(
          { segmentIndex, multiplier: rawMultiplier },
          fairnessRound,
        );
        fairness.reset();
      }

      const settled = await settleNative(
        currentBet,
        actualMultiplier > 0 ? winAmount : 0,
        playAddress,
        'wheel',
        {
          risk,
          segments: noOfSegments,
          fairnessProof: fairnessProof || undefined,
        },
      );

      if (!settled.ok) {
        notification.error(settled.error || 'Could not update balance');
        break;
      }

      runningBalance -= currentBet;
      if (actualMultiplier > 0) {
        runningBalance += settled.payoutAmountNative ?? winAmount;
      }

      totalProfit += profit;

      if (actualMultiplier > 0) {
        notification.success(
          `Round ${i + 1}: ${currentBet} ${symbol} × ${actualMultiplier.toFixed(2)} = ${winAmount.toFixed(8)} ${symbol}`,
        );
      }

      const newHistoryItem = {
        id: `${Date.now()}-${i}`,
        game: 'Wheel',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        betAmount: currentBet.toFixed(5),
        multiplier: `${rawMultiplier.toFixed(2)}x`,
        payout: winAmount.toFixed(5),
        result: segmentIndex,
        color: detectedColor,
        txHash: null,
        fairnessProof: fairnessProof || null,
      };

      setGameHistory((prev) => [newHistoryItem, ...prev]);

      if (playAddress) {
        const gameResult = `${risk}_${noOfSegments}segments_${rawMultiplier.toFixed(2)}x_${detectedColor}`;
        logGame({
          gameType: 'wheel',
          playerAddress: playAddress,
          betAmount: currentBet,
          result: gameResult,
          payout: winAmount,
          fairnessProof,
        })
          .then((res) => {
            if (res?.success) {
              setGameHistory((prev) =>
                prev.map((item) =>
                  item.id === newHistoryItem.id
                    ? {
                        ...item,
                        txHash: res.transactionHash || res.proofReference || null,
                        explorerUrl: res.explorerUrl || null,
                        fairnessProof: fairnessProof || item.fairnessProof,
                      }
                    : item,
                ),
              );
            }
          })
          .catch((error) => {
            console.error('Failed to log wheel auto bet:', error);
          });
      }

      await new Promise((r) => setTimeout(r, 1200));

      if (profit > 0) {
        currentBet = winPct > 0 ? currentBet * (1 + winPct) : baseBet;
      } else {
        currentBet = lossPct > 0 ? currentBet * (1 + lossPct) : baseBet;
      }

      currentBet = Math.min(Math.max(currentBet, 0.0000001), runningBalance);
      if (currentBet <= 0) currentBet = baseBet;

      if (stopProfit > 0 && totalProfit >= stopProfit) break;
      if (stopLoss > 0 && totalProfit <= -stopLoss) break;

      setForcedSegmentIndex(null);
      setLandedSegmentIndex(null);
    }

    setIsSpinning(false);
    setForcedSegmentIndex(null);
    setLandedSegmentIndex(null);
    setBetAmount(currentBet);
  };

  const handleSelectMultiplier = (value) => {
    setTargetMultiplier(value);
  };

  // Header Section
  const renderHeader = () => {
    const { display, loading } = useGameStats('wheel');
    const gameStatistics = {
      totalBets: loading ? '…' : display.totalBets,
      totalVolume: loading ? '…' : display.volume,
      maxWin: loading ? '…' : display.maxWin,
    };

    return (
      <div className="site-page-top relative text-white site-page-pad-x mb-8">
        {/* Background Elements */}
        <div className="absolute top-5 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-28 left-1/3 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 left-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            {/* Left Column - Game Info */}
            <div className="md:w-1/2">
              <div className="flex items-center">
                <div className="mr-3 p-3 bg-gradient-to-br from-red-900/40 to-red-700/10 rounded-lg shadow-lg shadow-red-900/10 border border-red-800/20">
                  <GiWheelbarrow className="text-3xl text-red-300" />
                </div>
                <div>
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-400 font-sans">Games / Wheel</p>
                    <span className="text-xs px-2 py-0.5 bg-red-900/30 rounded-full text-red-300 font-display">Classic</span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 rounded-full text-green-300 font-display">Live</span>
                  </motion.div>
                  <motion.h1
                    className="text-3xl md:text-4xl font-bold font-display bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    Fortune Wheel
                  </motion.h1>
                </div>
              </div>
              <motion.p
                className="text-white/70 mt-2 max-w-xl font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Place your bets and experience the thrill of the spinning wheel. From simple risk levels to customizable segments, the choice is yours.
              </motion.p>

              {/* Game highlights */}
              <motion.div
                className="flex flex-wrap gap-4 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <FaPercentage className="mr-1.5 text-amber-400" />
                  <span className="font-sans">2.7% house edge</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <GiSpinningBlades className="mr-1.5 text-blue-400" />
                  <span className="font-sans">Multiple risk levels</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <FaBalanceScale className="mr-1.5 text-green-400" />
                  <span className="font-sans">Provably fair gaming</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats and Controls */}
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/5 rounded-xl p-4 border border-red-800/20 shadow-lg shadow-red-900/10">
                {/* Quick stats in top row */}
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

                {/* Quick actions */}
                <motion.div
                  className="flex flex-wrap justify-between gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <button
                    onClick={() => scrollToSection('strategy-guide')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-800/40 to-red-900/20 rounded-lg text-white font-medium text-sm hover:from-red-700/40 hover:to-red-800/20 transition-all duration-300"
                  >
                    <GiCardRandom className="mr-2" />
                    Strategy Guide
                  </button>
                  <button
                    onClick={() => scrollToSection('probability')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-800/40 to-blue-900/20 rounded-lg text-white font-medium text-sm hover:from-blue-700/40 hover:to-blue-800/20 transition-all duration-300"
                  >
                    <HiOutlineChartBar className="mr-2" />
                    Probabilities
                  </button>
                  <button
                    onClick={() => scrollToSection('history')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-800/40 to-purple-900/20 rounded-lg text-white font-medium text-sm hover:from-purple-700/40 hover:to-purple-800/20 transition-all duration-300"
                  >
                    <FaChartLine className="mr-2" />
                    Game History
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="w-full h-0.5 bg-gradient-to-r from-red-600 via-blue-500/30 to-transparent mt-6"></div>
        </div>
      </div>
    );
  };


  return (
    <div className="site-game-page bg-[#070005] text-white">
      {/* Header */}
      {renderHeader()}

      {/* Main Game Section */}
      <div className="site-page-pad-x relative z-10 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <GameWheel
              risk={risk}
              isSpinning={isSpinning}
              noOfSegments={noOfSegments}
              currentMultiplier={currentMultiplier}
              targetMultiplier={targetMultiplier}
              handleSelectMultiplier={handleSelectMultiplier}
              wheelPosition={wheelPosition}
              setWheelPosition={setWheelPosition}
              hasSpun={hasSpun}
              onColorDetected={({ color, multiplier }) => {
                setDetectedColor(color);
                setDetectedMultiplier(multiplier);
              }}
              forcedSegmentIndex={forcedSegmentIndex}
              landedSegmentIndex={landedSegmentIndex}
            />
          </div>
          <div className="w-full lg:w-1/3">
            <BettingPanel
              gameMode={gameMode}
              setGameMode={setGameMode}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              balance={balanceNative}
              symbol={symbol}
              manulBet={manulBet}
              risk={risk}
              setRisk={setRisk}
              noOfSegments={noOfSegments}
              setSegments={setSegments}
              autoBet={autoBet}
              isSpinning={isSpinning}
            />
          </div>
        </div>
      </div>

      {/* Video and Description Section */}
      <div className="relative z-0 site-page-pad-x mt-4 mb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            <WheelVideo />
          </div>
          <div className="w-full lg:w-1/2">
            <WheelDescription />
          </div>
        </div>
      </div>

      {/* Strategy Guide and Probabilities Section */}
      <div id="strategy-guide" className="site-page-pad-x my-12 scroll-mt-24">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            <WheelStrategyGuide />
          </div>
          <div id="probability" className="w-full lg:w-1/2 scroll-mt-24">
            <WheelProbability />
          </div>
        </div>
      </div>

      {/* Leaderboard + History */}
      <div className="site-page-pad-x my-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <WheelLeaderboard />
          <div id="history" className="scroll-mt-24">
            <WheelHistory gameHistory={gameHistory} />
          </div>
        </div>
      </div>


    </div>
  );
}