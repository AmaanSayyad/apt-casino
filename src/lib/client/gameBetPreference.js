/** Default chip/bet amount (native units, e.g. SOL). */
export const DEFAULT_GAME_BET = 0.1;

/** Quick-select bet chips shown on game control panels. */
export const QUICK_BET_PRESETS = [0.1, 0.5, 1, 5, 10, 100];

const STORAGE_PREFIX = 'apt-casino/bet-amount';

function storageKey(game, chain) {
  return `${STORAGE_PREFIX}/${game}:${chain || 'solana'}`;
}

export function getGameBetPreference(game, chain) {
  if (typeof window === 'undefined') return DEFAULT_GAME_BET;
  try {
    const raw = localStorage.getItem(storageKey(game, chain));
    if (!raw) return DEFAULT_GAME_BET;
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_GAME_BET;
    return n;
  } catch {
    return DEFAULT_GAME_BET;
  }
}

/** String form for text inputs (preserves decimals like 0.001). */
export function getGameBetPreferenceString(game, chain) {
  if (typeof window === 'undefined') return String(DEFAULT_GAME_BET);
  try {
    const raw = localStorage.getItem(storageKey(game, chain));
    if (!raw) return String(DEFAULT_GAME_BET);
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return String(DEFAULT_GAME_BET);
    return raw;
  } catch {
    return String(DEFAULT_GAME_BET);
  }
}

export function setGameBetPreference(game, chain, value) {
  if (typeof window === 'undefined') return;
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return;
  try {
    const toStore = typeof value === 'string' && value.trim() !== '' ? value.trim() : String(n);
    localStorage.setItem(storageKey(game, chain), toStore);
  } catch {
    /* ignore quota / private mode */
  }
}
