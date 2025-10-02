"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPercentage, FaBomb, FaInfoCircle, FaChartLine, FaDice, FaQuestion } from "react-icons/fa";
import { GiCardRandom, GiMineExplosion, GiTreasureMap, GiDiamonds } from "react-icons/gi";
import { HiLightningBolt, HiOutlineChartBar } from "react-icons/hi";

const MinesProbability = ({ winProbabilities, gridSize = 5 }) => {
  const [expandedItem, setExpandedItem] = useState(null);
  
  // Calculate additional probabilities
  const enhancedProbabilities = useMemo(() => {
    return winProbabilities.map(item => {
      // Extract mine count from config string
      const mineCountMatch = item.config.match(/(\d+)\s+mine/);
      const mineCount = mineCountMatch ? parseInt(mineCountMatch[1]) : 0;
      
      // Calculate total tiles
      const totalTiles = gridSize * gridSize;
      
      // Calculate safe tiles
      const safeTiles = totalTiles - mineCount;
      
      // Calculate probability of hitting a mine on first click
      const firstClickMineProb = (mineCount / totalTiles) * 100;
      
      // Calculate expected value (simplified formula)
      const expectedValue = ((item.probability / 100) * 2) - 1;
      
      // Calculate theoretical max multiplier
      const maxMultiplier = safeTiles > 0 ? parseFloat((totalTiles / (totalTiles - mineCount - (safeTiles - 1))).toFixed(2)) : 0;
      
      return {
        ...item,
        mineCount,
        safeTiles,
        firstClickMineProb,
        expectedValue,
        maxMultiplier
      };
    });
  }, [winProbabilities, gridSize]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };
  
  const toggleExpand = (index) => {
    if (expandedItem === index) {
      setExpandedItem(null);
    } else {
      setExpandedItem(index);
    }
  };
  
  return (
    <div className="bg-gradient-to-b from-[#1A0015]/90 to-[#190020]/90 rounded-xl border-2 border-[#333947] p-5 mt-6 shadow-lg shadow-purple-900/5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center font-display">
          <HiOutlineChartBar className="mr-2 text-blue-400" /> Win Probabilities
        </h3>
        <div className="text-xs px-2 py-1 bg-gradient-to-r from-purple-900/50 to-blue-900/30 rounded-full text-white/80 border border-purple-800/30">
          <span className="font-display">25 total tiles</span>
        </div>
      </div>
      
      <p className="text-white/70 text-sm mb-4 font-sans">
        Your chance of winning depends on the number of mines and how many tiles you plan to reveal.
        The fewer mines you select, the higher your win probability but lower potential rewards.
      </p>
      
      {/* Probability Visualizations */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {enhancedProbabilities.map((item, index) => (
          <motion.div 
            key={index}
            variants={itemVariants}
            className={`bg-gradient-to-r border ${item.color} rounded-lg overflow-hidden shadow-md shadow-black/20`}
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div 
              className={`p-4 cursor-pointer`}
              onClick={() => toggleExpand(index)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full bg-black/30 mr-3 flex items-center justify-center w-10 h-10`}>
                    <FaBomb className={`
                      ${item.probability > 75 ? 'text-green-400' :
                      item.probability > 50 ? 'text-blue-400' :
                      item.probability > 25 ? 'text-yellow-400' : 'text-red-400'}
                    `} />
                  </div>
                  <div>
                    <p className="text-white font-medium font-display">{item.config}</p>
                    <div className="flex text-xs text-white/60 items-center mt-1 font-sans">
                      <GiDiamonds className="mr-1 text-blue-400" />
                      <span>{item.safeTiles} safe</span>
                      <span className="mx-1">•</span>
                      <FaBomb className="mr-1 text-red-400" />
                      <span>{item.mineCount} {item.mineCount === 1 ? 'mine' : 'mines'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center justify-end text-lg font-bold ${
                    item.probability > 75 ? 'text-green-400' :
                    item.probability > 50 ? 'text-blue-400' :
                    item.probability > 25 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {item.probability}%
                    <FaQuestion 
                      className="ml-2 text-white/40 hover:text-white/80 cursor-pointer text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(index);
                      }}
                    />
                  </div>
                  <p className="text-xs text-white/60 font-sans">Win chance</p>
                </div>
              </div>
              
              {/* Probability bar */}
              <div className="w-full bg-black/40 h-2.5 rounded-full mt-2 mb-1">
                <motion.div 
                  className={`h-2.5 rounded-full ${
                    item.probability > 75 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                    item.probability > 50 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                    item.probability > 25 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                    'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ width: '0%' }}
                  animate={{ width: `${item.probability}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                ></motion.div>
              </div>
            </div>
            
            {/* Expandable details */}
            <AnimatePresence>
              {expandedItem === index && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-white/10">
                    {/* Additional stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-black/30 rounded p-2.5">
                        <p className="text-white/60 mb-1 font-sans">First click risk</p>
                        <p className="text-white font-medium flex items-center">
                          <FaDice className="mr-1 text-purple-400" />
                          {item.firstClickMineProb.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-black/30 rounded p-2.5">
                        <p className="text-white/60 mb-1 font-sans">Expected value</p>
                        <p className={`font-medium flex items-center ${item.expectedValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <FaChartLine className="mr-1" />
                          {item.expectedValue.toFixed(2)}x
                        </p>
                      </div>
                      <div className="bg-black/30 rounded p-2.5">
                        <p className="text-white/60 mb-1 font-sans">Max multiplier</p>
                        <p className="text-yellow-400 font-medium flex items-center">
                          <HiLightningBolt className="mr-1" />
                          {item.maxMultiplier}x
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-black/20 mt-2 p-2.5 rounded text-xs text-white/70 font-sans">
                      <p className="flex items-center">
                        <GiTreasureMap className="text-yellow-400 mr-1.5" />
                        <span>
                          With {item.mineCount} mines, you have a {item.probability}% chance of avoiding all mines when revealing {Math.floor(item.safeTiles/2)} gems.
                        </span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Tips */}
      <div className="mt-5 flex items-start bg-gradient-to-r from-purple-900/20 to-blue-900/10 p-3 rounded-lg border border-purple-900/30">
        <FaInfoCircle className="mt-0.5 mr-2 text-purple-400 flex-shrink-0" />
        <div className="text-sm text-white/80 font-sans">
          <p className="mb-1"><strong className="font-display">Pro tip:</strong> Balance risk vs. reward based on your playing style.</p>
          <p>A positive expected value (EV) suggests favorable long-term returns, but remember that short-term variance can be significant.</p>
        </div>
      </div>
    </div>
  );
};

export default MinesProbability; 