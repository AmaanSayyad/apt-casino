'use client';

import { useEffect, useRef } from 'react';

const PING_INTERVAL_MS = 60_000;

export function useSessionTracker(
  walletAddress: string | null,
  chain: string | null,
) {
  const sessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = async (address: string, chainId: string) => {
    try {
      const res = await fetch('/api/session/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          chain: chainId,
          session_id: sessionIdRef.current ?? undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionIdRef.current = data.session_id ?? sessionIdRef.current;
      }
    } catch {
      /* non-fatal */
    }
  };

  const closeSession = async (address: string, chainId: string) => {
    if (!sessionIdRef.current) return;
    try {
      await fetch('/api/session/ping', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          wallet_address: address,
          chain: chainId,
        }),
        keepalive: true,
      });
    } catch {
      /* ignore */
    }
    sessionIdRef.current = null;
  };

  useEffect(() => {
    if (!walletAddress) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    const addr = walletAddress;
    const chainId = chain || 'aptos';

    void ping(addr, chainId);
    intervalRef.current = setInterval(() => void ping(addr, chainId), PING_INTERVAL_MS);

    const handleUnload = () => void closeSession(addr, chainId);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [walletAddress, chain]);
}
