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
import { useWalletAuth } from '@/hooks/useWalletAuth';

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
  const { getWalletAuth } = useWalletAuth();

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
    async (amountNative, wallet, game) => {
      const raw = displayToRaw(amountNative, chain);
      if (demoMode || !usesServerLedger) {
        dispatch(subtractFromBalance(String(raw)));
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      const walletAuth = await getWalletAuth(wallet, chain);
      if (!walletAuth) {
        return { ok: false, error: 'Sign the wallet auth message in your wallet to place bets.' };
      }
      const result = await postPlayBet(chain, {
        wallet,
        action: 'debit',
        amountNative,
        game,
        walletAuth,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return { ok: true };
    },
    [chain, demoMode, dispatch, getWalletAuth, usesServerLedger],
  );

  const creditNative = useCallback(
    async (amountNative, wallet, game) => {
      const raw = displayToRaw(amountNative, chain);
      if (demoMode || !usesServerLedger) {
        dispatch(addToBalance(String(raw)));
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      const walletAuth = await getWalletAuth(wallet, chain);
      if (!walletAuth) {
        return { ok: false, error: 'Sign the wallet auth message in your wallet to settle bets.' };
      }
      const result = await postPlayBet(chain, {
        wallet,
        action: 'credit',
        amountNative,
        game,
        walletAuth,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return { ok: true };
    },
    [chain, demoMode, dispatch, getWalletAuth, usesServerLedger],
  );

  const releaseStake = useCallback(
    async (wallet, game) => {
      if (demoMode || !usesServerLedger) {
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      const walletAuth = await getWalletAuth(wallet, chain);
      if (!walletAuth) {
        return { ok: false, error: 'Sign the wallet auth message in your wallet to settle bets.' };
      }
      const result = await postPlayBet(chain, {
        wallet,
        action: 'release_stake',
        game,
        walletAuth,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return { ok: true };
    },
    [chain, demoMode, dispatch, getWalletAuth, usesServerLedger],
  );

  const settleNative = useCallback(
    async (betAmountNative, payoutAmountNative, wallet, game) => {
      const betRaw = displayToRaw(betAmountNative, chain);
      const payoutRaw = displayToRaw(payoutAmountNative || 0, chain);
      if (demoMode || !usesServerLedger) {
        const current = BigInt(String(userBalance || '0'));
        const next = current - BigInt(betRaw) + BigInt(payoutRaw);
        dispatch(setBalance(String(next < 0n ? 0n : next)));
        return { ok: true };
      }
      if (!wallet) return { ok: false, error: 'Wallet required' };
      const walletAuth = await getWalletAuth(wallet, chain);
      if (!walletAuth) {
        return { ok: false, error: 'Sign the wallet auth message in your wallet to place bets.' };
      }
      const result = await postPlayBet(chain, {
        wallet,
        action: 'settle',
        betAmountNative,
        payoutAmountNative: payoutAmountNative || 0,
        game,
        walletAuth,
      });
      if (!result.ok) return result;
      dispatch(setBalance(String(result.balanceRaw ?? '0')));
      return { ok: true };
    },
    [chain, demoMode, dispatch, getWalletAuth, usesServerLedger, userBalance],
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
