'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { usePlayBalance } from '@/hooks/usePlayBalance';
import { setBalance } from '@/store/balanceSlice';
import { displayToRaw } from '@/lib/chains/registry';
import ProfileDashboard from '@/components/profile/ProfileDashboard';
import { referralChainForWallet } from '@/lib/referral/walletChain';
import {
  buildDemoGamesPayload,
  buildDemoProfilePayload,
  buildDemoReferralStatsPayload,
} from '@/lib/play/demoPlay';

export default function ProfilePage() {
  const { address, connected, chain, chainLabel } = usePlayWallet();
  const { balanceNative, symbol, chain: playChain } = usePlayBalance();
  const dispatch = useDispatch();
  const { demoMode } = useSelector((s) => s.balance);
  const nativeLabel = symbol || (chain === 'solana' ? 'SOL' : 'APT');

  const [profile, setProfile] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [games, setGames] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);

  const profileChain = referralChainForWallet(address, chain);

  const refresh = useCallback(async () => {
    if (!address || demoMode) return;
    setLoading(true);
    try {
      const qs = `wallet=${encodeURIComponent(address)}&chain=${encodeURIComponent(profileChain)}`;
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/profile?${qs}`),
        fetch(`/api/referrals/stats?wallet=${encodeURIComponent(address)}`),
      ]);
      const pJson = await pRes.json().catch(() => null);
      const sJson = await sRes.json().catch(() => null);
      if (pRes.ok) setProfile(pJson);
      if (sRes.ok) setReferralStats(sJson);
    } finally {
      setLoading(false);
    }
  }, [address, profileChain, demoMode]);

  const refreshGames = useCallback(async () => {
    if (!address || demoMode) return;
    setLoadingGames(true);
    try {
      const qs = `wallet=${encodeURIComponent(address)}&chain=${encodeURIComponent(profileChain)}`;
      const r = await fetch(`/api/profile/games?${qs}`);
      const j = await r.json().catch(() => null);
      if (r.ok) setGames(j);
    } finally {
      setLoadingGames(false);
    }
  }, [address, profileChain, demoMode]);

  useEffect(() => {
    if (demoMode) {
      setProfile(buildDemoProfilePayload(chain, balanceNative));
      setGames(buildDemoGamesPayload());
      setReferralStats(buildDemoReferralStatsPayload());
      setLoading(false);
      setLoadingGames(false);
      return;
    }
    void refresh();
  }, [demoMode, chain, balanceNative, refresh]);

  useEffect(() => {
    if (demoMode || !address) return;
    void refreshGames();
  }, [address, chain, demoMode, refreshGames]);

  return (
    <ProfileDashboard
      connected={connected}
      address={address}
      chain={chain}
      chainLabel={chainLabel}
      nativeLabel={nativeLabel}
      balanceNative={balanceNative}
      demoMode={demoMode}
      profile={profile}
      games={games}
      referralStats={referralStats}
      loading={loading}
      loadingGames={loadingGames}
      onRefresh={refresh}
      onRefreshGames={refreshGames}
      onSavedProfile={refresh}
      onCashbackClaimed={(balanceNative) => {
        if (balanceNative != null && playChain) {
          dispatch(setBalance(displayToRaw(balanceNative, playChain)));
        }
      }}
    />
  );
}
