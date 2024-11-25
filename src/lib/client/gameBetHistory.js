const MAX_ENTRIES = 50;

function storageKey(game, chain, wallet) {
  if (!game || !chain || !wallet) return null;
  return `aptcasino_${game}_history_v1:${chain}:${wallet}`;
}

export function loadGameBetHistory(game, chain, wallet) {
  const key = storageKey(game, chain, wallet);
  if (!key || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function saveGameBetHistory(game, chain, wallet, history) {
  const key = storageKey(game, chain, wallet);
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
    console.warn(`[${game}BetHistory] save failed`, e);
  }
}

export async function fetchGameBetHistoryFromServer(game, chain, wallet, mapRow) {
  if (!wallet || !chain || !game) return [];
  try {
    const res = await fetch(
      `/api/games/player-history?wallet=${encodeURIComponent(wallet)}&chain=${encodeURIComponent(chain)}&game=${encodeURIComponent(game)}&limit=50`,
    );
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.games)) return [];
    return data.games.map((row, index) => mapRow(row, index));
  } catch {
    return [];
  }
}

export function mapPlinkoServerRow(row, index = 0) {
  const bet = Number(row.betApt ?? 0);
  const payout = Number(row.payoutApt ?? 0);
  const multMatch = String(row.result || '').match(/_([\d.]+)$/);
  const mult = multMatch ? Number(multMatch[1]) : bet > 0 ? payout / bet : 0;
  const ts = row.timestamp ? new Date(row.timestamp * 1000) : new Date();
  return {
    id: `server-${ts.getTime()}-${index}`,
    game: 'Plinko',
    title: ts.toLocaleTimeString(),
    betAmount: String(bet),
    multiplier: `${mult.toFixed(2)}x`,
    payout: String(payout),
    timestamp: ts.getTime(),
    txHash: row.proofReference ?? null,
  };
}

export function mapWheelServerRow(row, index = 0) {
  const bet = Number(row.betApt ?? 0);
  const payout = Number(row.payoutApt ?? 0);
  const multMatch = String(row.result || '').match(/([\d.]+)x/i);
  const mult = multMatch ? Number(multMatch[1]) : bet > 0 ? payout / bet : 0;
  const ts = row.timestamp ? new Date(row.timestamp * 1000) : new Date();
  return {
    id: `server-${ts.getTime()}-${index}`,
    game: 'Wheel',
    time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    betAmount: bet.toFixed(5),
    multiplier: `${mult.toFixed(2)}x`,
    payout: payout.toFixed(5),
    result: 0,
    color: '',
    timestamp: ts.toISOString(),
    txHash: row.proofReference ?? null,
  };
}
