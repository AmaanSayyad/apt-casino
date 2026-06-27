'use client';

import { useSessionTracker } from '@/hooks/useSessionTracker';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { useSelector } from 'react-redux';

/** Pings /api/session/ping while a play wallet is connected (feeds admin avg. time spent). */
export default function SessionTracker() {
  const { address, chain, connected } = usePlayWallet();
  const demoMode = useSelector((s) => s.balance.demoMode);
  useSessionTracker(demoMode ? null : connected ? address : null, chain);
  return null;
}
