'use client';

import { useEffect, useState } from 'react';
import ChainConnectModal from '@/components/wallet/ChainConnectModal';
import { OPEN_WALLET_MODAL_EVENT } from '@/hooks/useWalletStatus';

/** Listens for programmatic open-wallet requests (legacy connectWallet hooks). */
export default function WalletModalHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_WALLET_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_WALLET_MODAL_EVENT, onOpen);
  }, []);

  return <ChainConnectModal open={open} onClose={() => setOpen(false)} />;
}
