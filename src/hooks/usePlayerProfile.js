'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { referralChainForWallet } from '@/lib/referral/walletChain';
import {
  resolvePlayerAvatarUrl,
  resolvePlayerDisplayName,
} from '@/lib/xProfile';

/**
 * Loads the connected wallet's profile (handle, X link, avatar) for UI chrome.
 */
export function usePlayerProfile() {
  const { address, connected, chain, isDemo } = usePlayWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!connected || !address || isDemo) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const profileChain = referralChainForWallet(address, chain);
      const qs = `wallet=${encodeURIComponent(address)}&chain=${encodeURIComponent(profileChain)}`;
      const res = await fetch(`/api/profile?${qs}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json) setProfile(json);
      else setProfile(null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [address, chain, connected, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdate = () => {
      void refresh();
    };
    window.addEventListener('aptcasino-profile-updated', onUpdate);
    return () => window.removeEventListener('aptcasino-profile-updated', onUpdate);
  }, [refresh]);

  const meta = profile?.profile ?? null;
  const twitterHandle = meta?.twitter_handle ?? null;
  const handle = meta?.handle ?? null;
  const avatarUrl = resolvePlayerAvatarUrl({
    avatarUrl: profile?.resolvedAvatarUrl ?? meta?.avatar_url,
    twitterHandle,
  });
  const displayName = resolvePlayerDisplayName({
    handle,
    twitterHandle,
    avatarUrl: profile?.resolvedAvatarUrl ?? meta?.avatar_url,
    wallet: address,
  });

  return {
    profile,
    handle,
    twitterHandle,
    avatarUrl,
    displayName,
    loading,
    refresh,
    hasX: !!twitterHandle,
  };
}
