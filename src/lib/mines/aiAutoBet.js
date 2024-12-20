import { getGameBetPreference } from '@/lib/client/gameBetPreference';

export function pickAiMinesCount(mines) {
  const min = Number(mines?.min) || 3;
  const max = Number(mines?.max) || min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickAiTilesCount(tiles) {
  const min = Number(tiles?.min) || 3;
  const max = Number(tiles?.max) || min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickAiBetAmount(strategy, maxBet, chain) {
  const base = getGameBetPreference('mines', chain);
  const cap = Math.max(base, Number(maxBet) || base);

  if (strategy === 'conservative') {
    return Math.min(base, cap);
  }
  if (strategy === 'aggressive') {
    return Math.min(cap, Math.max(base * 2, base));
  }
  return Math.min(cap, Math.max(base, base * 1.5));
}

/** Map AI agent settings to the auto-bet form payload. */
export function aiSettingsToAutoForm(aiSettings, chain) {
  const { strategy, tiles, mines, stopLoss, targetProfit, riskFactors } = aiSettings;

  return {
    betAmount: pickAiBetAmount(strategy, aiSettings.maxBet, chain),
    mines: pickAiMinesCount(mines),
    tilesToReveal: pickAiTilesCount(tiles),
    numberOfBets: 10,
    onWin: riskFactors?.increaseOnWin ? '+25%' : 'Reset',
    onLoss: riskFactors?.decreaseOnLoss ? '-25%' : '+50%',
    stopOnProfit: Number(targetProfit) || 5,
    stopOnLoss: Number(stopLoss) || 5,
    aiAssist: true,
  };
}
