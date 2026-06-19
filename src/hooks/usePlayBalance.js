'use client';

import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setBalance,
  addToBalance,
  subtractFromBalance,
  setActiveChain,
} from '@/store/balanceSlice';
import {
  DEFAULT_PLAY_CHAIN,
  rawToDisplay,
  displayToRaw,
  getPlayChainConfig,
} from '@/lib/chains/registry';
import { postPlayBet } from '@/lib/play/clientApi';

/**
 * Chain-aware play balance: Redux holds raw units (lamports / octas / …).
 * Server-ledger chains debit/credit via /api/chains/[chain]/bet.
 */
export function usePlayBalance() {
  const dispatch = useDispatch();
  const { userBalance, activeChain, demoMode } = useSelector((s) => s.balance);
  const chain = activeChain || DEFAULT_PLAY_CHAIN;
  const config = getPlayChainConfig(chain);
  const unit = config?.units ?? 1;
  const symbol = config?.nativeSymbol ?? 'SOL';

  const balanceNative = rawToDisplay(userBalance, chain);
  const balanceRaw = userBalance;

  const setBalanceFromServer = useCallback(
    (raw) => {
      dispatch(setBalance(String(raw)));
    },
    [dispatch],
  );

  const usesServerLedger = config?.balanceMode === 'server';

  const debitNative = useCallback(
    async (amountNative, wallet, gameOptions = {}) => {
      const raw = displayToRaw(amountNative, chain);
      if (demoMode || !usesServerLedger) {
        dispatch(subtractFromBalance(String(raw)));
        return { ok: true, sessionId: null }; // Return null sessionId for demo/non-server modes
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      const result = await postPlayBet(chain, { 
        wallet, 
        action: 'debit', 
        amountNative,
        game: gameOptions.game,
        gameData: gameOptions.gameData,
        clientSeed: gameOptions.clientSeed,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return { 
        ok: true, 
        sessionId: result.sessionId,
        serverSeedHash: result.serverSeedHash,
      };
    },
    [chain, demoMode, dispatch, usesServerLedger],
  );

  const creditNative = useCallback(
    async (amountNative, wallet, verificationData = {}) => {
      const raw = displayToRaw(amountNative, chain);
      if (demoMode || !usesServerLedger) {
        dispatch(addToBalance(String(raw)));
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      const result = await postPlayBet(chain, {
        wallet,
        action: 'credit',
        amountNative,
        sessionId: verificationData.sessionId,
        outcome: verificationData.outcome,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return {
        ok: true,
        verifiedMultiplier: result.verifiedMultiplier,
        serverSeed: result.serverSeed,
      };
    },
    [chain, demoMode, dispatch, usesServerLedger],
  );

  const toRaw = useCallback((n) => displayToRaw(n, chain), [chain]);
  const fromRaw = useCallback((r) => rawToDisplay(r, chain), [chain]);

  return {
    chain,
    chainLabel: config?.label ?? chain,
    symbol,
    unit,
    demoMode,
    balanceNative,
    balanceRaw,
    setBalanceFromServer,
    debitNative,
    creditNative,
    toRaw,
    fromRaw,
    setActiveChain: (c) => dispatch(setActiveChain(c)),
  };
}
