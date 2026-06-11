"use client";

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { DEFAULT_PLAY_CHAIN } from '@/lib/chains/registry';
import { formatCombinedNative, formatSingleNative } from '@/lib/formatVolume';

export type GameSlug = 'plinko' | 'mines' | 'roulette' | 'wheel' | 'all';

export type GameStats = {
  game: GameSlug;
  totalBets: number;
  totalWins: number;
  uniquePlayers: number;
  volumeOctas: string;
  volumeApt: number;
  volumeByChain?: Record<string, number>;
  volumeDisplay?: string;
  payoutOctas: string;
  payoutApt: number;
  maxWinOctas: string;
  maxWinApt: number;
  maxWinByChain?: Record<string, number>;
  maxWinDisplay?: string;
  maxWinPlayer: string | null;
  updatedAt: string;
  source: 'onchain' | 'empty';
};

export type FormattedGameStats = {
  totalBets: string;
  volume: string;
  maxWin: string;
};

const ZERO_DISPLAY: FormattedGameStats = {
  totalBets: '0',
  volume: '0',
  maxWin: '0',
};

function compactNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(4);
}

export function formatGameStats(
  stats: GameStats | null,
  activeChain?: string,
  activeSymbol?: string,
  loading = false,
): FormattedGameStats {
  if (loading) {
    return { totalBets: '…', volume: '…', maxWin: '…' };
  }
  if (!stats) return ZERO_DISPLAY;

  const sym =
    activeSymbol || (activeChain === 'solana' ? 'SOL' : activeChain === 'aptos' ? 'APT' : 'SOL');

  if (stats.totalBets === 0) {
    return {
      totalBets: '0',
      volume: formatSingleNative(0, sym),
      maxWin: formatSingleNative(0, sym),
    };
  }

  const volume =
    stats.volumeDisplay ||
    (stats.volumeByChain
      ? formatCombinedNative(stats.volumeByChain)
      : formatSingleNative(stats.volumeApt, sym));

  const maxWin =
    stats.maxWinDisplay ||
    (stats.maxWinByChain
      ? formatCombinedNative(stats.maxWinByChain)
      : formatSingleNative(stats.maxWinApt, sym));

  return {
    totalBets: stats.totalBets.toLocaleString(),
    volume,
    maxWin,
  };
}

export function useGameStats(slug: GameSlug, intervalMs = 120_000, enabled = true) {
  const activeChain = useSelector((s: { balance: { activeChain?: string } }) => s.balance.activeChain) || DEFAULT_PLAY_CHAIN;
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const aborterRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      try {
        aborterRef.current?.abort();
        const ac = new AbortController();
        aborterRef.current = ac;
        setLoading(true);
        const res = await fetch(`/api/games/stats?game=${encodeURIComponent(slug)}`, {
          signal: ac.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as GameStats;
        if (cancelled) return;
        setStats(json);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const name = (err as Error)?.name;
        if (name === 'AbortError') return;
        setError((err as Error)?.message || 'Failed to load stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    if (intervalMs > 0) {
      const id = setInterval(load, intervalMs);
      return () => {
        cancelled = true;
        clearInterval(id);
        aborterRef.current?.abort();
      };
    }
    return () => {
      cancelled = true;
      aborterRef.current?.abort();
    };
  }, [slug, intervalMs, enabled]);

  const chainSymbol =
    activeChain === 'solana' ? 'SOL' : activeChain === 'aptos' ? 'APT' : 'SOL';

  return {
    stats,
    loading,
    error,
    activeChain,
    symbol: chainSymbol,
    display: formatGameStats(stats, activeChain, chainSymbol, loading),
  } as const;
}
