'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { setActiveChain } from '@/store/balanceSlice';
import { DEFAULT_PLAY_CHAIN, isPlayableChainId } from '@/lib/chains/registry';

/**
 * Keeps Redux play chain aligned with the connected wallet.
 * Default is Solana when nothing is connected.
 */
export function usePlayChainSync() {
  const dispatch = useDispatch();
  const solana = useSolanaWallet();
  const aptos = useAptosWallet();

  useEffect(() => {
    const solConnected = solana.connected && !!solana.publicKey;
    const aptConnected = aptos.connected && !!aptos.account?.address;

    if (solConnected) {
      dispatch(setActiveChain('solana'));
    } else if (aptConnected && isPlayableChainId('aptos')) {
      dispatch(setActiveChain('aptos'));
    } else {
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
