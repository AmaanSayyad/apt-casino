'use client';

import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { DEFAULT_PLAY_CHAIN, getPlayChainConfig } from '@/lib/chains/registry';
import {
  buildSolanaFairnessProof,
  createFairnessRound,
} from '@/lib/provablyFair/solanaFairness';

/**
 * Commit/reveal flow for server-ledger play on any chain.
 * Uses a ref for the active round so reveal() works inside timeouts/async callbacks.
 */
export function useProvableFairness(game, wallet) {
  const activeChain = useSelector((s) => s.balance.activeChain) || DEFAULT_PLAY_CHAIN;
  const demoMode = useSelector((s) => s.balance.demoMode);
  const chainConfig = getPlayChainConfig(activeChain);
  const fairnessEnabled = chainConfig?.balanceMode === 'server' && !demoMode;

  const [phase, setPhase] = useState('idle');
  const [round, setRound] = useState(null);
  const [proof, setProof] = useState(null);
  const roundRef = useRef(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setRound(null);
    setProof(null);
    roundRef.current = null;
  }, []);

  const begin = useCallback(async () => {
    if (!fairnessEnabled || !wallet) return null;
    const next = await createFairnessRound(wallet, game);
    roundRef.current = next;
    setRound(next);
    return next;
  }, [fairnessEnabled, game, wallet]);

  const reveal = useCallback(
    async (outcome, roundOverride = null) => {
      const activeRound = roundOverride ?? roundRef.current ?? round;
      if (!activeRound || !wallet) return null;
      const built = await buildSolanaFairnessProof(activeRound, wallet, game, outcome);
      setProof(built);
      setPhase('revealed');
      return built;
    },
    [game, round, wallet],
  );

  return {
    enabled: fairnessEnabled,
    /** @deprecated use `enabled` — kept for existing game UIs */
    isSolana: fairnessEnabled,
    phase,
    round,
    proof,
    begin,
    reveal,
    reset,
    isVrfPending: false,
  };
}
