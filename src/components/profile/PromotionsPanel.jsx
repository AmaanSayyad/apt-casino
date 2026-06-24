'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaGift, FaTicketAlt } from 'react-icons/fa';
import { openHouseBalanceModal } from '@/hooks/useWalletStatus';
import { useWalletAuth } from '@/hooks/useWalletAuth';

function getDeviceFingerprint() {
  try {
    const key = 'aptcasino_device_fp_v1';
    let v = window.localStorage.getItem(key);
    if (!v) {
      v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(key, v);
    }
    return v;
  } catch {
    return '';
  }
}

export default function PromotionsPanel({ profile, chain, wallet, onClaimed, onBalanceUpdated }) {
  const searchParams = useSearchParams();
  const { getWalletAuth } = useWalletAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const promotions = profile?.promotions;
  const [localClaimedCampaignIds, setLocalClaimedCampaignIds] = useState([]);

  const liveCoupons = promotions?.coupons ?? [];
  const liveDeals = promotions?.depositDeals ?? [];
  const hasCoupons = liveCoupons.length > 0;
  const hasDeals = liveDeals.length > 0;
  const claimedCampaignIds = useMemo(() => {
    const fromServer = (promotions?.couponClaims ?? []).map((c) => c.campaign_id).filter(Boolean);
    return new Set([...fromServer, ...localClaimedCampaignIds]);
  }, [promotions?.couponClaims, localClaimedCampaignIds]);

  const bestDeal = useMemo(() => {
    if (!hasDeals) return null;
    return [...liveDeals].sort((a, b) => (b.bonusUsdAptc || 0) + ((b.bonusBps || 0) * (b.minDepositUsd || 0)) / 10000 - ((a.bonusUsdAptc || 0) + ((a.bonusBps || 0) * (a.minDepositUsd || 0)) / 10000))[0];
  }, [hasDeals, liveDeals]);

  useEffect(() => {
    if (hasCoupons && !code) {
      const firstUnclaimed = liveCoupons.find((c) => !claimedCampaignIds.has(c.id));
      setCode(String((firstUnclaimed || liveCoupons[0]).code || ''));
    }
  }, [hasCoupons, liveCoupons, code, claimedCampaignIds]);

  useEffect(() => {
    const fromUrl = (searchParams?.get('coupon') || '').trim().toUpperCase();
    if (fromUrl) setCode(fromUrl);
  }, [searchParams]);

  const claimCoupon = async () => {
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const walletAuth = await getWalletAuth(wallet, chain, { fresh: true });
      if (!walletAuth) {
        throw new Error('Sign the wallet ownership prompt to claim this coupon.');
      }
      const res = await fetch('/api/promotions/coupon/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          chain,
          code,
          deviceFingerprint: getDeviceFingerprint(),
          walletAuth,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Claim failed');
      setMsg(`Coupon applied. +${Number(j.rewardSol || 0).toFixed(4)} SOL to your house balance.`);
      const claimedCoupon = liveCoupons.find((c) => String(c.code || '').toUpperCase() === code.trim().toUpperCase());
      if (claimedCoupon?.id) {
        setLocalClaimedCampaignIds((prev) =>
          prev.includes(claimedCoupon.id) ? prev : [...prev, claimedCoupon.id],
        );
      }
      if (j.newBalanceSol != null) {
        await onBalanceUpdated?.(Number(j.newBalanceSol));
      }
      await onClaimed?.();
    } catch (e) {
      setErr(e.message || 'Claim failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/25 via-[#1A0015]/75 to-violet-950/25 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FaTicketAlt className="text-blue-300" />
          <h3 className="font-display text-lg font-bold text-white">Promotions & coupon deals</h3>
        </div>
      </div>

      {!hasCoupons && !hasDeals ? (
        <p className="text-sm text-white/50">No active promotions right now.</p>
      ) : (
        <div className="space-y-4">
          {hasCoupons && (
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Coupon credit</p>
              <p className="text-sm text-white/70 mb-3">
                Apply a live coupon and receive instant SOL credit in your house balance (limited by wallet/device/IP).
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
                  placeholder="ENTER COUPON CODE"
                />
                <button
                  type="button"
                  disabled={
                    loading ||
                    !wallet ||
                    !code.trim() ||
                    (() => {
                      const selected = liveCoupons.find(
                        (c) => String(c.code || '').toUpperCase() === code.trim().toUpperCase(),
                      );
                      return !!(selected && claimedCampaignIds.has(selected.id));
                    })()
                  }
                  onClick={claimCoupon}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {(() => {
                    const selected = liveCoupons.find(
                      (c) => String(c.code || '').toUpperCase() === code.trim().toUpperCase(),
                    );
                    if (selected && claimedCampaignIds.has(selected.id)) return 'Claimed';
                    return loading ? 'Applying…' : 'Apply';
                  })()}
                </button>
              </div>
              {err ? <p className="mt-2 text-xs text-rose-300">{err}</p> : null}
              {msg ? <p className="mt-2 text-xs text-emerald-300">{msg}</p> : null}
              {(() => {
                const selected = liveCoupons.find(
                  (c) => String(c.code || '').toUpperCase() === code.trim().toUpperCase(),
                );
                if (!selected || !claimedCampaignIds.has(selected.id)) return null;
                return <p className="mt-2 text-xs text-cyan-300">This coupon is already claimed.</p>;
              })()}
            </div>
          )}

          {hasDeals && (
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Deposit deal boosts</p>
              {bestDeal ? (
                <p className="text-sm text-white/75 mb-3">
                  Best active deal: deposit at least <strong className="text-white">${Number(bestDeal.minDepositUsd || 0).toFixed(0)}</strong>
                  {' '}and get{' '}
                  <strong className="text-amber-300">
                    {bestDeal.bonusUsdAptc > 0
                      ? `$${Number(bestDeal.bonusUsdAptc).toFixed(0)} worth APTC`
                      : `${(Number(bestDeal.bonusBps || 0) / 100).toFixed(2)}% extra APTC`}
                  </strong>
                  {' '}bonus on top.
                </p>
              ) : null}
              <div className="space-y-2">
                {liveDeals.slice(0, 4).map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <span className="text-xs text-white/70">{deal.title}</span>
                    <span className="text-xs text-amber-300">
                      {deal.bonusUsdAptc > 0
                        ? `+$${Number(deal.bonusUsdAptc).toFixed(0)} APTC @ $${Number(deal.minDepositUsd || 0).toFixed(0)}`
                        : `+${(Number(deal.bonusBps || 0) / 100).toFixed(2)}% @ $${Number(deal.minDepositUsd || 0).toFixed(0)}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={openHouseBalanceModal}
                  className="inline-flex items-center gap-1 text-xs text-blue-magic hover:underline"
                >
                  <FaGift /> Make a qualifying deposit
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
