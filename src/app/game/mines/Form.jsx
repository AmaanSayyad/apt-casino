'use client';

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import {
  FaArrowRight,
  FaDice,
  FaCog,
  FaInfoCircle,
  FaRobot,
  FaPlay,
  FaChevronDown,
} from 'react-icons/fa';
import CustomSelect from '@/components/CustomSelect';
import CustomInput from '@/components/CustomInput';
import MinesBetAmountField from './components/MinesBetAmountField';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  getGameBetPreferenceString,
  setGameBetPreference,
} from '@/lib/client/gameBetPreference';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';

export const MinesAutoSessionContext = createContext(null);

function FieldControl({ field, formData, onChange, disabled }) {
  const common = {
    id: field.id,
    name: field.id,
    label: field.label,
    disabled,
    className: 'bg-black/20 border-purple-800/30 focus:border-purple-600/50',
  };

  if (field.type === 'betAmount') {
    return (
      <MinesBetAmountField
        label={field.label}
        value={formData[field.id] ?? ''}
        onChange={onChange}
        disabled={disabled}
        quickPresets={field.quickPresets}
      />
    );
  }

  if (field.type === 'singleSelect') {
    return (
      <CustomSelect
        {...common}
        value={formData[field.id] ?? ''}
        onChange={onChange}
        options={field.options}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <CustomInput
        {...common}
        type="number"
        value={formData[field.id] ?? ''}
        onChange={onChange}
        placeholder={field.placeholder || '0'}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <motion.div
        className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-indigo-950/20 p-4"
        whileTap={{ scale: disabled ? 1 : 0.99 }}
      >
        <div className="flex items-center justify-between gap-3">
          <motion.div
            className="flex items-start gap-3 min-w-0"
            animate={{ opacity: formData[field.id] ? 1 : 0.92 }}
          >
            <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-400/20 shrink-0">
              <FaRobot className="text-blue-400" />
            </div>
            <motion.div className="min-w-0">
              <p className="text-sm font-semibold text-white">{field.label}</p>
              {field.hint && (
                <p className="text-xs text-white/50 mt-0.5 leading-snug">{field.hint}</p>
              )}
            </motion.div>
          </motion.div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              id={field.id}
              name={field.id}
              checked={formData[field.id] === true || formData[field.id] === 'true'}
              disabled={disabled}
              onChange={(e) =>
                onChange({ target: { name: field.id, value: e.target.checked } })
              }
              className="sr-only peer"
            />
            <motion.div
              className="w-11 h-6 bg-gray-700 rounded-full peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-500/40 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
              animate={formData[field.id] ? { scale: 1.02 } : { scale: 1 }}
            />
          </label>
        </div>
      </motion.div>
    );
  }

  return null;
}

function SectionHeader({ icon: Icon, title, subtitle, color = 'purple' }) {
  const colors = {
    purple: 'text-purple-300 border-purple-800/30 bg-purple-900/20',
    blue: 'text-blue-300 border-blue-800/30 bg-blue-900/20',
  };
  return (
    <motion.div
      className="flex items-center gap-2 mb-3"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`p-1.5 rounded-lg border ${colors[color]}`}>
        <Icon className="text-xs" />
      </div>
      <motion.div>
        <p className="text-sm font-semibold text-white">{title}</p>
        {subtitle && <p className="text-[11px] text-white/45">{subtitle}</p>}
      </motion.div>
    </motion.div>
  );
}

