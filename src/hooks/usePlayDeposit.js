'use client';

import { useSelector } from 'react-redux';
import { DEFAULT_PLAY_CHAIN, getPlayChainConfig } from '@/lib/chains/registry';
import { useSolanaDeposit } from '@/hooks/useSolanaDeposit';
import { useBackendDeposit } from '@/hooks/useBackendDeposit';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

/**
 * Multichain deposit — dispatches to the active chain's deposit flow.
 */
export function usePlayDeposit({ signAndSubmitTransaction, isDemo } = {}) {
  const activeChain = useSelector((s) => s.balance.activeChain) || DEFAULT_PLAY_CHAIN;
  const { signAndSubmitTransaction: aptosSign, account } = useWallet();
  const solana = useSolanaDeposit();
  const aptos = useBackendDeposit({
    signAndSubmitTransaction: signAndSubmitTransaction || aptosSign,
    isDemo,
  });

  const config = getPlayChainConfig(activeChain);

  const deposit = async (amountNative) => {
    if (config?.walletProvider === 'solana') {
      return solana.deposit(amountNative);
    }
    if (config?.walletProvider === 'aptos') {
      return aptos.deposit(amountNative);
    }
    return { success: false, message: `${config?.label ?? activeChain} deposits not wired yet` };
  };

  const isDepositing =
    config?.walletProvider === 'solana' ? solana.isDepositing : aptos.isDepositing;

  return { deposit, isDepositing, activeChain, chainLabel: config?.label };
}
