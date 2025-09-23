'use client';

import React, { useState } from 'react';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCog, FaRobot, FaBrain, FaBolt, FaShieldAlt, FaBalanceScale, FaChartLine, FaRegLightbulb } from 'react-icons/fa';

const AISettingsModal = ({ isOpen, onClose, onSave, currentSettings }) => {
  const { symbol } = usePlayCurrency();
  const [settings, setSettings] = useState(currentSettings || {
    strategy: 'balanced',
    maxBet: 1,
    stopLoss: 5,
    targetProfit: 5,
    riskFactors: {
      adaptToHistory: true,
      maxConsecutiveLosses: 3,
      increaseOnWin: false,
      decreaseOnLoss: true
    },
    tiles: {
      min: 3,
      max: 8
    },
    mines: {
      min: 3,
      max: 10
    }
  });

  const handleStrategyChange = (strategy) => {
    let newSettings = { ...settings, strategy };
    
    // Apply presets based on strategy
    if (strategy === 'conservative') {
      newSettings = {
        ...newSettings,
        tiles: { min: 2, max: 5 },
        mines: { min: 1, max: 5 },
        riskFactors: {
          ...newSettings.riskFactors,
          maxConsecutiveLosses: 2,
          increaseOnWin: false,
          decreaseOnLoss: true
        }
      };
    } else if (strategy === 'aggressive') {
      newSettings = {
        ...newSettings,
        tiles: { min: 5, max: 12 },
        mines: { min: 5, max: 15 },
        riskFactors: {
          ...newSettings.riskFactors,
          maxConsecutiveLosses: 5,
          increaseOnWin: true,
          decreaseOnLoss: false
        }
      };
    } else { // balanced
      newSettings = {
        ...newSettings,
        tiles: { min: 3, max: 8 },
        mines: { min: 3, max: 10 },
        riskFactors: {
          ...newSettings.riskFactors,
          maxConsecutiveLosses: 3,
          increaseOnWin: false,
          decreaseOnLoss: true
        }
      };
    }
    
    setSettings(newSettings);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : Number(value)
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : Number(value)
      }));
    }
  };

  const handleToggleChange = (path) => {
    if (path.includes('.')) {
      const [section, field] = path.split('.');
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: !prev[section][field]
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [path]: !prev[path]
      }));
    }
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const getStrategyIcon = (strategy) => {
    switch (strategy) {
      case 'conservative':
        return <FaShieldAlt />;
      case 'aggressive':
        return <FaBolt />;
      default:
        return <FaBalanceScale />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-gradient-to-br from-[#180028]/95 to-[#000]/95 rounded-xl shadow-2xl border-2 border-purple-800/30 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/30 p-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-2 bg-purple-900/50 rounded-full mr-3 border border-purple-700/30">
                <FaRobot className="text-purple-300 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-white">AI Agent Settings</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-purple-800/30 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* AI Strategy Section */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <FaBrain className="mr-2 text-purple-400" />
                AI Strategy
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleStrategyChange('conservative')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl ${
                    settings.strategy === 'conservative'
                      ? 'bg-green-900/40 border-2 border-green-700/50'
                      : 'bg-black/30 border-2 border-gray-800/30 hover:bg-black/40'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-2 ${
                    settings.strategy === 'conservative'
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-black/30 text-gray-400'
                  }`}>
                    <FaShieldAlt className="text-xl" />
                  </div>
                  <span className={`font-medium ${
                    settings.strategy === 'conservative' ? 'text-green-300' : 'text-white/70'
                  }`}>Conservative</span>
                  <span className="text-xs mt-1 text-white/50">Lower risk</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleStrategyChange('balanced')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl ${
                    settings.strategy === 'balanced'
                      ? 'bg-blue-900/40 border-2 border-blue-700/50'
                      : 'bg-black/30 border-2 border-gray-800/30 hover:bg-black/40'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-2 ${
                    settings.strategy === 'balanced'
                      ? 'bg-blue-900/50 text-blue-400'
                      : 'bg-black/30 text-gray-400'
                  }`}>
                    <FaBalanceScale className="text-xl" />
                  </div>
                  <span className={`font-medium ${
                    settings.strategy === 'balanced' ? 'text-blue-300' : 'text-white/70'
                  }`}>Balanced</span>
                  <span className="text-xs mt-1 text-white/50">Moderate risk</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleStrategyChange('aggressive')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl ${
                    settings.strategy === 'aggressive'
                      ? 'bg-red-900/40 border-2 border-red-700/50'
                      : 'bg-black/30 border-2 border-gray-800/30 hover:bg-black/40'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-2 ${
                    settings.strategy === 'aggressive'
                      ? 'bg-red-900/50 text-red-400'
                      : 'bg-black/30 text-gray-400'
                  }`}>
                    <FaBolt className="text-xl" />
                  </div>
                  <span className={`font-medium ${
                    settings.strategy === 'aggressive' ? 'text-red-300' : 'text-white/70'
                  }`}>Aggressive</span>
                  <span className="text-xs mt-1 text-white/50">Higher risk</span>
                </button>
              </div>
              
              <div className="mt-4 bg-black/30 p-3 rounded-lg border border-purple-800/30">
                <div className="flex items-start">
                  <FaRegLightbulb className="text-yellow-400 mt-1 mr-2 flex-shrink-0" />
                  <p className="text-sm text-white/70">
                    <span className="text-white font-medium">Strategy info: </span>
                    {settings.strategy === 'conservative'
                      ? 'Prioritizes preserving your balance. Takes smaller risks with frequent cashouts.'
                      : settings.strategy === 'aggressive'
                        ? 'Aims for maximum returns by taking higher risks. More volatility, bigger potential wins.'
                        : 'Balanced approach between risk and reward. Good for consistent results.'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Game Parameters */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <FaCog className="mr-2 text-purple-400" />
                Game Parameters
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded-lg border border-purple-800/30">
                  <h4 className="text-sm font-medium text-white/90 mb-3">Bet Limits</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/70 block mb-1">Maximum Bet ({symbol})</label>
                      <input
                        type="number"
                        name="maxBet"
                        value={settings.maxBet}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-purple-800/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-white/70 block mb-1">Stop Loss ({symbol})</label>
                      <input
                        type="number"
                        name="stopLoss"
                        value={settings.stopLoss}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-purple-800/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-white/70 block mb-1">Target Profit ({symbol})</label>
                      <input
                        type="number"
                        name="targetProfit"
                        value={settings.targetProfit}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-purple-800/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-black/30 p-4 rounded-lg border border-purple-800/30">
                    <h4 className="text-sm font-medium text-white/90 mb-2">Tiles to Reveal</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/70 block mb-1">Minimum</label>
                        <input
                          type="number"
                          name="tiles.min"
                          value={settings.tiles.min}
                          onChange={handleInputChange}
                          min="1"
                          max="15"
                          className="w-full bg-black/50 border border-purple-800/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/70 block mb-1">Maximum</label>
                        <input
                          type="number"
                          name="tiles.max"
                          value={settings.tiles.max}
                          onChange={handleInputChange}
                          min="1"
                          max="15"
                          className="w-full bg-black/50 border border-purple-800/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-lg border border-purple-800/30">
                    <h4 className="text-sm font-medium text-white/90 mb-2">Mines Selection</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/70 block mb-1">Minimum</label>
                        <input
                          type="number"
                          name="mines.min"
                          value={settings.mines.min}
                          onChange={handleInputChange}
                          min="1"
                          max="24"
                          className="w-full bg-black/50 border border-purple-800/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/70 block mb-1">Maximum</label>
                        <input
                          type="number"
                          name="mines.max"
                          value={settings.mines.max}
                          onChange={handleInputChange}
                          min="1"
                          max="24"
                          className="w-full bg-black/50 border border-purple-800/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Risk Management */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <FaChartLine className="mr-2 text-purple-400" />
                Risk Management
              </h3>
              
              <div className="bg-black/30 p-4 rounded-lg border border-purple-800/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white/90">Adapt to betting history</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('riskFactors.adaptToHistory')}
                      className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors ${
                        settings.riskFactors.adaptToHistory ? 'bg-purple-600' : 'bg-gray-700'
                      }`}
                    >
                      <span className={`inline-block w-3.5 h-3.5 transform transition-transform bg-white rounded-full ${
                        settings.riskFactors.adaptToHistory ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white/90">Increase bet on win</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('riskFactors.increaseOnWin')}
                      className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors ${
                        settings.riskFactors.increaseOnWin ? 'bg-purple-600' : 'bg-gray-700'
                      }`}
                    >
                      <span className={`inline-block w-3.5 h-3.5 transform transition-transform bg-white rounded-full ${
                        settings.riskFactors.increaseOnWin ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white/90">Decrease bet on loss</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('riskFactors.decreaseOnLoss')}
                      className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors ${
                        settings.riskFactors.decreaseOnLoss ? 'bg-purple-600' : 'bg-gray-700'
                      }`}
                    >
                      <span className={`inline-block w-3.5 h-3.5 transform transition-transform bg-white rounded-full ${
                        settings.riskFactors.decreaseOnLoss ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-xs text-white/70 block mb-1">Max consecutive losses before strategy change</label>
                    <input
                      type="number"
                      name="riskFactors.maxConsecutiveLosses"
                      value={settings.riskFactors.maxConsecutiveLosses}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="w-full bg-black/50 border border-purple-800/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-purple-900/30 p-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-purple-800/30 text-white/80 hover:text-white hover:bg-purple-900/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AISettingsModal; 