const DynamicForm = ({
  config,
  onSubmit,
  gameStatus = { isPlaying: false, hasPlacedBet: false },
  autoSession = null,
}) => {
  const [formData, setFormData] = useState({});
  const [strategyOpen, setStrategyOpen] = useState(true);

  const { chain, symbol } = usePlayCurrency();
  const autoSessionFromContext = useContext(MinesAutoSessionContext);
  const activeSession = autoSessionFromContext ?? autoSession;
  const isAutoMode = config.mode === 'auto';
  const isBusy =
    gameStatus.isPlaying || gameStatus.hasPlacedBet || activeSession?.active;

  useEffect(() => {
    const initialData = {};
    config.fields.forEach((field) => {
      if (field.type === 'betAmount') {
        initialData[field.id] = getGameBetPreferenceString('mines', chain);
      } else if (field.defaultValue !== undefined) {
        initialData[field.id] = field.defaultValue;
      } else if (field.type === 'multiSelect') {
        initialData[field.id] = [];
      } else {
        initialData[field.id] = '';
      }
    });
    setFormData(initialData);
  }, [config, chain]);

  const fieldsBySection = useMemo(() => {
    const groups = { game: [], strategy: [], strategyLimits: [], ai: [] };
    config.fields.forEach((field) => {
      const section = field.section || 'game';
      if (field.group === 'limits') {
        groups.strategyLimits.push(field);
      } else if (section === 'strategy') {
        groups.strategy.push(field);
      } else if (groups[section]) {
        groups[section].push(field);
      }
    });
    return groups;
  }, [config.fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isBusy) return;

    const betValue = parseFloat(formData.betAmount);
    if (!Number.isFinite(betValue) || betValue <= 0) {
      toast.error('Enter a valid bet amount');
      return;
    }

    setGameBetPreference('mines', chain, formData.betAmount);
    onSubmit({ ...formData, betAmount: betValue });
  };

  return (
    <div className="rounded-xl overflow-hidden bg-[#0f0612]/90 border border-purple-800/25 shadow-lg">
      <div className="px-4 py-3.5 border-b border-purple-900/25 bg-gradient-to-r from-[#1a0818]/80 to-[#120610]/80">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className={`p-2 rounded-lg border ${
              isAutoMode
                ? 'bg-blue-500/10 border-blue-500/25'
                : 'bg-purple-500/10 border-purple-500/25'
            }`}
          >
            {isAutoMode ? (
              <FaRobot className="text-blue-400 text-sm" />
            ) : (
              <FaDice className="text-purple-400 text-sm" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">
              {isAutoMode ? 'Auto Betting' : 'Manual Betting'}
            </h3>
            <p className="text-white/45 text-xs mt-0.5">
              {isAutoMode
                ? 'Runs multiple rounds with stop limits'
                : 'Pick tiles yourself each round'}
            </p>
          </div>
        </motion.div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <section>
          <SectionHeader
            icon={FaDice}
            title="Game settings"
            subtitle={isAutoMode ? 'Base bet, mines & tiles per round' : 'Bet size and mine count'}
          />
          <div
            className={`grid gap-3 ${
              isAutoMode ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {fieldsBySection.game.map((field) => (
              <div
                key={field.id}
                className={field.span === 2 ? 'col-span-2' : ''}
              >
                <FieldControl
                  field={field}
                  formData={formData}
                  onChange={handleChange}
                  disabled={isBusy}
                />
              </div>
            ))}
          </div>
        </section>

        {isAutoMode &&
          (fieldsBySection.strategy.length > 0 || fieldsBySection.strategyLimits.length > 0) && (
          <section className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setStrategyOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2">
                <FaCog className="text-blue-400 text-xs" />
                <span className="text-sm font-medium text-white">Strategy & limits</span>
              </div>
              <FaChevronDown
                className={`text-white/40 text-xs transition-transform ${strategyOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {strategyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {fieldsBySection.strategy.map((field) => (
                        <div
                          key={field.id}
                          className={`min-w-0 ${field.id === 'numberOfBets' ? 'col-span-2' : ''}`}
                        >
                          <FieldControl
                            field={field}
                            formData={formData}
                            onChange={handleChange}
                            disabled={isBusy}
                          />
                        </div>
                      ))}
                    </div>
                    {fieldsBySection.strategyLimits.length > 0 && (
                      <div className="grid grid-cols-1 gap-3">
                        {fieldsBySection.strategyLimits.map((field) => (
                          <div key={field.id} className="min-w-0">
                            <FieldControl
                              field={field}
                              formData={formData}
                              onChange={handleChange}
                              disabled={isBusy}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {isAutoMode &&
          fieldsBySection.ai.map((field) => (
            <FieldControl
              key={field.id}
              field={field}
              formData={formData}
              onChange={handleChange}
              disabled={isBusy}
            />
          ))}

        {isAutoMode && activeSession?.active && (
          <motion.div
            className="rounded-lg border border-blue-500/25 bg-blue-950/20 px-3 py-2.5 text-xs text-white/70 flex flex-wrap gap-x-4 gap-y-1"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>
              Round{' '}
              <span className="text-white font-medium">
                {(activeSession.roundsPlayed || 0) + 1}
              </span>
              {' / '}
              {activeSession.totalRounds}
            </span>
            <span>
              Bet{' '}
              <span className="text-white font-medium">
                {Number(activeSession.currentBet || 0).toFixed(4)} {symbol}
              </span>
            </span>
            <span>
              P&amp;L{' '}
              <span
                className={
                  activeSession.sessionPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                }
              >
                {activeSession.sessionPnL >= 0 ? '+' : ''}
                {activeSession.sessionPnL.toFixed(4)} {symbol}
              </span>
            </span>
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={isBusy}
          className={`w-full py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
            isBusy
              ? 'bg-gray-800 cursor-not-allowed opacity-60'
              : isAutoMode
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/25'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-900/25'
          }`}
          whileHover={{ scale: isBusy ? 1 : 1.01 }}
          whileTap={{ scale: isBusy ? 1 : 0.98 }}
        >
          {isBusy ? (
            <>Round in progress…</>
          ) : (
            <>
              {isAutoMode ? <FaPlay className="text-xs" /> : <FaDice className="text-xs" />}
              {isAutoMode ? 'START AUTO BETTING' : 'START GAME'}
              <FaArrowRight className="text-xs opacity-80" />
            </>
          )}
        </motion.button>

        <div className="flex gap-2.5 rounded-lg bg-white/[0.03] border border-white/8 px-3 py-2.5">
          <FaInfoCircle className="text-blue-400/70 shrink-0 mt-0.5 text-xs" />
          <p className="text-[11px] text-white/50 leading-relaxed">
            {isAutoMode ? (
              <>
                Auto mode places bets, reveals your tile count, then cashes out each round.
                Adjust bet on win/loss and set stop limits to control risk.
              </>
            ) : (
              <>
                Click tiles to reveal gems and raise your multiplier. Cash out anytime
                before hitting a mine.
              </>
            )}
          </p>
        </div>
      </form>
    </div>
  );
};

export default DynamicForm;
