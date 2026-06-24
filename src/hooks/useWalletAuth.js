'use client';

import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { DEFAULT_PLAY_CHAIN } from '@/lib/chains/registry';
import { signWalletAuth } from '@/lib/walletAuthClient';

/**
 * Returns a function that signs wallet-auth payloads for the active play chain.
 */
export function useWalletAuth() {
  const activeChain = useSelector((s) => s.balance.activeChain) || DEFAULT_PLAY_CHAIN;
  const { publicKey, signMessage: signSolanaMessage } = useSolanaWallet();
  const { account, signMessage: signAptosMessage } = useAptosWallet();

  const getWalletAuth = useCallback(
    async (wallet, chainOverride, options = {}) => {
      const chain = chainOverride || activeChain;
      const resolvedWallet =
        wallet ||
        (chain === 'solana' ? publicKey?.toBase58() : account?.address?.toString());

      if (!resolvedWallet) return null;

      return signWalletAuth({
        chain,
        wallet: resolvedWallet,
        signSolanaMessage: chain === 'solana' ? signSolanaMessage : null,
        signAptosMessage: chain === 'aptos' ? signAptosMessage : null,
        aptosPublicKey: account?.publicKey?.toString?.() ?? null,
        fresh: options.fresh === true,
      });
    },
    [activeChain, publicKey, account, signSolanaMessage, signAptosMessage],
  );

  return { getWalletAuth, activeChain };
}
