'use client';

import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { setBalance, setUserActiveChain } from '@/store/balanceSlice';

/**
 * One Solana connect path for app + IPO: syncs Redux play chain so the navbar
 * and Solana-only surfaces (IPO buy) share the same connected wallet.
 */
export function useConnectSolanaWallet() {
  const dispatch = useDispatch();
  const { connected, publicKey } = useSolanaWallet();
  const { disconnect: disconnectAptos } = useAptosWallet();
  const { setVisible: openSolanaModal } = useWalletModal();

  // Keep navbar / play wallet on Solana whenever this wallet is live.
  useEffect(() => {
    if (connected && publicKey) {
      dispatch(setUserActiveChain('solana'));
    }
  }, [connected, publicKey, dispatch]);

  const connect = useCallback(async () => {
    if (connected && publicKey) {
      dispatch(setUserActiveChain('solana'));
      return;
    }

    try {
      await disconnectAptos();
    } catch {
      /* ignore */
    }

    dispatch(setUserActiveChain('solana'));
    dispatch(setBalance('0'));
    openSolanaModal(true);
  }, [connected, publicKey, disconnectAptos, dispatch, openSolanaModal]);

  return { connect, connected, publicKey };
}
