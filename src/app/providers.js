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
import WalletModalHost from '@/components/WalletModalHost';
import SessionTracker from '@/components/SessionTracker';
import PlayChainSync from '@/components/play/PlayChainSync';
import { Network } from '@aptos-labs/ts-sdk';
import { DEFAULT_NETWORK } from '@/lib/aptos';
import { formatAptosWalletError, isBenignAptosWalletError } from '@/lib/wallet/aptosWalletErrors';
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';

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
                </ClientThemeProvider>
              </WalletStatusProvider>
            </NotificationProvider>
          </QueryClientProvider>
        </AptosWalletAdapterProvider>
      </SolanaWalletProvider>
    </Provider>
  );
}
