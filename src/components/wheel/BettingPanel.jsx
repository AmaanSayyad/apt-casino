"use client";

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import PlayChainIcon from "@/components/play/PlayChainIcon";
import { usePlayCurrency } from "@/hooks/usePlayCurrency";
import { formatNativeAmount } from "@/lib/chains/registry";
import {
  DEFAULT_GAME_BET,
  getGameBetPreferenceString,
  setGameBetPreference,
} from "@/lib/client/gameBetPreference";

const GAME = "wheel";

const SEGMENT_OPTIONS = [10, 20, 30, 40, 50];
const RISK_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const QUICK_BET_PRESETS = [0.1, 0.5, 1, 5, 10];

function SelectChevron() {
  return (
    <svg className="h-4 w-4 text-white/40" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StrategyControl({ label, mode, onModeChange, percent, onPercentChange }) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-white/70">{label}</span>
      <div className="flex gap-1.5 p-1 rounded-lg bg-[#120521] border border-[#333947]/80">
        <button
          type="button"
          onClick={() => onModeChange("reset")}
          className={cn(
            "flex-1 rounded-md py-2 text-xs font-medium transition-all",
            mode === "reset"
              ? "bg-gradient-to-r from-[#F1324D]/90 to-[#2414E3]/90 text-white shadow-sm"
              : "text-white/45 hover:text-white/70",
          )}
        >
          Reset bet
        </button>
        <button
          type="button"
          onClick={() => onModeChange("increase")}
          className={cn(
            "flex-1 rounded-md py-2 text-xs font-medium transition-all",
            mode === "increase"
              ? "bg-gradient-to-r from-[#F1324D]/90 to-[#2414E3]/90 text-white shadow-sm"
              : "text-white/45 hover:text-white/70",
          )}
        >
          Increase
        </button>
      </div>
      {mode === "increase" && (
        <div className="flex items-center gap-2 rounded-lg border border-[#333947]/80 bg-[#120521] px-3 py-2.5">
          <span className="text-xs text-white/45 shrink-0">By</span>
          <input
            type="number"
            min="0"
            max="1000"
            step="1"
            value={percent}
            onChange={(e) => onPercentChange(e.target.value)}
            className="w-full bg-transparent text-sm text-white outline-none tabular-nums"
            placeholder="0"
          />
          <span className="text-xs text-white/45 shrink-0">%</span>
        </div>
      )}
    </div>
  );
}

