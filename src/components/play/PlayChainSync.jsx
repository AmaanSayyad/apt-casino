'use client';

import { usePlayChainSync } from '@/hooks/usePlayChainSync';
import { useServerBalanceSync } from '@/hooks/useServerBalanceSync';

export default function PlayChainSync() {
  usePlayChainSync();
  useServerBalanceSync();
  return null;
}
