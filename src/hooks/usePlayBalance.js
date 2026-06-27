'use client';

import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setBalance,
  addToBalance,
  subtractFromBalance,
  applyPlaySettlement,
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
 * Server-ledger chains debit/credit via /api/chains/[chain]/bet (no wallet auth — verified server-side).
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
    async (amountNative, wallet, game, gameData) => {
      const raw = displayToRaw(amountNative, chain);
      if (demoMode || !usesServerLedger) {
        dispatch(subtractFromBalance(String(raw)));
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      const result = await postPlayBet(chain, {
        wallet,
        action: 'debit',
        amountNative,
        game,
        gameData,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return {
        ok: true,
        roundId: result.roundId,
        serverSeedHash: result.serverSeedHash,
      };
    },
    [chain, demoMode, dispatch, usesServerLedger],
  );

  const creditNative = useCallback(
    async (amountNative, wallet, game, gameRound, roundId) => {
      const raw = displayToRaw(amountNative, chain);
      if (demoMode || !usesServerLedger) {
        dispatch(addToBalance(String(raw)));
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      if (!game || !gameRound) {
        return { ok: false, error: 'Game settlement data required.' };
      }
      const result = await postPlayBet(chain, {
        wallet,
        action: 'credit',
        amountNative,
        game,
        gameRound,
        roundId,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return { ok: true, payoutAmountNative: result.payoutAmountNative };
    },
    [chain, demoMode, dispatch, usesServerLedger],
  );

  const releaseStake = useCallback(
    async (wallet, game) => {
      if (demoMode || !usesServerLedger) {
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      const result = await postPlayBet(chain, {
        wallet,
        action: 'release_stake',
        game,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return { ok: true };
    },
    [chain, demoMode, dispatch, usesServerLedger],
  );

  const settleNative = useCallback(
    async (betAmountNative, payoutAmountNative, wallet, game, gameRound, roundId) => {
      const betRaw = displayToRaw(betAmountNative, chain);
      const payoutRaw = displayToRaw(payoutAmountNative || 0, chain);
      if (demoMode || !usesServerLedger) {
        dispatch(applyPlaySettlement({ betRaw, payoutRaw }));
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      if (!game || !gameRound) {
        return { ok: false, error: 'Game settlement data required.' };
      }
      const result = await postPlayBet(chain, {
        wallet,
        action: 'settle',
        betAmountNative,
        payoutAmountNative,
        game,
        gameRound,
        roundId,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return { ok: true, payoutAmountNative: result.payoutAmountNative };
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
    releaseStake,
    settleNative,
    toRaw,
    fromRaw,
    setActiveChain: (c) => dispatch(setActiveChain(c)),
  };
}