const BettingPanel = ({
  betAmount,
  setBetAmount,
  balance,
  symbol: symbolProp,
  gameMode,
  setGameMode,
  risk,
  setRisk,
  noOfSegments,
  setSegments,
  manulBet,
  autoBet,
  isSpinning,
}) => {
  const { symbol: symFromHook, chain } = usePlayCurrency();
  const symbol = symbolProp ?? symFromHook;

  const [inputValue, setInputValue] = useState(String(DEFAULT_GAME_BET));
  const [mounted, setMounted] = useState(false);

  const [numberOfBets, setNumberOfBets] = useState(10);
  const [winMode, setWinMode] = useState("reset");
  const [lossMode, setLossMode] = useState("reset");
  const [winIncrease, setWinIncrease] = useState("0");
  const [lossIncrease, setLossIncrease] = useState("0");
  const [stopProfit, setStopProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const quickBets = QUICK_BET_PRESETS;
  const step = chain === "solana" ? "0.000001" : "0.0001";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saved = getGameBetPreferenceString(GAME, chain);
    setInputValue(saved);
    setBetAmount(parseFloat(saved) || DEFAULT_GAME_BET);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once per chain
  }, [mounted, chain]);

  const formatBalance = (decimals = 4) =>
    mounted ? Number(balance).toFixed(decimals) : (0).toFixed(decimals);

  const applyBet = (next, { persist = true } = {}) => {
    if (typeof next === "number") {
      const formatted = formatNativeAmount(next, chain);
      setInputValue(formatted);
      setBetAmount(next);
      if (persist && next > 0) setGameBetPreference(GAME, chain, formatted);
      return;
    }
    setInputValue(next);
    const num = parseFloat(next) || 0;
    setBetAmount(num);
    if (persist && num > 0) setGameBetPreference(GAME, chain, next);
  };

  const handleInputChange = (e) => {
    applyBet(e.target.value, { persist: false });
  };

  const handleInputBlur = () => {
    const num = parseFloat(inputValue) || 0;
    if (num > 0) applyBet(num);
  };

  const handleMultiplier = (multiplier) => {
    const current = parseFloat(inputValue) || DEFAULT_GAME_BET;
    applyBet(Math.min(balance, Math.max(0, current * multiplier)));
  };

  const parsedBet = parseFloat(inputValue) || 0;
  const canBet = parsedBet > 0 && parsedBet <= balance && !isSpinning;

  const handleSubmit = () => {
    if (!canBet) return;

    if (gameMode === "auto") {
      autoBet({
        numberOfBets,
        winIncrease: winMode === "increase" ? Number(winIncrease) / 100 : 0,
        lossIncrease: lossMode === "increase" ? Number(lossIncrease) / 100 : 0,
        stopProfit: parseFloat(stopProfit) || 0,
        stopLoss: parseFloat(stopLoss) || 0,
        betAmount: parsedBet,
        risk,
        noOfSegments,
      });
    } else {
      manulBet();
    }
  };

  const buttonLabel = isSpinning
    ? gameMode === "auto"
      ? "Auto spinning…"
      : "Spinning…"
    : gameMode === "auto"
      ? "Start Autobet"
      : "Start Bet";

  return (
    <div className="flex h-full flex-col rounded-3xl border border-[#333947]/80 bg-gradient-to-b from-[#290023] to-[#150012] p-4 shadow-xl shadow-black/30">
      {/* Mode tabs */}
      <div className="mb-5 flex rounded-xl border border-[#333947]/60 bg-[#120521] p-1">
        {["manual", "auto"].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setGameMode(mode)}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium capitalize transition-all",
              gameMode === mode
                ? "bg-gradient-to-r from-[#F1324D] to-[#2414E3] text-white shadow-md"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {/* Bet amount */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-white">Bet amount</label>
            <span className="text-[11px] text-white/45 tabular-nums" suppressHydrationWarning>
              {formatBalance(4)} {symbol}
            </span>
          </div>

          <div className="flex overflow-hidden rounded-xl border border-[#333947]/80">
            <div className="flex flex-[3] items-center gap-2 bg-[#120521] px-3 py-2.5">
              <input
                type="number"
                step={step}
                min="0"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={isSpinning}
                className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/25 disabled:opacity-50 tabular-nums"
                placeholder={String(DEFAULT_GAME_BET)}
              />
              <PlayChainIcon chain={chain} size={18} className="shrink-0 opacity-90" />
            </div>
            <div className="flex flex-[2]">
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => handleMultiplier(0.5)}
                className="flex-1 border-l border-[#333947]/80 bg-[#420039] text-xs text-white transition-colors hover:bg-[#520049] disabled:opacity-50"
              >
                ½
              </button>
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => handleMultiplier(2)}
                className="flex-1 border-l border-[#333947]/80 bg-[#420039] text-xs text-white transition-colors hover:bg-[#520049] disabled:opacity-50"
              >
                2×
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-5 gap-1">
            {quickBets.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={isSpinning}
                onClick={() => applyBet(preset)}
                className={cn(
                  "rounded-lg border py-1.5 text-[10px] font-medium transition-colors disabled:opacity-50",
                  Math.abs(parsedBet - preset) < 0.0000001
                    ? "border-purple-400/50 bg-purple-600/25 text-white"
                    : "border-[#333947]/50 bg-[#120521] text-white/60 hover:border-purple-500/30 hover:text-white",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Risk */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white">Risk</label>
          <div className="grid grid-cols-3 gap-1.5">
            {RISK_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                disabled={isSpinning}
                onClick={() => setRisk(id)}
                className={cn(
                  "rounded-lg border py-2.5 text-xs font-medium transition-all disabled:opacity-50",
                  risk === id
                    ? "border-purple-400/60 bg-purple-600/20 text-white"
                    : "border-[#333947]/60 bg-[#120521] text-white/50 hover:border-purple-500/30 hover:text-white/80",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Segments */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white">Segments</label>
          <div className="relative">
            <select
              value={noOfSegments}
              disabled={isSpinning}
              onChange={(e) => setSegments(parseInt(e.target.value, 10))}
              className="w-full appearance-none rounded-xl border border-[#333947]/80 bg-[#120521] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/40 disabled:opacity-50"
            >
              {SEGMENT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} segments
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <SelectChevron />
            </div>
          </div>
        </div>

        {/* Auto settings */}
        {gameMode === "auto" && (
          <div className="space-y-4 rounded-xl border border-[#333947]/50 bg-[#120521]/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">
              Auto session
            </p>

            <div>
              <label className="mb-2 block text-xs font-medium text-white/70">
                Number of bets
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={numberOfBets}
                disabled={isSpinning}
                onChange={(e) => setNumberOfBets(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-lg border border-[#333947]/80 bg-[#0A0009] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/40 disabled:opacity-50 tabular-nums"
              />
            </div>

            <StrategyControl
              label="On win"
              mode={winMode}
              onModeChange={setWinMode}
              percent={winIncrease}
              onPercentChange={setWinIncrease}
            />

            <StrategyControl
              label="On loss"
              mode={lossMode}
              onModeChange={setLossMode}
              percent={lossIncrease}
              onPercentChange={setLossIncrease}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Stop on profit
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-[#333947]/80 bg-[#0A0009] px-3 py-2.5">
                  <input
                    type="number"
                    min="0"
                    step={step}
                    value={stopProfit}
                    disabled={isSpinning}
                    onChange={(e) => setStopProfit(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-50 tabular-nums"
                  />
                  <span className="text-[10px] text-white/40 shrink-0">{symbol}</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Stop on loss
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-[#333947]/80 bg-[#0A0009] px-3 py-2.5">
                  <input
                    type="number"
                    min="0"
                    step={step}
                    value={stopLoss}
                    disabled={isSpinning}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-50 tabular-nums"
                  />
                  <span className="text-[10px] text-white/40 shrink-0">{symbol}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-white/35">
              Leave stop fields at 0 to disable. Profit/loss limits use session net P&amp;L in{" "}
              {symbol}.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-4 space-y-2">
        {!canBet && !isSpinning && parsedBet > balance && (
          <p className="text-center text-[11px] text-red-400/90">Insufficient balance</p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canBet}
          className={cn(
            "w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all",
            canBet
              ? "bg-gradient-to-r from-[#F1324D] to-[#2414E3] text-white shadow-lg shadow-purple-900/30 hover:brightness-110 active:scale-[0.99]"
              : "cursor-not-allowed bg-[#333947]/40 text-white/30",
          )}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default BettingPanel;
