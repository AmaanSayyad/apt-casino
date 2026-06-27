'use client';

import { usePlayChainSync } from '@/hooks/usePlayChainSync';
import { useServerBalanceSync } from '@/hooks/useServerBalanceSync';
import { useWalletAuthWarmup } from '@/hooks/useWalletAuthWarmup';

export default function PlayChainSync() {
  usePlayChainSync();
  useServerBalanceSync();
  useWalletAuthWarmup();
  return null;
}
