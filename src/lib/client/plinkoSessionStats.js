const STORAGE_PREFIX = 'apt-casino/plinko-session-stats';

function storageKey(chain) {
  return `${STORAGE_PREFIX}:${chain || 'solana'}`;
}

const EMPTY = {
  gamesPlayed: 0,
  bestMultiplier: 0,
  totalNetPnl: 0,
};

export function loadPlinkoSessionStats(chain) {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = localStorage.getItem(storageKey(chain));
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      gamesPlayed: Number(parsed.gamesPlayed) || 0,
      bestMultiplier: Number(parsed.bestMultiplier) || 0,
      totalNetPnl: Number(parsed.totalNetPnl) || 0,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function recordPlinkoSessionRound(chain, { betAmount, multiplier, netPnl }) {
  if (typeof window === 'undefined') return loadPlinkoSessionStats(chain);
  const prev = loadPlinkoSessionStats(chain);
  const next = {
    gamesPlayed: prev.gamesPlayed + 1,
    bestMultiplier: Math.max(prev.bestMultiplier, multiplier),
    totalNetPnl: prev.totalNetPnl + netPnl,
  };
  try {
    localStorage.setItem(storageKey(chain), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
