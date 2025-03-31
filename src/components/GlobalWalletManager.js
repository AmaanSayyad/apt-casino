"use client";
import React from 'react';
import { useVercelWalletPersistence } from '@/hooks/useVercelWalletPersistence';

/**
 * Global Wallet Manager
 * This component should be included in every page to ensure wallet persistence
 * Uses Vercel-specific persistence for better compatibility
 */
export default function GlobalWalletManager() {
  // Use Vercel-specific wallet persistence
  const { isConnected, address, isReconnecting, globalState } = useVercelWalletPersistence();
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔧 GlobalWalletManager state:', {
      isConnected,
      address,
      isReconnecting,
      globalState
    });
  }, [isConnected, address, isReconnecting, globalState]);
  
  // This component doesn't render anything, it just manages wallet state
  return null;
}
