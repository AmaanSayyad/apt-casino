'use client';

import React from "react";
import { FaBomb, FaSearch, FaHistory, FaPercentage, FaStopCircle } from "react-icons/fa";
import { GiMining } from "react-icons/gi";
import PlayChainIcon from "@/components/play/PlayChainIcon";
import { usePlayCurrency } from "@/hooks/usePlayCurrency";

const CustomSelect = ({
  id,
  name,
  value,
  onChange,
  className = "",
  label,
  options = [],
  disabled = false,
}) => {
  const { symbol, chain } = usePlayCurrency();

  const getIconForField = (fieldName) => {
    switch (fieldName) {
      case 'betAmount':
      case 'stopOnProfit':
      case 'stopOnLoss':
        return <PlayChainIcon chain={chain} size={18} />;
      case 'mines':
        return <FaBomb className="text-red-400" />;
      case 'tilesToReveal':
        return <FaSearch className="text-blue-400" />;
      case 'numberOfBets':
        return <FaHistory className="text-purple-400" />;
      case 'onWin':
      case 'onLoss':
        return <FaPercentage className="text-green-400" />;
      default:
        return <GiMining className="text-white/70" />;
    }
  };

  const formatOptionDisplay = (option, fieldName) => {
    if (fieldName === 'betAmount' || fieldName.includes('stop')) {
      return `${option.toLocaleString()} ${symbol}`;
    }
    if (fieldName === 'mines') {
      return `${option} ${option === 1 ? 'Mine' : 'Mines'}`;
    }
    if (fieldName === 'tilesToReveal') {
      return `${option} ${option === 1 ? 'Tile' : 'Tiles'}`;
    }
    return option;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-medium text-white text-sm">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg z-10">
          {getIconForField(name)}
        </div>

        <div className="magic-gradient p-0.5 rounded-lg shadow-lg">
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg py-3 pl-11 pr-4 bg-gradient-to-br from-[#190026]/90 to-[#0D0015]/90 text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm appearance-none ${
              disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {options.map((option, index) => (
              <option key={index} value={option} className="bg-[#190026] text-white py-2">
                {formatOptionDisplay(option, name)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CustomSelect;
