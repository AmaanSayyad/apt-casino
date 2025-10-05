import { MINES_PAYOUT_TAB_MINES } from '@/lib/minesPayTable';

export const gameData = {
  label: "Game Description",
  title: "Mines",
  image: "/images/games/mines.png",
  description: "Unearth hidden gems while avoiding mines in this thrilling crypto game!",
  youtube: "https://www.youtube.com/embed/SJNWidJKOeA?si=SfKVKLsO_UyfGi5h",
  paragraphs: [
    "Select mines on a 5x5 grid – more mines mean higher rewards but greater risk.",
    "Uncover gems while avoiding mines to increase your multiplier. Cash out anytime or keep going for bigger rewards.",
    "With provably fair gameplay and instant payouts, Mines offers the perfect blend of strategy and luck.",
  ],
};

/** Payout card copy + which mine presets appear as tabs (values must match in-game mine options). */
export const bettingTableData = {
  title: "Mines Payouts",
  description:
    "Your potential payout increases with each safe tile you reveal. The more mines you select at the start, the higher your potential rewards will be. Numbers below match the in-game multiplier ladder (5×5 grid, including the configured house edge).",
  /** Mine counts for each tab — ladder rows are computed live from the same formula as the game. */
  mineTabs: [...MINES_PAYOUT_TAB_MINES],
};

// NOTE: Mines stats are now fetched live from /api/games/stats via useGameStats('mines').
// The previous hardcoded `gameStatistics` and `recentBigWins` exports were removed in
// favor of on-chain aggregates. Keep this comment so future contributors don't add fake data back.

export const winProbabilities = [
  { config: '1 mine (24 safe tiles)', probability: 96.0, color: 'from-green-500 to-green-700' },
  { config: '3 mines (22 safe tiles)', probability: 88.0, color: 'from-teal-500 to-teal-700' },
  { config: '5 mines (20 safe tiles)', probability: 80.0, color: 'from-blue-500 to-blue-700' },
  { config: '10 mines (15 safe tiles)', probability: 60.0, color: 'from-yellow-500 to-yellow-700' },
  { config: '15 mines (10 safe tiles)', probability: 40.0, color: 'from-red-500 to-red-700' },
];
