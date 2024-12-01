import { deriveRoundNetPnl } from '@/lib/client/rouletteStats';

const STORAGE_PREFIX = 'aptcasino_roulette_history_v1';
const MAX_ENTRIES = 50;

function storageKey(chain, wallet) {
  if (!chain || !wallet) return null;
  return `${STORAGE_PREFIX}:${chain}:${wallet}`;
}

function parseWinningNumber(result) {
  if (!result || typeof result !== 'string') return null;
  const m = result.match(/number(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function loadRouletteBetHistory(chain, wallet) {
  const key = storageKey(chain, wallet);
  if (!key || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ENTRIES).map((row) => {
      const amount = Number(row.amount ?? row.totalBetAmount ?? 0);
      const payout = deriveRoundNetPnl({
        amount,
        payout: row.payout,
        win: !!row.win,
        returned: row.returned,
      });
      return {
        ...row,
        amount,
        payout,
        win: payout > 0,
        timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
      };
    });
  } catch {
    return [];
  }
}

export function saveRouletteBetHistory(chain, wallet, history) {
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
    console.warn('[rouletteBetHistory] save failed', e);
  }
}

/** Hydrate from Supabase-backed profile API when local cache is empty. */
export async function fetchRouletteBetHistoryFromServer(chain, wallet) {
  if (!wallet || !chain) return [];
  try {
    const res = await fetch(
      `/api/profile/games?wallet=${encodeURIComponent(wallet)}&chain=${encodeURIComponent(chain)}`,
    );
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.recent)) return [];

    return data.recent
      .filter((row) => String(row.gameType || '').toLowerCase() === 'roulette')
      .map((row, index) => {
        const bet = Number(row.betApt ?? row.betNative ?? 0);
        const returned = Number(row.payoutApt ?? row.payoutNative ?? 0);
        const payout = deriveRoundNetPnl({ amount: bet, payout: returned });
        const win = payout > 0;
        const winningNumber = parseWinningNumber(row.result);
        return {
          id: `server-${row.timestamp ?? index}-${index}`,
          timestamp: row.timestamp ? new Date(row.timestamp * 1000) : new Date(),
          betType: 'Roulette',
          amount: bet,
          returned,
          result: winningNumber ?? '?',
          win,
          payout,
          totalBets: 1,
          winningBets: win ? 1 : 0,
          txHash: null,
          details: {
            winningBets: win && row.result ? [String(row.result)] : [],
            losingBets: win ? [] : row.result ? [String(row.result)] : [],
          },
        };
      })
      .reverse();
  } catch {
    return [];
  }
}
