'use client';

import { useSessionTracker } from '@/hooks/useSessionTracker';
import { usePlayWallet } from '@/hooks/usePlayWallet';

/** Pings /api/session/ping while a play wallet is connected (feeds admin avg. time spent). */
export default function SessionTracker() {
  const { address, chain, connected } = usePlayWallet();
  useSessionTracker(connected ? address : null, chain);
  return null;
}
