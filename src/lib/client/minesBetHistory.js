const STORAGE_PREFIX = 'aptcasino_mines_history_v1';
const MAX_ENTRIES = 50;

function storageKey(chain, wallet) {
  if (!chain || !wallet) return null;
  return `${STORAGE_PREFIX}:${chain}:${wallet}`;
}

export function parseMinesResult(result) {
  if (!result || typeof result !== 'string') {
    return { mines: 0, won: false, multiplier: 0 };
  }
  const match = result.match(/^(\d+)mines_(win|loss)_([\d.]+)x$/i);
  if (!match) {
    return { mines: 0, won: false, multiplier: 0 };
  }
  return {
    mines: Number(match[1]) || 0,
    won: match[2].toLowerCase() === 'win',
    multiplier: Number(match[3]) || 0,
  };
}

export function formatMinesHistoryTime(ts) {
  if (!ts) return '—';
  const date =
    ts instanceof Date
      ? ts
      : new Date(typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : ts);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function mapServerRowToMinesHistory(row, symbol, index = 0) {
  const bet = Number(row.betApt ?? row.betNative ?? 0);
  const payoutTotal = Number(row.payoutApt ?? row.payoutNative ?? 0);
  const parsed = parseMinesResult(row.result);
  const won = parsed.won || payoutTotal > bet;
  const ts = row.timestamp ? new Date(row.timestamp * 1000) : new Date();
  const multiplier =
    parsed.multiplier || (won && bet > 0 ? payoutTotal / bet : 0);

  return {
    id: row.id ?? `server-${ts.getTime()}-${index}`,
    mines: parsed.mines,
    bet: `${bet} ${symbol}`,
    outcome: won ? 'win' : 'loss',
    payout: won ? `${payoutTotal} ${symbol}` : `0 ${symbol}`,
    multiplier: won ? `${Number(multiplier).toFixed(2)}x` : '0x',
    time: formatMinesHistoryTime(ts),
    timestamp: ts.toISOString(),
    txHash: row.proofReference ?? row.txHash ?? null,
  };
}

export function computeMinesUserStats(history, symbol) {
  if (!history?.length) {
    return {
      totalPlayed: 0,
      totalWon: 0,
      winRate: '0%',
      biggestWin: `0 ${symbol}`,
      avgMultiplier: '0x',
      profitLoss: `0 ${symbol}`,
    };
  }

  let wins = 0;
  let totalProfit = 0;
  let biggestWin = 0;
  let multSum = 0;
  let multCount = 0;

  for (const game of history) {
    const betMatch = String(game.bet).match(/^([\d.]+)/);
    const payoutMatch = String(game.payout).match(/^([\d.]+)/);
    const bet = betMatch ? Number(betMatch[1]) : 0;
    const payout = payoutMatch ? Number(payoutMatch[1]) : 0;
    const profit = payout - bet;
    totalProfit += profit;

    if (game.outcome === 'win') {
      wins += 1;
      const multMatch = String(game.multiplier).match(/^([\d.]+)/);
      if (multMatch) {
        multSum += Number(multMatch[1]);
        multCount += 1;
      }
      if (profit > biggestWin) biggestWin = profit;
    }
  }

  const total = history.length;
  return {
    totalPlayed: total,
    totalWon: wins,
    winRate: total > 0 ? `${Math.round((wins / total) * 100)}%` : '0%',
    biggestWin: `${biggestWin.toFixed(4)} ${symbol}`,
    avgMultiplier: multCount > 0 ? `${(multSum / multCount).toFixed(2)}x` : '0x',
    profitLoss: `${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(4)} ${symbol}`,
  };
}

export function loadMinesBetHistory(chain, wallet) {
  const key = storageKey(chain, wallet);
  if (!key || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ENTRIES).map((row) => ({
      ...row,
      time: row.timestamp ? formatMinesHistoryTime(row.timestamp) : row.time ?? '—',
    }));
  } catch {
    return [];
  }
}

export function saveMinesBetHistory(chain, wallet, history) {
  const key = storageKey(chain, wallet);
  if (!key || typeof window === 'undefined') return;
  try {
    const payload = (history || []).slice(0, MAX_ENTRIES).map((row) => ({
      ...row,
      timestamp:
        row.timestamp instanceof Date
          ? row.timestamp.toISOString()
          : row.timestamp ?? new Date().toISOString(),
    }));
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.warn('[minesBetHistory] save failed', e);
  }
}

/** Hydrate from server when local cache is empty. */
export async function fetchMinesBetHistoryFromServer(chain, wallet, symbol) {
  if (!wallet || !chain) return [];
  try {
    const res = await fetch(
      `/api/games/player-history?wallet=${encodeURIComponent(wallet)}&chain=${encodeURIComponent(chain)}&game=mines&limit=50`,
    );
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.games)) return [];

    return data.games.map((row, index) => mapServerRowToMinesHistory(row, symbol, index));
  } catch {
    return [];
  }
}
