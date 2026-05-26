'use client';

import React, { useEffect, useRef, useState } from 'react';
import PlayChainIcon from '@/components/play/PlayChainIcon';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';
import { formatNativeAmount } from '@/lib/chains/registry';
import {
  DEFAULT_GAME_BET,
  getGameBetPreferenceString,
  QUICK_BET_PRESETS,
  setGameBetPreference,
} from '@/lib/client/gameBetPreference';

const GAME = 'mines';

export default function MinesBetAmountField({
  value,
  onChange,
  disabled = false,
  label,
  quickPresets = QUICK_BET_PRESETS,
}) {
  const { symbol, chain, balanceNative } = usePlayCurrency();
  const [mounted, setMounted] = useState(false);
  const [display, setDisplay] = useState(String(DEFAULT_GAME_BET));
  const restoredRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saved = getGameBetPreferenceString(GAME, chain);
    restoredRef.current = true;
    setDisplay(saved);
    onChange({ target: { name: 'betAmount', value: saved } });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once per chain
  }, [mounted, chain]);

  useEffect(() => {
    if (!restoredRef.current) return;
    if (value === undefined || value === null) return;
    const next = String(value);
    if (next !== display) {
      setDisplay(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const applyBet = (next, { persist = true } = {}) => {
    if (typeof next === 'number') {
      const formatted = formatNativeAmount(next, chain);
      setDisplay(formatted);
      if (persist && next > 0) setGameBetPreference(GAME, chain, formatted);
      onChange({ target: { name: 'betAmount', value: formatted } });
      return;
    }

    const raw = String(next);
    setDisplay(raw);
    const num = parseFloat(raw);
    if (persist && Number.isFinite(num) && num > 0) {
      setGameBetPreference(GAME, chain, raw);
    }
    onChange({ target: { name: 'betAmount', value: raw } });
  };

  const handleBlur = () => {
    const num = parseFloat(display);
    if (Number.isFinite(num) && num > 0) {
      applyBet(num);
    } else {
      applyBet(DEFAULT_GAME_BET);
    }
  };

  const parsed = parseFloat(display) || 0;
  const step = chain === 'solana' ? '0.000001' : '0.0001';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="font-medium text-white text-sm">{label}</label>
        {mounted && (
          <span className="text-[11px] text-white/45 tabular-nums" suppressHydrationWarning>
            Balance {balanceNative.toFixed(4)} {symbol}
          </span>
        )}
      </div>

      <div className="flex gap-0">
        <div className="magic-gradient p-0.5 rounded-l-lg flex-[3]">
          <div className="flex items-center rounded-[7px] bg-gradient-to-br from-[#190026]/95 to-[#0D0015]/95 px-3 py-2.5">
            <input
              type="number"
              name="betAmount"
              value={display}
              disabled={disabled}
              onChange={(e) => applyBet(e.target.value, { persist: false })}
              onBlur={handleBlur}
              className="w-full bg-transparent text-white text-sm font-medium placeholder-white/30 focus:outline-none disabled:opacity-50"
              placeholder={String(DEFAULT_GAME_BET)}
              step={step}
              min="0"
            />
            <PlayChainIcon chain={chain} size={18} className="ml-2 shrink-0 opacity-90" />
          </div>
        </div>
        <div className="flex flex-[2]">
          <button
            type="button"
            disabled={disabled}
            onClick={() => applyBet(Math.max(DEFAULT_GAME_BET, parsed / 2))}
            className="flex-1 bg-[#2a1030] border border-purple-800/40 border-l-0 text-xs text-white hover:bg-[#3a1540] transition-colors disabled:opacity-50"
          >
            ½
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => applyBet(parsed * 2 || DEFAULT_GAME_BET)}
            className="flex-1 bg-[#2a1030] border border-purple-800/40 border-l-0 rounded-r-lg text-xs text-white hover:bg-[#3a1540] transition-colors disabled:opacity-50"
          >
            2×
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {quickPresets.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={disabled}
            onClick={() => applyBet(preset)}
            className={`rounded-lg py-1.5 text-[11px] font-medium border transition-colors disabled:opacity-50 ${
              Math.abs(parsed - preset) < 0.0000001
                ? 'border-purple-400/60 bg-purple-600/25 text-white'
                : 'border-purple-800/30 bg-black/20 text-white/70 hover:border-purple-600/40 hover:text-white'
            }`}
          >
            {preset} {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
