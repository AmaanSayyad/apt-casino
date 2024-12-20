/** Adjust bet after a win/loss per auto-bet strategy action. */
export function applyMinesBetAction(currentBet, action, baseBet) {
  const bet = Number(currentBet) || 0.01;
  const base = Number(baseBet) || bet;
  if (action === 'Reset') return base;

  const match = String(action).match(/^([+-])(\d+)%$/);
  if (!match) return bet;

  const pct = parseInt(match[2], 10) / 100;
  const next = match[1] === '+' ? bet * (1 + pct) : bet * (1 - pct);
  return Math.max(0.01, Math.round(next * 10000) / 10000);
}

/** Normalize auto form values to consistent types for session + game engine. */
export function normalizeAutoFormData(formData = {}) {
  const stopOnProfit = parseFloat(formData.stopOnProfit);
  const stopOnLoss = parseFloat(formData.stopOnLoss);

  return {
    betAmount: Number(formData.betAmount) || 0.1,
    mines: Number(formData.mines) || 5,
    tilesToReveal: Number(formData.tilesToReveal) || 5,
    numberOfBets: Number(formData.numberOfBets) || 10,
    onWin: formData.onWin || 'Reset',
    onLoss: formData.onLoss || '+50%',
    stopOnProfit: Number.isFinite(stopOnProfit) ? stopOnProfit : 5,
    stopOnLoss: Number.isFinite(stopOnLoss) ? stopOnLoss : 5,
    aiAssist: formData.aiAssist === true || formData.aiAssist === 'true',
  };
}

export function createAutoSession(formData) {
  const settings = normalizeAutoFormData(formData);
  const totalRounds = settings.numberOfBets;
  const baseBet = settings.betAmount;

  return {
    active: true,
    totalRounds,
    roundsLeft: totalRounds,
    roundsPlayed: 0,
    sessionPnL: 0,
    baseBet,
    currentBet: baseBet,
    stopOnProfit: settings.stopOnProfit > 0 ? settings.stopOnProfit : Infinity,
    stopOnLoss: settings.stopOnLoss > 0 ? settings.stopOnLoss : Infinity,
    settings,
  };
}

export function advanceAutoSession(session, result) {
  const roundPnL = result.won
    ? (Number(result.payout) || 0) - (Number(result.betAmount) || 0)
    : -(Number(result.betAmount) || 0);

  session.sessionPnL += roundPnL;
  session.roundsPlayed += 1;
  session.roundsLeft = Math.max(0, session.totalRounds - session.roundsPlayed);

  const action = result.won ? session.settings.onWin : session.settings.onLoss;
  session.currentBet = applyMinesBetAction(
    session.currentBet,
    action,
    session.baseBet,
  );

  if (session.sessionPnL >= session.stopOnProfit) {
    return { stop: true, reason: 'profit', session };
  }
  if (session.sessionPnL <= -session.stopOnLoss) {
    return { stop: true, reason: 'loss', session };
  }
  if (session.roundsLeft <= 0) {
    return { stop: true, reason: 'rounds', session };
  }

  return { stop: false, session };
}
