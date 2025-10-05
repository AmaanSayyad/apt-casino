import { QUICK_BET_PRESETS } from '@/lib/client/gameBetPreference';

const withSymbol = (fields, symbol) =>
  fields.map((f) => ({
    ...f,
    label: String(f.label).replace(/\(APT\)|\(SOL\)/gi, `(${symbol})`),
  }));

const BET_QUICK_PRESETS = QUICK_BET_PRESETS;

const manualFields = [
  {
    id: 'betAmount',
    label: 'Bet Amount (SOL)',
    type: 'betAmount',
    section: 'game',
    span: 2,
    quickPresets: BET_QUICK_PRESETS,
    defaultValue: '0.1',
  },
  {
    id: 'mines',
    label: 'Number of Mines',
    type: 'singleSelect',
    section: 'game',
    options: Array.from({ length: 24 }, (_, i) => i + 1),
    defaultValue: 5,
  },
];

const autoFields = [
  {
    id: 'betAmount',
    label: 'Bet Amount (SOL)',
    type: 'betAmount',
    section: 'game',
    span: 2,
    quickPresets: BET_QUICK_PRESETS,
    defaultValue: '0.1',
  },
  {
    id: 'mines',
    label: 'Number of Mines',
    type: 'singleSelect',
    section: 'game',
    options: Array.from({ length: 24 }, (_, i) => i + 1),
    defaultValue: 5,
  },
  {
    id: 'tilesToReveal',
    label: 'Tiles to Reveal',
    type: 'singleSelect',
    section: 'game',
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    defaultValue: 5,
  },
  {
    id: 'numberOfBets',
    label: 'Number of Rounds',
    type: 'singleSelect',
    section: 'strategy',
    options: [5, 10, 25, 50, 100],
    defaultValue: 10,
  },
  {
    id: 'onWin',
    label: 'On Win',
    type: 'singleSelect',
    section: 'strategy',
    options: ['Reset', '+10%', '+25%', '+50%', '+100%', '-10%', '-25%'],
    defaultValue: 'Reset',
  },
  {
    id: 'onLoss',
    label: 'On Loss',
    type: 'singleSelect',
    section: 'strategy',
    options: ['Reset', '+10%', '+25%', '+50%', '+100%', '-10%', '-25%'],
    defaultValue: '+50%',
  },
  {
    id: 'stopOnProfit',
    label: 'Profit stop',
    type: 'number',
    section: 'strategy',
    group: 'limits',
    defaultValue: '5',
    min: 0,
    step: 0.1,
  },
  {
    id: 'stopOnLoss',
    label: 'Loss stop',
    type: 'number',
    section: 'strategy',
    group: 'limits',
    defaultValue: '5',
    min: 0,
    step: 0.1,
  },
  {
    id: 'aiAssist',
    label: 'AI Assistant',
    type: 'boolean',
    section: 'ai',
    defaultValue: false,
    hint: 'Slightly slower reveal pacing between tiles.',
  },
];

export function getManualFormConfig(symbol = 'SOL') {
  return {
    mode: 'manual',
    fields: withSymbol(manualFields, symbol),
    submitButton: 'START GAME',
  };
}

export function getAutoFormConfig(symbol = 'SOL') {
  return {
    mode: 'auto',
    submitButton: 'START AUTO BETTING',
    fields: withSymbol(autoFields, symbol),
  };
}

/** @deprecated use getManualFormConfig(symbol) */
export const manualFormConfig = getManualFormConfig('SOL');
/** @deprecated use getAutoFormConfig(symbol) */
export const autoFormConfig = getAutoFormConfig('SOL');
