"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { usePlayCurrency } from '@/hooks/usePlayCurrency';
import PlayChainIcon from '@/components/play/PlayChainIcon';
import { formatNativeAmount } from '@/lib/chains/registry';
import {
  DEFAULT_PLINKO_BET,
  getPlinkoBetPreference,
  setPlinkoBetPreference,
} from '@/lib/client/plinkoBetPreference';
import { QUICK_BET_PRESETS } from '@/lib/client/gameBetPreference';

export default function GameControls({ onBet, onRowChange, onRiskLevelChange, onBetAmountChange, initialRows = 16, initialRiskLevel = "High" }) {
  const { balanceNative, symbol, chain, toRaw } = usePlayCurrency();
  
  const [gameMode, setGameMode] = useState("manual");
  const [betAmount, setBetAmount] = useState(String(DEFAULT_PLINKO_BET));
  const [numberOfBets, setNumberOfBets] = useState("1");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [riskLevel, setRiskLevel] = useState(initialRiskLevel);
  const [rows, setRows] = useState(initialRows);
  const [showRiskDropdown, setShowRiskDropdown] = useState(false);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const autoBetIntervalRef = useRef(null);
  const isAutoPlayingRef = useRef(false);

  const riskLevels = ["Low", "Medium", "High"];
  const rowOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16];

  // Wallet balance + saved bet load client-side only — avoid SSR/client text mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saved = getPlinkoBetPreference(chain);
    setBetAmount(saved);
    const num = parseFloat(saved) || DEFAULT_PLINKO_BET;
    onBetAmountChange?.(num);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore saved bet once per chain
  }, [mounted, chain]);

  // Update local state when props change
  useEffect(() => {
    setRiskLevel(initialRiskLevel);
    setRows(initialRows);
  }, [initialRiskLevel, initialRows]);

  const clearAutoBetInterval = () => {
    if (autoBetIntervalRef.current != null) {
      clearInterval(autoBetIntervalRef.current);
      autoBetIntervalRef.current = null;
    }
  };

  // Cleanup auto betting on unmount or when leaving auto mode
  useEffect(() => {
    if (gameMode !== "auto") {
      clearAutoBetInterval();
      isAutoPlayingRef.current = false;
      setIsAutoPlaying(false);
    }
    return () => {
      clearAutoBetInterval();
      isAutoPlayingRef.current = false;
    };
  }, [gameMode]);

  const formatBalance = (decimals = 4) =>
    mounted ? balanceNative.toFixed(decimals) : (0).toFixed(decimals);

  const applyBetAmount = (value, { persist = true } = {}) => {
    if (typeof value === 'string') {
      setBetAmount(value);
      const numValue = parseFloat(value) || 0;
      if (numValue > 0 && persist) setPlinkoBetPreference(chain, value);
      onBetAmountChange?.(numValue);
      return;
    }

    const numValue = parseFloat(value) || 0;
    const display = formatNativeAmount(numValue, chain);
    setBetAmount(display);
    if (numValue > 0 && persist) setPlinkoBetPreference(chain, display);
    onBetAmountChange?.(numValue);
  };

  const handleBetAmountChange = (value) => {
    applyBetAmount(value);
  };

  const handleHalfBet = () => {
    const currentBet = parseFloat(betAmount) || DEFAULT_PLINKO_BET;
    applyBetAmount((currentBet / 2).toFixed(4).replace(/\.?0+$/, '') || String(DEFAULT_PLINKO_BET));
  };

  const handleDoubleBet = () => {
    const currentBet = parseFloat(betAmount) || DEFAULT_PLINKO_BET;
    applyBetAmount((currentBet * 2).toFixed(4).replace(/\.?0+$/, '') || String(DEFAULT_PLINKO_BET));
  };

  const handleBet = () => {
    const betValue = parseFloat(betAmount);
    const currentBalanceAPT = balanceNative;
    
    if (betValue <= 0) {
      alert("Please enter a valid bet amount");
      return;
    }
    
    if (betValue > currentBalanceAPT) {
      alert(`Insufficient balance! You have ${currentBalanceAPT.toFixed(3)} ${symbol} but need ${betValue} ${symbol}`);
      return;
    }
    
    setPlinkoBetPreference(chain, betAmount);
    onBetAmountChange?.(betValue);

    if (gameMode === "auto") {
      startAutoBetting();
    } else if (onBet) {
      onBet(betValue);
    }
  };

  const startAutoBetting = () => {
    // Re-entry guard — never stack concurrent bet loops
    if (isAutoPlayingRef.current || autoBetIntervalRef.current != null) {
      return;
    }

    const totalBets = parseInt(numberOfBets) || 1;
    let currentBet = 0;
    
    const totalBetAmount = totalBets * parseFloat(betAmount);
    const totalBetAmountInReduxUnit = toRaw(totalBetAmount);
    const currentBalance = toRaw(balanceNative);
    
    if (totalBetAmountInReduxUnit > currentBalance) {
      alert(`Insufficient balance for ${totalBets} bets of ${betAmount} ${symbol} each. You need ${totalBetAmount.toFixed(3)} ${symbol} but have ${balanceNative.toFixed(3)} ${symbol}`);
      return;
    }

    clearAutoBetInterval();
    isAutoPlayingRef.current = true;
    setIsAutoPlaying(true);
    
    // Start first bet immediately
    if (onBet) {
      onBetAmountChange?.(parseFloat(betAmount));
      onBet(parseFloat(betAmount));
      currentBet++;
      setNumberOfBets((totalBets - currentBet).toString());
    }
    
    // Then continue with interval - 0.3 seconds between bets
    const interval = setInterval(() => {
      if (!isAutoPlayingRef.current) {
        clearInterval(interval);
        if (autoBetIntervalRef.current === interval) autoBetIntervalRef.current = null;
        return;
      }

      if (currentBet >= totalBets) {
        clearInterval(interval);
        if (autoBetIntervalRef.current === interval) autoBetIntervalRef.current = null;
        isAutoPlayingRef.current = false;
        setIsAutoPlaying(false);
        setNumberOfBets("1");
        return;
      }
      
      if (onBet) {
        onBetAmountChange?.(parseFloat(betAmount));
        onBet(parseFloat(betAmount));
        currentBet++;
        setNumberOfBets((totalBets - currentBet).toString());
      }
    }, 300);
    
    autoBetIntervalRef.current = interval;
  };

  const stopAutoBetting = () => {
    clearAutoBetInterval();
    isAutoPlayingRef.current = false;
    setIsAutoPlaying(false);
  };

  const handleRowChange = (newRows) => {
    setRows(newRows);
    setShowRowsDropdown(false);
    
    // Don't reset bet amount, keep it for consistency
    console.log('GameControls: Row changed, keeping bet amount:', betAmount);
    
    // Notify parent component about row change
    if (onRowChange) {
      onRowChange(newRows);
    }
  };

  const handleRiskLevelChange = (newRiskLevel) => {
    setRiskLevel(newRiskLevel);
    setShowRiskDropdown(false);
    
    // Don't reset bet amount, keep it for consistency
    console.log('GameControls: Risk level changed, keeping bet amount:', betAmount);
    
    // Notify parent component about risk level change
    if (onRiskLevelChange) {
      onRiskLevelChange(newRiskLevel);
    }
  };

  // Check if user has sufficient balance for current bet
  const hasSufficientBalance = () => {
    const betValue = parseFloat(betAmount);
    return betValue > 0 && betValue <= balanceNative;
  };

  const hasSufficientBalanceForAutoBet = () => {
    const betValue = parseFloat(betAmount);
    const totalBets = parseInt(numberOfBets) || 1;
    const totalBetAmount = totalBets * betValue;
    return totalBetAmount <= balanceNative && betValue > 0;
  };

  const getCurrentBalanceDisplay = () => formatBalance();

  return (
    <div className="bg-[#1A0015] rounded-xl border border-[#333947] p-6">
      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex bg-[#2A0025] rounded-lg p-1">
          <button
            onClick={() => setGameMode("manual")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              gameMode === "manual"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setGameMode("auto")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              gameMode === "auto"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Auto
          </button>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-300">
            Bet Amount ({symbol})
          </label>
          <span className="text-sm text-white/70 tabular-nums" suppressHydrationWarning>
            {formatBalance()} {symbol}
          </span>
        </div>
        <div className="flex gap-0">
          <div className="flex items-center flex-[3] bg-[#2A0025] border border-[#333947] rounded-l-lg px-3 py-3">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => handleBetAmountChange(e.target.value)}
              onBlur={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                if (numValue > 0) applyBetAmount(numValue);
              }}
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
              placeholder="0.1"
              step={chain === 'solana' ? '0.000001' : '0.0001'}
              min="0"
            />
            <PlayChainIcon chain={chain} size={20} className="ml-2 shrink-0" />
          </div>
          <div className="flex flex-[2]">
            <button
              type="button"
              onClick={handleHalfBet}
              className="flex-1 bg-[#420039] border border-[#333947] border-l-0 text-sm text-white hover:bg-[#520049] transition-colors"
            >
              1/2
            </button>
            <button
              type="button"
              onClick={handleDoubleBet}
              className="flex-1 bg-[#420039] border border-[#333947] border-l-0 rounded-r-lg text-sm text-white hover:bg-[#520049] transition-colors"
            >
              2x
            </button>
          </div>
        </div>
        {/* Quick Bet Amounts */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {QUICK_BET_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleBetAmountChange(preset)}
              className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
            >
              {preset} {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Number of Bets - Only show in Auto mode */}
      {gameMode === "auto" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {isAutoPlaying ? 'Remaining Bets' : 'Number of Bets'}
          </label>
          <input
            type="number"
            value={numberOfBets}
            onChange={(e) => setNumberOfBets(e.target.value)}
            className={`w-full border border-[#333947] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
              isAutoPlaying ? 'bg-[#1A0015] cursor-not-allowed' : 'bg-[#2A0025]'
            }`}
            placeholder="1"
            step="1"
            min="1"
            max="100"
            readOnly={isAutoPlaying}
          />
          <div className="text-xs text-gray-400 mt-1">
            How many bets to place automatically
          </div>
        </div>
      )}

      {/* Risk Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Risk
        </label>
        <div className="relative">
          <button
            onClick={() => setShowRiskDropdown(!showRiskDropdown)}
            className="w-full bg-[#2A0025] border border-[#333947] rounded-lg px-4 py-3 text-white text-left flex items-center justify-between hover:bg-[#3A0035] transition-colors"
          >
            <span>{riskLevel}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showRiskDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A0025] border border-[#333947] rounded-lg overflow-hidden z-10">
              {riskLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleRiskLevelChange(level)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#3A0035] transition-colors"
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Rows (8-16)
        </label>
        <div className="relative">
          <button
            onClick={() => setShowRowsDropdown(!showRowsDropdown)}
            className="w-full bg-[#2A0025] border border-[#333947] rounded-lg px-4 py-3 text-white text-left flex items-center justify-between hover:bg-[#3A0035] transition-colors"
          >
            <span>{rows}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showRowsDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A0025] border border-[#333947] rounded-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
              {rowOptions.map((row) => (
                <button
                  key={row}
                  onClick={() => handleRowChange(row)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#3A0035] transition-colors"
                >
                  {row}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          More rows = more complex gameplay
        </div>
      </div>

      {/* Bet Button */}
      {gameMode === "auto" && isAutoPlaying ? (
        <button 
          onClick={stopAutoBetting}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-4 px-6 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
        >
          Stop
        </button>
      ) : (
        <div className="space-y-3">
          {/* Current Balance Display */}
          <div className="text-center p-3 bg-[#2A0025] rounded-lg border border-[#333947]">
            <span className="text-sm text-gray-400">Current Balance:</span>
            <div className="text-lg font-bold text-green-400" suppressHydrationWarning>
              {getCurrentBalanceDisplay()} {symbol}
            </div>
          </div>
          
          {/* Bet Button */}
          <button 
            onClick={gameMode === "auto" ? startAutoBetting : handleBet}
            disabled={gameMode === "auto" ? !hasSufficientBalanceForAutoBet() : !hasSufficientBalance()}
            className={`w-full font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 ${
              (gameMode === "auto" ? hasSufficientBalanceForAutoBet() : hasSufficientBalance())
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {gameMode === "auto" ? "Start Auto Betting" : "Bet"}
          </button>
          
          {/* Insufficient Balance Warning */}
          {((gameMode === "auto" && !hasSufficientBalanceForAutoBet()) || (gameMode !== "auto" && !hasSufficientBalance())) && parseFloat(betAmount) > 0 && (
            <div className="text-center text-red-400 text-sm">
              {gameMode === "auto" 
                ? `Insufficient balance for ${numberOfBets} bets of ${betAmount} ${symbol} each` 
                : `Insufficient balance for ${betAmount} ${symbol} bet`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
