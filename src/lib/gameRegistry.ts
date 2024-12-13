/** Single source of truth for "Active Games" everywhere in the UI/APIs. */
export const ACTIVE_GAMES = [
  { id: 'plinko', name: 'Plinko', path: '/game/plinko' },
  { id: 'mines', name: 'Mines', path: '/game/mines' },
  { id: 'roulette', name: 'Roulette', path: '/game/roulette' },
  { id: 'wheel', name: 'Wheel', path: '/game/wheel' },
] as const;

export const ACTIVE_GAMES_COUNT = ACTIVE_GAMES.length;
