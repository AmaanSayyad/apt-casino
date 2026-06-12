'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetches per-game leaderboard rows from /api/leaderboard.
 * Uses a request generation counter so stale/aborted responses never
 * clear loading state or overwrite fresher results.
 */
export function useGameLeaderboard(game, { top = 5, pollMs = 60_000 } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        game,
        metric: 'pnl',
        period: 'all',
        top: String(top),
      });
      const res = await fetch(`/api/leaderboard?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (reqId !== reqIdRef.current) return;
      setRows(Array.isArray(json?.leaderboard) ? json.leaderboard : []);
      setLastUpdated(Date.now());
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [game, top]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), pollMs);
    return () => {
      clearInterval(id);
      reqIdRef.current += 1;
    };
  }, [load, pollMs]);

  return { rows, loading, error, lastUpdated, refresh: load };
}
