'use client';

import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useSelector } from 'react-redux';
import {
  DEFAULT_PLAY_CHAIN,
  getPlayChainConfig,
  resolveActiveChain,
} from '@/lib/chains/registry';
import { DEMO_PLAY_WALLET } from '@/lib/play/demoPlay';
import { normalizeAuthWallet } from '@/lib/walletAuthMessage';

/** Wallet connected for the active play chain. Demo mode uses a synthetic address so games can run without signing. */
export function usePlayWallet() {
  const activeChain = resolveActiveChain(useSelector((s) => s.balance.activeChain));
  const demoMode = useSelector((s) => s.balance.demoMode);
  const config = getPlayChainConfig(activeChain);
  const aptos = useAptosWallet();
  const solana = useSolanaWallet();

  if (demoMode) {
    return {
      chain: activeChain,
      chainLabel: config?.label ?? activeChain,
      walletProvider: config?.walletProvider ?? 'solana',
      address: DEMO_PLAY_WALLET,
      connected: true,
      isDemo: true,
      solana,
      aptos,
    };
  }

  if (config?.walletProvider === 'solana') {
    const addr = solana.publicKey?.toBase58() || null;
    return {
      chain: activeChain,
      chainLabel: config.label,
      walletProvider: 'solana',
      address: addr,
      connected: solana.connected && !!addr,
      isDemo: false,
      solana,
      aptos: null,
    };
  }

  if (config?.walletProvider === 'aptos') {
    const raw = aptos.account?.address ? String(aptos.account.address) : null;
    const addr = raw ? normalizeAuthWallet(raw, 'aptos') : null;
    return {
      chain: activeChain,
      chainLabel: config.label,
      walletProvider: 'aptos',
      address: addr,
      connected: aptos.connected && !!addr,
      isDemo: false,
      aptos,
      solana: null,
    };
  }

  return {
    chain: activeChain,
    chainLabel: config?.label ?? activeChain,
    walletProvider: config?.walletProvider ?? null,
    address: null,
    connected: false,
    isDemo: false,
    aptos: null,
    solana: null,
  };
}
