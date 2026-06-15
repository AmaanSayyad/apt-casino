'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { getBrowserSolanaRpcEndpoint } from '@/lib/solana/config';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function SolanaWalletProvider({ children }) {
  const [endpoint, setEndpoint] = useState(() => getBrowserSolanaRpcEndpoint());

  useEffect(() => {
    setEndpoint(getBrowserSolanaRpcEndpoint());
  }, []);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
