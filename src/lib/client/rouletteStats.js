/**
 * Consistent session stats for roulette bet history.
 * Handles legacy rows where payout mixed gross return vs net profit.
 */

export function deriveRoundNetPnl({ amount, payout, win, returned }) {
  const stake = Number(amount) || 0;
  const ret = returned != null ? Number(returned) : Number(payout);

  if (Number.isFinite(ret)) {
    if (ret <= 0) {
      // Loss (or zero return): net loss is at most the stake
      if (stake > 0 && ret < 0 && Math.abs(ret) > stake * 1.25) {
        return -stake;
      }
      return ret - stake;
    }
    // Positive return from server = gross; from local history often = profit only
    if (stake > 0 && ret > stake) {
      return ret - stake;
    }
    if (stake > 0 && ret > 0 && ret < stake) {
      return ret;
    }
    return ret - stake;
  }

  if (win) return 0;
  return -stake;
}

export function normalizeRouletteHistoryRow(row) {
  const amount = Number(row.amount ?? row.totalBetAmount ?? 0);
  const netPnl = deriveRoundNetPnl({
    amount,
    payout: row.payout,
    win: !!row.win,
    returned: row.returned,
  });
  return {
    ...row,
    amount,
    payout: netPnl,
    win: netPnl > 0,
  };
}

export function computeRouletteSessionStats(bets) {
  const rows = (bets || []).map(normalizeRouletteHistoryRow);
  const totalBets = rows.length;
  const totalWagered = rows.reduce((sum, b) => sum + b.amount, 0);
  const netProfit = rows.reduce((sum, b) => sum + b.payout, 0);
  const winCount = rows.filter((b) => b.win).length;
  const winRate = totalBets > 0 ? (winCount / totalBets) * 100 : 0;
  const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;

  const resultCounts = {};
  rows.forEach((bet) => {
    const n = Number(bet.result);
    if (Number.isFinite(n) && n >= 0) {
      resultCounts[n] = (resultCounts[n] || 0) + 1;
    }
  });

  const mostCommonResults = Object.entries(resultCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([number, count]) => ({ number: parseInt(number, 10), count }));

  const biggestWin = rows.reduce(
    (best, bet) => (bet.payout > best.payout ? bet : best),
    { payout: 0 },
  );

  return {
    totalBets,
    totalWagered,
    netProfit,
    winRate,
    roi,
    winCount,
    mostCommonResults,
    biggestWin: biggestWin.payout > 0 ? biggestWin : null,
  };
}
