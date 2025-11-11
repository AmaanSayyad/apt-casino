/** Roulette help copy — structured for Tutorial / Odds panels */

export const ROULETTE_VARIANT = {
  title: 'European roulette',
  tagline: 'Single zero (0) — better player odds than double-zero tables',
};

export const ROULETTE_TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Fund your house balance',
    body: 'Connect your wallet and deposit SOL or APT from the navbar. Bets are placed from your in-app house balance, not directly from your wallet each spin.',
    icon: 'wallet',
  },
  {
    step: 2,
    title: 'Set chip size',
    body: 'Enter a bet amount or tap a quick chip (0.1, 0.5, 1, 10, 100). This is the stake applied each time you click a spot on the table.',
    icon: 'chip',
  },
  {
    step: 3,
    title: 'Place bets on the board',
    body: 'Click numbers, splits, streets, corners, dozens, columns, red/black, even/odd, or high/low. Clicking the same spot again overwrites that bet with your current chip size.',
    icon: 'board',
  },
  {
    step: 4,
    title: 'Spin & settle',
    body: 'Hit Place Bet when your total is ready. The wheel spins and winning bets pay out to your house balance automatically.',
    icon: 'spin',
  },
];

export const ROULETTE_TUTORIAL_TIPS = [
  'Use Undo to revert your last click, or Clear to reset the whole board.',
  'You can stack multiple bet types in one round — watch Current Bet Total before spinning.',
];

/** @deprecated — use ROULETTE_TUTORIAL_STEPS */
export const rouletteTutorial =
  'European single-zero roulette. Deposit to your house balance, set a chip size, click the board to bet, then Place Bet to spin.';

export const rouletteOdds = [
  'Below are the supported inside bets',
  '-Straight Up (35:1 payout): Select one number',
  '-Split (17:1 payout): Select two numbers (click border between two numbers)',
  '-Street (11:1 payout): Select three numbers (example: click bottom border of 1 to get street 1, 2, and 3',
  '-Corner (8:1 payout): Select four numbers (click corner between 4 straight ups)',
  '-Six Line (5:1 payout): Select six numbers (example: click corner between 1 and 4 to bet 1, 2, 3, 4, 5, and 6)',
  'Below are the supported outside bets',
  '-Column (2:1 payout): 12 numbers aligned to the "2 To 1" (click 2 To 1)',
  '-Dozen (2:1 payout): 12 numbers aligned to 1st, 2nd, or 3rd 12 (click on the 1st, 2nd, or 3rd 12)',
  '-Red/Black (1:1 payout): Bet on color (click red or black)',
  '-High/Low (1:1 payout): 1–18 or 19–36',
  '-Even/Odd (1:1 payout): Even or odd numbers',
];

export const ROULETTE_ODDS_HIGHLIGHTS = [
  { label: 'Straight up', payout: '35:1', color: '#14D854' },
  { label: 'Red / Black', payout: '1:1', color: '#d82633' },
  { label: 'Dozen / Column', payout: '2:1', color: '#681DDB' },
];
