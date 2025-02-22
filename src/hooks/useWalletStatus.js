'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { usePlayWallet } from '@/hooks/usePlayWallet';

const WalletStatusContext = createContext(null);

/** Dispatched when legacy code calls connectWallet() — opens multichain modal */
export const OPEN_WALLET_MODAL_EVENT = 'apt-casino:open-wallet-modal';

/** Dispatched to open house balance deposit / withdraw modal (Navbar listens). */
export const OPEN_BALANCE_MODAL_EVENT = 'apt-casino:open-balance-modal';

export function openHouseBalanceModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_BALANCE_MODAL_EVENT));
  }
}

export function WalletStatusProvider({ children }) {
  const isDev = process.env.NODE_ENV === 'development';
  const play = usePlayWallet();

  const [devWallet, setDevWallet] = useState({
    isConnected: false,
    address: null,
    chain: null,
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isDev) return;

    const savedState = localStorage.getItem('dev-wallet-state');
    if (savedState === 'connected') {
      setDevWallet({
        isConnected: true,
        address: '0x1234...dev',
        chain: { id: 'mainnet', name: 'Aptos Mainnet' },
      });
    }

    const handleToggle = () => {
      setDevWallet((prev) => {
        const newState = !prev.isConnected;
        localStorage.setItem(
          'dev-wallet-state',
          newState ? 'connected' : 'disconnected',
        );

        return newState
          ? {
              isConnected: true,
              address: '0x1234...dev',
              chain: { id: 'mainnet', name: 'Aptos Mainnet' },
            }
          : {
              isConnected: false,
              address: null,
              chain: null,
            };
      });
    };

    window.addEventListener('dev-wallet-toggle', handleToggle);
    return () => {
      window.removeEventListener('dev-wallet-toggle', handleToggle);
    };
  }, [isDev]);

  const connectWallet = useCallback(async () => {
    if (isDev) {
      localStorage.setItem('dev-wallet-state', 'connected');
      setDevWallet({
        isConnected: true,
        address: '0x1234...dev',
        chain: { id: 'mainnet', name: 'Aptos Mainnet' },
      });
      return;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPEN_WALLET_MODAL_EVENT));
    }
  }, [isDev]);

  const disconnectWallet = useCallback(async () => {
    if (isDev) {
      localStorage.setItem('dev-wallet-state', 'disconnected');
      setDevWallet({
        isConnected: false,
        address: null,
        chain: null,
      });
      return;
    }

    try {
      if (play.walletProvider === 'solana' && play.solana?.disconnect) {
        await play.solana.disconnect();
      }
      if (play.aptos?.disconnect) {
        await play.aptos.disconnect();
      }
    } catch (err) {
      setError('Failed to disconnect wallet: ' + (err?.message || String(err)));
    }
  }, [isDev, play]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const currentStatus = isDev
    ? devWallet
    : {
        isConnected: play.connected,
        address: play.address,
        chain: {
          id: play.chain,
          name: play.chainLabel ?? play.chain,
        },
      };

  return (
    <WalletStatusContext.Provider
      value={{
        ...currentStatus,
        isDev,
        connectWallet,
        disconnectWallet,
        resetError,
        error,
      }}
    >
      {children}
    </WalletStatusContext.Provider>
  );
}

export default function useWalletStatus() {
  const context = useContext(WalletStatusContext);
  if (!context) {
    throw new Error('useWalletStatus must be used within a WalletStatusProvider');
  }
  return context;
}
