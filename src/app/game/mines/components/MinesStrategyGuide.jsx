"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChartLine, FaTrophy, FaInfoCircle, FaChevronDown, FaBomb } from "react-icons/fa";
import { GiChestArmor, GiDiamonds } from "react-icons/gi";
import { HiLightningBolt, HiOutlineTrendingUp, HiOutlineChartBar } from "react-icons/hi";

const MinesStrategyGuide = () => {
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  return (
    <motion.div 
      id="strategy-guide"
      className="mt-8 bg-gradient-to-br from-[#290023]/80 to-[#150012]/90 border-2 border-purple-700/30 rounded-xl p-6 backdrop-blur-sm shadow-xl shadow-purple-900/20 scroll-mt-24 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-purple-600/5 rounded-full blur-3xl -z-1"></div>
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/5 rounded-full blur-3xl -z-1"></div>
      <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl -z-1"></div>
      
      {/* Header with shimmer effect */}
      <div className="relative overflow-hidden mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white font-display flex items-center">
            <div className="p-2.5 rounded-full bg-gradient-to-br from-yellow-600/30 to-yellow-800/20 mr-3 border border-yellow-600/30 shadow-lg shadow-yellow-900/10">
              <GiChestArmor className="text-yellow-400 text-xl" />
            </div>
            <span className="bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
              Strategy Guide
            </span>
          </h3>
          <button 
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 px-4 py-1.5 rounded-full text-sm text-white/80 hover:text-white flex items-center gap-2 border border-purple-800/30 hover:border-purple-700/40 transition-all duration-300 shadow-md"
          >
            {isStatsExpanded ? (
              <>
                <span>Show Less</span>
                <motion.div
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaChevronDown className="text-purple-400" size={12} />
                </motion.div>
              </>
            ) : (
              <>
                <span>Show More</span>
                <FaChevronDown className="text-purple-400" size={12} />
              </>
            )}
          </button>
        </div>
        
        {/* Animated underline */}
        <div className="h-px mt-4 bg-gradient-to-r from-yellow-600/50 via-purple-600/30 to-transparent relative overflow-hidden">
          <motion.div 
            className="h-full w-20 bg-gradient-to-r from-transparent via-white/70 to-transparent absolute"
            animate={{ 
              x: ["0%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "linear"
            }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <motion.div 
          className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/5 rounded-xl p-5 border border-yellow-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
            <div className="p-2 bg-gradient-to-br from-yellow-700/40 to-yellow-900/20 rounded-full mr-3 border border-yellow-700/30 shadow-inner">
              <HiLightningBolt className="text-yellow-400" />
            </div>
            <span className="bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              Beginner Strategy
            </span>
          </h4>
          <p className="text-white/80 text-sm font-sans relative z-10">
            Start with 1-3 mines and aim to uncover 5-8 tiles before cashing out. This 
            offers a good balance of risk and reward while you learn the game.
          </p>
          
          <ul className="mt-3 space-y-2 text-sm text-white/70 relative z-10">
            <li className="flex items-start">
              <div className="w-4 h-4 rounded-full bg-yellow-900/30 border border-yellow-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-yellow-400 text-[10px]">✓</span>
              </div>
              <span>Safe option for newcomers</span>
            </li>
            <li className="flex items-start">
              <div className="w-4 h-4 rounded-full bg-yellow-900/30 border border-yellow-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-yellow-400 text-[10px]">✓</span>
              </div>
              <span>Focus on consistent small wins</span>
            </li>
          </ul>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-blue-900/20 to-blue-800/5 rounded-xl p-5 border border-blue-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
            <div className="p-2 bg-gradient-to-br from-blue-700/40 to-blue-900/20 rounded-full mr-3 border border-blue-700/30 shadow-inner">
              <HiOutlineTrendingUp className="text-blue-400" />
            </div>
            <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Risk Management
            </span>
          </h4>
          <p className="text-white/80 text-sm font-sans relative z-10">
            Set a target multiplier before starting each game and cash out when you reach it.
            Consistency is key to long-term success.
          </p>
          
          <ul className="mt-3 space-y-2 text-sm text-white/70 relative z-10">
            <li className="flex items-start">
              <div className="w-4 h-4 rounded-full bg-blue-900/30 border border-blue-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-blue-400 text-[10px]">✓</span>
              </div>
              <span>Set a goal of 2x-3x per game</span>
            </li>
            <li className="flex items-start">
              <div className="w-4 h-4 rounded-full bg-blue-900/30 border border-blue-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-blue-400 text-[10px]">✓</span>
              </div>
              <span>Don't chase losses with bigger bets</span>
            </li>
          </ul>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-green-900/20 to-green-800/5 rounded-xl p-5 border border-green-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-green-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
            <div className="p-2 bg-gradient-to-br from-green-700/40 to-green-900/20 rounded-full mr-3 border border-green-700/30 shadow-inner">
              <HiOutlineChartBar className="text-green-400" />
            </div>
            <span className="bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
              Bankroll Management
            </span>
          </h4>
          <p className="text-white/80 text-sm font-sans relative z-10">
            Never bet more than 5% of your total bankroll on a single game. This helps 
            ensure you can recover from losing streaks.
          </p>
          
          <ul className="mt-3 space-y-2 text-sm text-white/70 relative z-10">
            <li className="flex items-start">
              <div className="w-4 h-4 rounded-full bg-green-900/30 border border-green-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-green-400 text-[10px]">✓</span>
              </div>
              <span>Divide bankroll into 20+ units</span>
            </li>
            <li className="flex items-start">
              <div className="w-4 h-4 rounded-full bg-green-900/30 border border-green-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-green-400 text-[10px]">✓</span>
              </div>
              <span>Take regular profits off the table</span>
            </li>
          </ul>
        </motion.div>
      </div>

      <AnimatePresence>
        {isStatsExpanded && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-purple-900/20 to-purple-800/5 rounded-xl p-5 border border-purple-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
                <div className="p-2 bg-gradient-to-br from-purple-700/40 to-purple-900/20 rounded-full mr-3 border border-purple-700/30 shadow-inner">
                  <FaChartLine className="text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Advanced Pattern Play
                </span>
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full border border-blue-800/30">Pro Tip</span>
              </h4>
              <p className="text-white/80 text-sm font-sans relative z-10">
                While mines are placed randomly, some players develop personal systems like "edge-first" 
                or "center-out" strategies. Remember that each reveal is statistically independent.
              </p>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-black/30 rounded-lg p-3 border border-purple-800/20">
                  <h5 className="text-sm font-medium text-white/90 mb-1.5 flex items-center">
                    <span className="w-5 h-5 rounded-full bg-purple-900/50 text-purple-300 text-xs flex items-center justify-center mr-1.5">1</span>
                    Edge-first
                  </h5>
                  <p className="text-xs text-white/70">Reveal tiles along the edges first</p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-3 border border-purple-800/20">
                  <h5 className="text-sm font-medium text-white/90 mb-1.5 flex items-center">
                    <span className="w-5 h-5 rounded-full bg-purple-900/50 text-purple-300 text-xs flex items-center justify-center mr-1.5">2</span>
                    Center-out
                  </h5>
                  <p className="text-xs text-white/70">Start from center and work outward</p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-3 border border-purple-800/20">
                  <h5 className="text-sm font-medium text-white/90 mb-1.5 flex items-center">
                    <span className="w-5 h-5 rounded-full bg-purple-900/50 text-purple-300 text-xs flex items-center justify-center mr-1.5">3</span>
                    Diagonal
                  </h5>
                  <p className="text-xs text-white/70">Reveal tiles in diagonal patterns</p>
                </div>
              </div>
              
              <div className="mt-4 bg-black/20 p-3 rounded-lg border border-purple-800/20 text-xs text-white/70">
                <div className="flex items-start">
                  <FaInfoCircle className="text-purple-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p>Remember that each mine placement is random and independent of previous games. Pattern play is purely psychological, not mathematical.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-red-900/20 to-red-800/5 rounded-xl p-5 border border-red-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-red-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
                <div className="p-2 bg-gradient-to-br from-red-700/40 to-red-900/20 rounded-full mr-3 border border-red-700/30 shadow-inner">
                  <FaTrophy className="text-yellow-500" />
                </div>
                <span className="bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                  High-Risk Strategies
                </span>
                <span className="ml-2 text-xs px-2 py-0.5 bg-red-900/30 text-red-300 rounded-full border border-red-800/30">Expert</span>
              </h4>
              <p className="text-white/80 text-sm font-sans relative z-10">
                For those seeking the biggest wins, playing with 10+ mines can offer enormous 
                multipliers. Be aware that these strategies have a high failure rate.
              </p>
              
              <div className="mt-4 bg-black/30 rounded-lg p-4 border border-red-800/20 backdrop-blur-sm">
                <h5 className="text-sm font-medium text-white/90 mb-2 flex items-center">
                  <FaBomb className="text-red-400 mr-2" /> High-Risk Setups
                </h5>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/50 border-b border-red-900/30">
                      <th className="text-left py-2 px-2">Mines</th>
                      <th className="text-left py-2 px-2">Safe Reveals</th>
                      <th className="text-right py-2 px-2">Multiplier</th>
                      <th className="text-right py-2 px-2">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    <tr className="border-b border-red-900/20">
                      <td className="py-2 px-2 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-red-900/30 border border-red-800/30 flex items-center justify-center mr-2 text-xs">10</span>
                      </td>
                      <td className="py-2 px-2">10</td>
                      <td className="text-right py-2 px-2 text-yellow-400 font-medium">71.33x</td>
                      <td className="text-right py-2 px-2 text-red-400">18.4%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-red-900/30 border border-red-800/30 flex items-center justify-center mr-2 text-xs">15</span>
                      </td>
                      <td className="py-2 px-2">5</td>
                      <td className="text-right py-2 px-2 text-yellow-400 font-medium">23.8x</td>
                      <td className="text-right py-2 px-2 text-red-400">12.6%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center mt-4 p-3 bg-black/20 rounded-lg border border-red-800/20">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-700/40 to-red-900/20 flex items-center justify-center mr-3 border border-red-800/30">
                  <FaInfoCircle className="text-red-400" />
                </div>
                <p className="text-xs text-white/70">
                  <span className="text-red-400 font-medium">Warning:</span> High-risk strategies can result in rapid bankroll depletion. Only use with money you can afford to lose.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      

    </motion.div>
  );
};

export default MinesStrategyGuide; 