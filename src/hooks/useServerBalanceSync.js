'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setBalance, setLoading } from '@/store/balanceSlice';
import { getPlayChainConfig, resolveActiveChain } from '@/lib/chains/registry';
import { fetchPlayBalance } from '@/lib/play/clientApi';
import { usePlayWallet } from '@/hooks/usePlayWallet';

/**
 * Loads house balance from the server when a wallet connects.
 * Server-ledger chains must not rely on localStorage — it goes stale after bets.
 */
export function useServerBalanceSync() {
  const dispatch = useDispatch();
  const demoMode = useSelector((s) => s.balance.demoMode);
  const activeChain = resolveActiveChain(useSelector((s) => s.balance.activeChain));
  const config = getPlayChainConfig(activeChain);
  const playWallet = usePlayWallet();

  useEffect(() => {
    if (demoMode) return;
    if (config?.balanceMode !== 'server') return;
    if (!playWallet.connected || !playWallet.address) return;

    let cancelled = false;

    (async () => {
      try {
        dispatch(setLoading(true));
        const result = await fetchPlayBalance(activeChain, playWallet.address);
        if (!cancelled && result.ok && result.balanceRaw != null) {
          dispatch(setBalance(String(result.balanceRaw)));
        }
      } catch (error) {
        console.error(`${activeChain} balance sync failed:`, error);
      } finally {
        if (!cancelled) dispatch(setLoading(false));
      }
    })();

    const onFocus = () => {
      if (cancelled || demoMode) return;
      void fetchPlayBalance(activeChain, playWallet.address).then((result) => {
        if (!cancelled && result.ok && result.balanceRaw != null) {
          dispatch(setBalance(String(result.balanceRaw)));
        }
      });
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [
    activeChain,
    config?.balanceMode,
    demoMode,
    dispatch,
    playWallet.address,
    playWallet.connected,
  ]);
}
