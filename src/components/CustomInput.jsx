'use client';

import React from "react";
import { FaBomb, FaSearch, FaHistory, FaPercentage, FaStopCircle, FaRobot } from "react-icons/fa";
import { GiMining } from "react-icons/gi";
import PlayChainIcon from "@/components/play/PlayChainIcon";
import { usePlayCurrency } from "@/hooks/usePlayCurrency";

const CustomInput = ({
  id,
  name,
  value,
  onChange,
  className = "",
  label,
  options = [],
  type = "text",
  placeholder = "",
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
      case 'aiAssist':
        return <FaRobot className="text-blue-400" />;
      default:
        return <GiMining className="text-white/70" />;
    }
  };

  const getFormattedPlaceholder = (fieldName) => {
    if (fieldName === 'betAmount') {
      return `Enter bet amount in ${symbol}`;
    }
    if (fieldName === 'stopOnProfit') {
      return `Auto-stop at this profit (${symbol})`;
    }
    if (fieldName === 'stopOnLoss') {
      return `Auto-stop at this loss (${symbol})`;
    }
    if (fieldName === 'numberOfBets') {
      return 'Number of rounds to play';
    }
    return placeholder || `Enter ${label}`;
  };

  const showSymbolSuffix = name === 'betAmount' || name.includes('stop');

  return (
    <div className={`flex flex-col gap-2 min-w-0 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-medium text-white text-sm">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg z-10">
          {getIconForField(name)}
        </div>

        <div className="magic-gradient p-0.5 rounded-lg shadow-lg relative">
          {type === "multiSelect" ? (
            <select
              id={id}
              name={name}
              value={value}
              onChange={onChange}
              multiple
              disabled={disabled}
              className={`w-full rounded-lg py-3 pl-11 pr-4 bg-gradient-to-br from-[#190026]/90 to-[#0D0015]/90 text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm ${
                disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {options.map((option, index) => (
                <option key={index} value={option} className="bg-[#190026] text-white py-2">
                  {option}
                </option>
              ))}
            </select>
          ) : type === "boolean" ? (
            <div className="w-full rounded-lg py-3 pl-11 pr-4 bg-gradient-to-br from-[#190026]/90 to-[#0D0015]/90 flex items-center justify-between">
              <span className="text-white font-medium text-sm mr-4 truncate">Enable AI Assistant</span>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  id={id}
                  name={name}
                  checked={value === "true" || value === true}
                  disabled={disabled}
                  onChange={(e) => {
                    onChange({
                      target: {
                        name,
                        value: e.target.checked,
                      },
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
          ) : (
            <input
              id={id}
              name={name}
              value={value}
              onChange={onChange}
              type={type}
              disabled={disabled}
              placeholder={getFormattedPlaceholder(name)}
              className={`w-full min-w-0 rounded-lg py-3 pl-11 ${showSymbolSuffix ? 'pr-12' : 'pr-4'} bg-[#190026] text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              style={{ backgroundColor: '#190026' }}
            />
          )}
          {showSymbolSuffix && type !== 'boolean' && type !== 'multiSelect' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/60 pointer-events-none">
              {symbol}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomInput;
