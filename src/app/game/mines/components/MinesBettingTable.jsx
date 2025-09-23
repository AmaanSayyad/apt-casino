"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTable,
  FaGem,
  FaBomb,
  FaTrophy,
  FaChevronRight,
  FaChevronDown,
  FaChartLine,
  FaCalculator,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { GiTreasureMap } from "react-icons/gi";
import { HiOutlineLightningBolt } from "react-icons/hi";
import {
  buildMinesMultiplierRows,
  formatMinesMultiplierLabel,
  MINES_GRID_DEFAULT,
  MINES_PAYOUT_TAB_MINES,
} from "@/lib/minesPayTable";
import { houseEdgePercent } from "@/lib/houseEdge";
import { usePlayCurrency } from "@/hooks/usePlayCurrency";

const TOTAL_TILES = MINES_GRID_DEFAULT * MINES_GRID_DEFAULT;

const MinesBettingTable = ({ bettingTableData }) => {
  const { symbol } = usePlayCurrency();
  if (!bettingTableData) {
    console.error("MinesBettingTable: bettingTableData prop is required");
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl border border-red-800/30 p-4 mt-6 shadow-lg">
        <div className="text-red-400 font-medium">Error: Betting table data not available</div>
      </div>
    );
  }

  const mineTabs = useMemo(() => {
    const raw = bettingTableData.mineTabs;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((n) => Math.max(1, Math.min(24, Math.floor(Number(n))))).filter((n) => Number.isFinite(n));
    }
    return [...MINES_PAYOUT_TAB_MINES];
  }, [bettingTableData.mineTabs]);

  const [activeTab, setActiveTab] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    if (mineTabs.length > 0 && activeTab >= mineTabs.length) {
      setActiveTab(0);
    }
  }, [mineTabs.length, activeTab, mineTabs]);

  const minesHouseEdgePct = houseEdgePercent("mines");

  const strategyTips = [
    {
      title: "Low Risk",
      description: "Select 1-3 mines for safer play with modest returns.",
      icon: <FaTrophy className="text-yellow-400" />,
      color: "from-green-900/40 to-green-800/20",
      borderColor: "green-800/30",
      hoverColor: "from-green-800/40 to-green-700/20",
    },
    {
      title: "Balanced",
      description: "5 mines offers a good risk/reward ratio for most players.",
      icon: <FaGem className="text-blue-400" />,
      color: "from-blue-900/40 to-blue-800/20",
      borderColor: "blue-800/30",
      hoverColor: "from-blue-800/40 to-blue-700/20",
    },
    {
      title: "High Risk",
      description: "10+ mines for experienced players seeking massive multipliers.",
      icon: <FaBomb className="text-red-400" />,
      color: "from-red-900/40 to-red-800/20",
      borderColor: "red-800/30",
      hoverColor: "from-red-800/40 to-red-700/20",
    },
  ];

  const currentMines =
    mineTabs.length > 0 ? mineTabs[Math.min(activeTab, mineTabs.length - 1)] : 1;
  const rows = useMemo(
    () => buildMinesMultiplierRows(currentMines, MINES_GRID_DEFAULT),
    [currentMines],
  );

  if (!mineTabs.length) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl border border-red-800/30 p-4 mt-6 shadow-lg">
        <div className="text-red-400 font-medium">Error: No mine presets configured for payout table</div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  return (
    <div className="bg-gradient-to-br from-[#290023]/80 to-[#150012]/90 rounded-xl border-2 border-purple-700/30 p-6 mt-6 shadow-xl shadow-purple-900/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white font-display flex items-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          <div className="p-2 bg-gradient-to-br from-purple-900/40 to-purple-700/10 rounded-lg shadow-lg shadow-purple-900/10 border border-purple-800/20 mr-3">
            <FaTable className="text-purple-300" />
          </div>
          {bettingTableData.title || "Mines Payouts"}
        </h3>

        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="flex items-center bg-gradient-to-r from-purple-900/30 to-purple-800/20 px-3 py-1.5 rounded-full text-white/80 text-sm font-medium border border-purple-800/30 hover:from-purple-800/40 hover:to-purple-700/30 transition-colors shadow-md shadow-purple-900/10"
        >
          <GiTreasureMap className="mr-1.5 text-yellow-400" />
          Tips {showTips ? <FaChevronDown className="ml-1.5" /> : <FaChevronRight className="ml-1.5" />}
        </button>
      </div>

      <p className="text-white/70 font-sans text-sm mb-6 max-w-3xl">
        {bettingTableData.description ||
          "Your multiplier increases as you reveal more safe tiles. Higher mine counts offer larger rewards."}
      </p>

      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/10 border border-purple-800/30 rounded-lg p-4 shadow-lg shadow-purple-900/5">
              <h4 className="text-white font-semibold mb-3 flex items-center font-display">
                <GiTreasureMap className="mr-2 text-yellow-400" /> Strategy Guide
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {strategyTips.map((tip, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-br ${tip.color} rounded-lg p-4 border border-${tip.borderColor} shadow-md hover:shadow-lg transition-all`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-black/30 rounded-full mr-2">{tip.icon}</div>
                      <span className="text-white font-medium font-display">{tip.title}</span>
                    </div>
                    <p className="text-white/80 text-sm font-sans">{tip.description}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-black/30 rounded-lg border border-gray-800/50 shadow-inner">
                <h5 className="text-white flex items-center text-sm font-medium mb-2 font-display">
                  <FaCalculator className="mr-2 text-blue-400" /> Probability Insight
                </h5>
                <p className="text-white/70 text-xs font-sans">
                  After you have revealed <span className="text-purple-300">n</span> safe gems, the chance the next
                  unrevealed tile is a mine is{" "}
                  <span className="font-mono text-green-400 bg-black/50 px-1.5 py-0.5 rounded">
                    mines / ({TOTAL_TILES} − n)
                  </span>
                  . That rises with every safe pick.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mb-6">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full z-10 shadow-lg border border-purple-800/30">
          <FaArrowLeft className="text-white/60" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full z-10 shadow-lg border border-purple-800/30">
          <FaArrowRight className="text-white/60" />
        </div>

        <div className="flex overflow-x-auto custom-scrollbar py-2 px-10 bg-black/30 rounded-xl border border-purple-800/30 shadow-inner">
          {mineTabs.map((mines, index) => (
            <motion.button
              key={mines}
              type="button"
              onClick={() => setActiveTab(index)}
              className={`flex items-center min-w-[120px] px-5 py-2.5 rounded-lg mr-3 text-sm whitespace-nowrap transition-all ${
                activeTab === index
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-900/30 scale-105 font-medium"
                  : "bg-gray-800/50 text-white/80 hover:bg-gray-800"
              }`}
              whileHover={{ y: -2, scale: activeTab === index ? 1.05 : 1.02 }}
              whileTap={{ y: 0 }}
            >
              <FaBomb className="mr-2" />
              {mines} {mines === 1 ? "Mine" : "Mines"}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="bg-black/40 rounded-xl p-5 border border-purple-900/30 shadow-inner">
        <div className="grid grid-cols-3 gap-3 mb-4 text-white/80 text-sm font-medium border-b border-gray-800/50 pb-3">
          <div className="font-display">Tiles Revealed</div>
          <div className="font-display">Multiplier</div>
          <div className="font-display">For 1 unit</div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar"
          key={currentMines}
        >
          {rows.map((row, index) => {
            const mult = row.multiplier;
            const payout1Apt = mult;
            const multLabel = formatMinesMultiplierLabel(mult);

            let bgGradient = "from-purple-900/20 to-blue-900/10";
            let textColor = "text-green-400";
            let borderColor = "border-purple-800/30";

            if (payout1Apt > 100) {
              bgGradient = "from-red-900/30 to-orange-900/20";
              textColor = "text-red-400";
              borderColor = "border-red-800/40";
            } else if (payout1Apt > 25) {
              bgGradient = "from-orange-900/30 to-yellow-900/20";
              textColor = "text-orange-400";
              borderColor = "border-orange-800/40";
            } else if (payout1Apt > 8) {
              bgGradient = "from-yellow-900/30 to-green-900/20";
              textColor = "text-yellow-400";
              borderColor = "border-yellow-800/40";
            }

            const unrevealed = TOTAL_TILES - row.tiles;
            const nextMinePct =
              unrevealed > 0 ? Math.min(100, (currentMines / unrevealed) * 100) : 100;

            return (
              <motion.div
                key={`${currentMines}-${row.tiles}`}
                variants={rowVariants}
                className={`grid grid-cols-3 gap-3 p-4 rounded-lg bg-gradient-to-r ${bgGradient} border ${borderColor} hover:border-purple-500/50 transition-all relative shadow-md`}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                whileHover={{ y: -2, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)" }}
              >
                <div className="flex items-center text-white">
                  <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center mr-2 border border-blue-800/30">
                    <FaGem className="text-blue-400" />
                  </div>
                  <span className="font-medium text-lg">{row.tiles}</span>
                </div>
                <div className="text-yellow-400 font-bold text-lg flex items-center">
                  <span>{multLabel}</span>
                </div>
                <div className={`${textColor} font-bold text-lg flex items-center`}>
                  {payout1Apt.toFixed(2)} {symbol}
                </div>

                <AnimatePresence>
                  {hoverIndex === index && (
                    <motion.div
                      className="absolute -right-2 -bottom-2 bg-black/90 text-xs px-3 py-1.5 rounded-full text-white/90 border border-purple-800/50 shadow-lg"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <div className="flex items-center">
                        <FaChartLine className="mr-1.5 text-blue-400" />
                        <span>Next pick P(mine): {nextMinePct.toFixed(1)}%</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-5 text-white/80 text-sm flex items-start p-4 bg-purple-900/20 rounded-lg border border-purple-800/30 shadow-md">
        <HiOutlineLightningBolt className="mt-0.5 mr-3 text-purple-400 flex-shrink-0 text-xl" />
        <span className="font-sans">
          Fair multiplier (before edge):{" "}
          <span className="text-xs bg-black/60 rounded px-2 py-1 font-mono">
            {TOTAL_TILES} / ({TOTAL_TILES} − mines − revealed)
          </span>
          . In-game values apply a{" "}
          <span className="text-amber-200">{minesHouseEdgePct.toFixed(1)}% house edge</span> via{" "}
          <span className="font-mono text-white/90">× (1 − bps/10000)</span> — identical to the multiplier rail while
          you play.
        </span>
      </div>
    </div>
  );
};

export default MinesBettingTable;
