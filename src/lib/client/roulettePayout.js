import { applyHouseEdgeToMultiplier } from '@/lib/houseEdge';

export const RouletteBetType = {
  NUMBER: 0,
  COLOR: 1,
  ODDEVEN: 2,
  HIGHLOW: 3,
  DOZEN: 4,
  COLUMN: 5,
  SPLIT: 6,
  STREET: 7,
  CORNER: 8,
  LINE: 9,
};

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function getRoulettePayoutRatio(kind) {
  let fair;
  switch (kind) {
    case RouletteBetType.NUMBER:
      fair = 36;
      break;
    case RouletteBetType.COLOR:
    case RouletteBetType.ODDEVEN:
    case RouletteBetType.HIGHLOW:
      fair = 2;
      break;
    case RouletteBetType.DOZEN:
    case RouletteBetType.COLUMN:
      fair = 3;
      break;
    case RouletteBetType.SPLIT:
      fair = 18;
      break;
    case RouletteBetType.STREET:
      fair = 12;
      break;
    case RouletteBetType.CORNER:
      fair = 9;
      break;
    case RouletteBetType.LINE:
      fair = 6;
      break;
    default:
      return 0;
  }
  return applyHouseEdgeToMultiplier(fair, 'roulette');
}

export function checkRouletteWin(kind, value, winningNumber) {
  if (winningNumber === 0 && kind !== RouletteBetType.NUMBER) return false;

  switch (kind) {
    case RouletteBetType.NUMBER:
      return value === winningNumber;
    case RouletteBetType.COLOR:
      return value === 0
        ? RED_NUMBERS.includes(winningNumber)
        : !RED_NUMBERS.includes(winningNumber);
    case RouletteBetType.ODDEVEN:
      return value === 1 ? winningNumber % 2 !== 0 : winningNumber % 2 === 0;
    case RouletteBetType.HIGHLOW:
      return value === 0
        ? winningNumber >= 1 && winningNumber <= 18
        : winningNumber >= 19 && winningNumber <= 36;
    case RouletteBetType.DOZEN:
      return (
        (value === 0 && winningNumber >= 1 && winningNumber <= 12) ||
        (value === 1 && winningNumber >= 13 && winningNumber <= 24) ||
        (value === 2 && winningNumber >= 25 && winningNumber <= 36)
      );
    case RouletteBetType.COLUMN:
      return (
        (value === 0 && winningNumber % 3 === 0) ||
        (value === 1 && winningNumber % 3 === 2) ||
        (value === 2 && winningNumber % 3 === 1)
      );
    case RouletteBetType.SPLIT: {
      const splitNumbers = String(value).split(',').map((n) => parseInt(n, 10));
      return splitNumbers.includes(winningNumber);
    }
    case RouletteBetType.STREET: {
      const streetNumbers = String(value).split(',').map((n) => parseInt(n, 10));
      return streetNumbers.includes(winningNumber);
    }
    case RouletteBetType.CORNER: {
      const cornerNumbers = String(value).split(',').map((n) => parseInt(n, 10));
      return cornerNumbers.includes(winningNumber);
    }
    default:
      return false;
  }
}

export function calculateRouletteRoundResult(allBets, winningNumber) {
  let totalPayout = 0;
  const winningBets = [];
  const losingBets = [];

  for (const bet of allBets) {
    const kind = Number(bet.type);
    const isWinner = checkRouletteWin(kind, bet.value, winningNumber);
    const payoutRatio = getRoulettePayoutRatio(kind);

    if (isWinner) {
      const betPayout = bet.amount * payoutRatio;
      totalPayout += betPayout;
      winningBets.push({ ...bet, payout: betPayout, multiplier: payoutRatio });
    } else {
      losingBets.push({ ...bet, loss: bet.amount });
    }
  }

  const netResult = totalPayout > 0 ? totalPayout : 0;
  return { totalPayout, netResult, winningBets, losingBets };
}
