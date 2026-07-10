"use client";

import * as React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletStatusProvider } from '@/hooks/useWalletStatus';
import { NotificationProvider } from '@/components/NotificationSystem';
import ClientThemeProvider from '@/components/ClientThemeProvider';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import ReferralCapture from '@/components/ReferralCapture';
import SolanaWalletProvider from '@/components/SolanaWalletProvider';
import { WalletNativeBalanceProvider } from '@/components/wallet/WalletNativeBalanceProvider';
import WalletModalHost from '@/components/WalletModalHost';
import SessionTracker from '@/components/SessionTracker';
import PlayChainSync from '@/components/play/PlayChainSync';
import { Network } from '@aptos-labs/ts-sdk';
import { DEFAULT_NETWORK } from '@/lib/aptos';
import { formatAptosWalletError, isBenignAptosWalletError } from '@/lib/wallet/aptosWalletErrors';
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const APTOS_DAPP_NETWORK =
  DEFAULT_NETWORK === 'testnet'
    ? Network.TESTNET
    : DEFAULT_NETWORK === 'devnet'
      ? Network.DEVNET
      : Network.MAINNET;

const queryClient = new QueryClient();

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <SolanaWalletProvider>
        <WalletNativeBalanceProvider>
        <AptosWalletAdapterProvider
          autoConnect={false}
          dappConfig={{ network: APTOS_DAPP_NETWORK }}
          onError={(error) => {
            if (isBenignAptosWalletError(error)) return;
            console.error('Aptos wallet error:', formatAptosWalletError(error));
          }}
        >
          <QueryClientProvider client={queryClient}>
            <NotificationProvider>
              <WalletStatusProvider>
                <ClientThemeProvider>
                  <ReferralCapture />
                  <WalletModalHost />
                  <SessionTracker />
                  <PlayChainSync />
                  {children}
                  <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    closeOnClick
                    pauseOnHover
                    theme="dark"
                  />
                </ClientThemeProvider>
              </WalletStatusProvider>
            </NotificationProvider>
          </QueryClientProvider>
        </AptosWalletAdapterProvider>
        </WalletNativeBalanceProvider>
      </SolanaWalletProvider>
    </Provider>
  );
}
