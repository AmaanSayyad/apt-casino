'use client';

import { useEffect, useState } from 'react';

/** One poll per tab — shared across all components (avoids duplicate /api/stats/* storms). */
const LIVE_POLL_MS = 120_000;
const PUBLIC_POLL_MS = 120_000;

type Listener = () => void;

function createSharedPoller<T>(url: string, pollMs: number) {
  let data: T | null = null;
  let loading = true;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let inFlight: Promise<void> | null = null;
  const listeners = new Set<Listener>();

  const notify = () => listeners.forEach((fn) => fn());

  const fetchOnce = async () => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const res = await fetch(url);
        if (res.ok) data = (await res.json()) as T;
      } catch {
        /* keep last good payload */
      } finally {
        loading = false;
        notify();
        inFlight = null;
      }
    })();
    return inFlight;
  };

  const ensure = () => {
    if (intervalId) return;
    void fetchOnce();
    intervalId = setInterval(() => void fetchOnce(), pollMs);
  };

  const release = () => {
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return function useShared(): { data: T | null; loading: boolean } {
    const [, tick] = useState(0);
    useEffect(() => {
      const onUpdate = () => tick((n) => n + 1);
      listeners.add(onUpdate);
      ensure();
      return () => {
        listeners.delete(onUpdate);
        release();
      };
    }, []);
    return { data, loading };
  };
}

export type LiveStatsPayload = Record<string, unknown> & {
  totalBets?: number;
  totalWageredDisplay?: string;
  totalWageredByChain?: unknown;
  maxWinDisplay?: string;
  maxWinByChain?: unknown;
  gameActivity?: Record<string, { playersOnline?: number; totalBets?: number }>;
  recentWinners?: unknown[];
};

export type PublicStatsPayload = Record<string, unknown> & {
  totalRoundsPlayed?: number;
  playerRoundsWon?: number;
  depositsProcessed?: number;
  uniqueTraders?: number;
  winRatePct?: number;
  roundsByChain?: { solana?: number; aptos?: number };
  winsByChain?: { solana?: number; aptos?: number };
  depositsByChain?: { solana?: number; aptos?: number };
  supabaseConfigured?: boolean;
};

export const useSharedLiveStats = createSharedPoller<LiveStatsPayload>(
  '/api/stats/live',
  LIVE_POLL_MS,
);

export const useSharedPublicStats = createSharedPoller<PublicStatsPayload>(
  '/api/stats/public',
  PUBLIC_POLL_MS,
);
