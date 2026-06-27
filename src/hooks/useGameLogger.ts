import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { DEFAULT_PLAY_CHAIN } from '@/lib/chains/registry';

interface LogGameParams {
  gameType: 'plinko' | 'mines' | 'roulette' | 'wheel';
  playerAddress: string;
  betAmount: number;
  result: string;
  payout: number;
  chain?: string;
  fairnessProof?: Record<string, unknown>;
}

interface GameHistoryEntry {
  game_id: number;
  game_type: number;
  player_address: string;
  bet_amount: number;
  result: string;
  payout: number;
  timestamp: number;
  random_seed: number;
}

export const useGameLogger = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const activeChain = useSelector((s: { balance: { activeChain?: string } }) => s.balance.activeChain) || DEFAULT_PLAY_CHAIN;
  const demoMode = useSelector((s: { balance: { demoMode?: boolean } }) => s.balance.demoMode);

  const logGame = async (
    params: LogGameParams,
  ): Promise<{ success: boolean; transactionHash?: string; explorerUrl?: string; error?: string }> => {
    if (demoMode) {
      return { success: true };
    }

    setIsLogging(true);
    const chain = params.chain || activeChain;
    try {
      const response = await fetch('/api/log-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, chain }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          transactionHash: data.transactionHash,
          explorerUrl: data.explorerUrl,
        };
      }
      console.error('Failed to log game:', data.error);
      if (chain === 'aptos') toast.error('Failed to log game to blockchain');
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Error logging game:', error);
      toast.error('Network error while logging game');
      return { success: false, error: 'Network error' };
    } finally {
      setIsLogging(false);
    }
  };

  const getGameHistory = async (limit = 50): Promise<GameHistoryEntry[]> => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/game-history?limit=${limit}`);
      const data = await response.json();
      if (data.success) return data.games || [];
      return [];
    } catch {
      return [];
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getGame = async (gameId: number): Promise<GameHistoryEntry | null> => {
    try {
      const response = await fetch(`/api/game-history?gameId=${gameId}`);
      const data = await response.json();
      if (data.success) return data.game;
      return null;
    } catch {
      return null;
    }
  };

  return { logGame, getGameHistory, getGame, isLogging, isLoadingHistory, activeChain };
};
