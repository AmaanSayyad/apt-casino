import React from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaBomb, FaInfoCircle, FaArrowRight } from 'react-icons/fa';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';

const SimpleBetting = ({ onSubmit, initialSettings = {} }) => {
  const { symbol } = usePlayCurrency();
  const [betAmount, setBetAmount] = React.useState(initialSettings.betAmount || 50);
  const [minesCount, setMinesCount] = React.useState(initialSettings.mines || 5);
  
  const handleSubmit = () => {
    onSubmit({
      betAmount,
      mines: minesCount
    });
  };
  
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/10 p-4 rounded-xl border border-purple-800/30">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center font-display">
        <FaCoins className="mr-2 text-yellow-400" /> 
        Place Your Bet
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-white/70 text-sm mb-1 font-sans">Bet Amount</label>
          <div className="flex items-center">
            <div className="absolute left-3 text-purple-400">
              <FaCoins />
            </div>
            <select
              className="w-full bg-[#10000E] border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-white"
              onChange={(e) => setBetAmount(parseInt(e.target.value))}
              value={betAmount}
            >
              {[10, 25, 50, 100, 250, 500, 1000].map((amount) => (
                <option key={amount} value={amount}>{amount} {symbol}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="relative">
          <label className="block text-white/70 text-sm mb-1 font-sans">Mines Count</label>
          <div className="flex items-center">
            <div className="absolute left-3 text-purple-400">
              <FaBomb />
            </div>
            <select
              className="w-full bg-[#10000E] border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-white"
              onChange={(e) => setMinesCount(parseInt(e.target.value))}
              value={minesCount}
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((count) => (
                <option key={count} value={count}>{count} {count === 1 ? 'Mine' : 'Mines'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <motion.button
        onClick={handleSubmit}
        className="w-full py-3 mt-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>START GAME</span>
        <FaArrowRight />
      </motion.button>
      
      <div className="mt-4 text-sm text-white/80 flex items-start bg-black/20 p-3 rounded-lg">
        <FaInfoCircle className="text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <span className="font-medium">How to play:</span> Set your bet amount and number of mines, then click tiles to reveal gems. 
          Avoid bombs! Each safe tile increases your multiplier. Cash out anytime to secure your winnings.
        </div>
      </div>
    </div>
  );
};

export default SimpleBetting; 