'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { getPlayChainConfig, rawToDisplay } from '@/lib/chains/registry';
import { openHouseBalanceModal } from '@/hooks/useWalletStatus';
import ConnectWalletButton from './ConnectWalletButton';
import PlayWalletConnect from './wallet/PlayWalletConnect';

/**
 * Connect control for marketing / onboarding sections.
 * Disconnected → multichain picker. Connected → wallet chip with Manage (opens house balance modal).
 */
export default function PlayWalletButton({ className = '', variant = 'cta', label = 'Connect Wallet' }) {
  const [mounted, setMounted] = useState(false);
  const play = usePlayWallet();
  const { userBalance, isLoading: isLoadingBalance } = useSelector((state) => state.balance);
  const config = getPlayChainConfig(play.chain);
  const symbol = config?.nativeSymbol ?? 'SOL';
  const balanceFormatted = rawToDisplay(userBalance, play.chain).toFixed(3);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && play.connected) {
    return (
      <PlayWalletConnect
        className={className}
        onManageBalance={openHouseBalanceModal}
        balanceFormatted={balanceFormatted}
        balanceSymbol={symbol}
        isLoadingBalance={isLoadingBalance}
      />
    );
  }

  return <ConnectWalletButton className={className} variant={variant} label={label} />;
}
