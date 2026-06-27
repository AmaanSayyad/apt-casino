'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getPlayChainConfig, resolveActiveChain } from '@/lib/chains/registry';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { useWalletAuth } from '@/hooks/useWalletAuth';

/** Pre-sign wallet auth once per session so the first bet does not prompt unexpectedly. */
export function useWalletAuthWarmup() {
  const demoMode = useSelector((s) => s.balance.demoMode);
  const activeChain = resolveActiveChain(useSelector((s) => s.balance.activeChain));
  const config = getPlayChainConfig(activeChain);
  const playWallet = usePlayWallet();
  const { getWalletAuth } = useWalletAuth();

  useEffect(() => {
    if (demoMode) return;
    if (!playWallet.connected || !playWallet.address) return;
    if (config?.balanceMode !== 'server') return;
    void getWalletAuth(playWallet.address, activeChain).catch(() => {});
  }, [
    activeChain,
    config?.balanceMode,
    demoMode,
    getWalletAuth,
    playWallet.address,
    playWallet.connected,
  ]);
}
