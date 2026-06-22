'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { isChainUserSelected, setActiveChain } from '@/store/balanceSlice';
import { DEFAULT_PLAY_CHAIN, isPlayableChainId } from '@/lib/chains/registry';

/**
 * Keeps Redux play chain aligned with connected wallets only during initial setup.
 * Once the user picks a chain (or both wallets are connected), automatic switching stops.
 */
export function usePlayChainSync() {
  const dispatch = useDispatch();
  const solana = useSolanaWallet();
  const aptos = useAptosWallet();

  useEffect(() => {
    if (isChainUserSelected()) {
      return;
    }

    const solConnected = solana.connected && !!solana.publicKey;
    const aptConnected = aptos.connected && !!aptos.account?.address;

    if (solConnected && aptConnected) {
      return;
    }

    if (solConnected) {
      dispatch(setActiveChain('solana'));
    } else if (aptConnected && isPlayableChainId('aptos')) {
      dispatch(setActiveChain('aptos'));
    } else if (!solConnected && !aptConnected) {
      dispatch(setActiveChain(DEFAULT_PLAY_CHAIN));
    }
  }, [
    dispatch,
    solana.connected,
    solana.publicKey,
    aptos.connected,
    aptos.account?.address,
  ]);
}
