'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useIpoPurchase } from '@/hooks/useIpoPurchase';
import { useWalletSolBalance } from '@/hooks/useWalletSolBalance';
import { getStoredIpoReferrer } from '@/components/IpoRefCapture';
import { IPO_COPY } from '@/lib/config/ipo';
import IpoBanner from '@/components/IpoBanner';
import IpoAffiliateExplainer from '@/components/IpoAffiliateExplainer';
import IpoSwapCard from '@/components/IpoSwapCard';
import IpoRecentBuyersTicker from '@/components/IpoRecentBuyersTicker';
import {
  IpoWhatHappensNext,
  IpoVerifyWallets,
  IpoReferralShare,
  IpoPurchaseHistory,
} from '@/components/IpoBuyerConvenience';
import {
  IpoLiveCountdown,
  IpoFaq,
  IpoAddToken,
  IpoSharePurchase,
} from '@/components/IpoExtras';

function fmt(n, opts = {}) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, opts);
}

function fmtUsd(n) {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">{label}</p>
      <p className="text-lg md:text-xl font-bold text-white tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-[11px] text-white/45">{sub}</p> : null}
    </div>
  );
}

function ProgressBar({ pct, label }) {
  const w = Math.min(100, Math.max(0, pct || 0));
  return (
    <div>
      <div className="flex justify-between text-[11px] text-white/50 mb-2">
        <span>{label}</span>
        <span className="tabular-nums">{w.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-500"
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

export default function IpoPurchasePanel({
  compact = false,
  showBanner = true,
  showFullPageCta = true,
}) {
  const { publicKey, connected } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const address = publicKey?.toBase58() || null;
  const referrer = typeof window !== 'undefined' ? getStoredIpoReferrer() : null;

  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [me, setMe] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [solIn, setSolIn] = useState('');
  const [infoPanel, setInfoPanel] = useState('how'); // how | verify | faq | refer | board | me
  const [loading, setLoading] = useState(true);

  const { purchase, isPurchasing } = useIpoPurchase(config?.treasury, referrer);
  const { balance: walletSolBalance, spendable: spendableSol, loading: balanceLoading, refresh: refreshSolBalance } =
    useWalletSolBalance({ enabled: connected });

  const onSetMaxSol = useCallback(() => {
    if (spendableSol == null || spendableSol <= 0) return;
    const v = Math.floor(spendableSol * 1e6) / 1e6;
    setSolIn(String(v));
  }, [spendableSol]);

  const refresh = useCallback(async () => {
    try {
      const [cRes, sRes, lRes] = await Promise.all([
        fetch('/api/ipo/config'),
        fetch('/api/ipo/stats'),
        fetch('/api/ipo/leaderboard?limit=10'),
      ]);
      if (cRes.ok) setConfig(await cRes.json());
      if (sRes.ok) setStats(await sRes.json());
      if (lRes.ok) {
        const lj = await lRes.json();
        setLeaderboard(lj.leaderboard || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (!address) {
      setMe(null);
      return;
    }
    try {
      const r = await fetch(`/api/ipo/me?wallet=${encodeURIComponent(address)}`);
      if (r.ok) setMe(await r.json());
    } catch {
      /* ignore */
    }
  }, [address]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!address || !referrer || referrer === address) return;
    fetch('/api/ipo/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: address, referrerWallet: referrer }),
    }).catch(() => {});
  }, [address, referrer]);

  const solAmount = Number(solIn);
  const solUsd = config?.solUsdPrice ?? stats?.solUsdPrice;
  const aptcPrice = config?.aptcPriceUsd ?? stats?.aptcPriceUsd ?? 0.0004;
  const estAptc =
    Number.isFinite(solAmount) && solAmount > 0 && solUsd
      ? (solAmount * solUsd) / aptcPrice
      : 0;
  const estReward =
    estAptc > 0 && config
      ? estAptc * (config.stakingApyPct / 100) * (config.stakingLockDays / 365)
      : 0;

  const phase = stats?.phase ?? config?.phase ?? 'upcoming';
  const isLive = phase === 'live';
  const hasPurchases = Boolean(me?.summary?.purchaseCount || me?.summary?.pendingPurchases);
  const togglePanel = (id) => setInfoPanel((cur) => (cur === id ? null : id));

  const infoTabs = [
    { id: 'how', label: 'How it works' },
    { id: 'verify', label: 'Verify wallets' },
    { id: 'faq', label: 'FAQ' },
    { id: 'refer', label: 'Referrals' },
    { id: 'board', label: 'Leaderboard' },
    ...(connected
      ? [{ id: 'me', label: 'My position', badge: hasPurchases ? 'Live' : null }]
      : []),
  ];

  // After a successful buy, surface the position panel.
  useEffect(() => {
    if (hasPurchases && connected) setInfoPanel((cur) => cur || 'me');
  }, [hasPurchases, connected]);

  const onSwap = async () => {
    if (!connected) {
      openWalletModal(true);
      return;
    }
    const result = await purchase(solAmount);
    if (result?.success) {
      setSolIn('');
      await Promise.all([refresh(), refreshMe(), refreshSolBalance()]);
    }
  };

  return (
    <div className={compact ? 'space-y-5' : 'space-y-6'}>
      {showBanner ? <IpoBanner /> : null}

      <IpoRecentBuyersTicker phase={phase} />

      <div
        className={`grid gap-8 items-start grid-cols-1 ${
          compact
            ? 'lg:grid-cols-[minmax(0,460px)_1fr] xl:grid-cols-[minmax(0,480px)_1fr]'
            : 'lg:grid-cols-[minmax(0,520px)_1fr] xl:grid-cols-[minmax(0,580px)_1fr] 2xl:grid-cols-[minmax(0,640px)_1fr]'
        }`}
      >
        <IpoSwapCard
          solIn={solIn}
          setSolIn={setSolIn}
          estAptc={estAptc}
          estReward={estReward}
          solUsd={solUsd}
          aptcPrice={aptcPrice}
          isLive={isLive}
          isPurchasing={isPurchasing}
          phase={phase}
          connected={connected}
          onConnect={() => openWalletModal(true)}
          onSwap={onSwap}
          solAmount={solAmount}
          walletSolBalance={walletSolBalance}
          spendableSol={spendableSol}
          balanceLoading={balanceLoading}
          onSetMaxSol={onSetMaxSol}
        />

        {/* Stats + on-demand info — right on desktop */}
        <div className="space-y-4 order-2">
          <IpoLiveCountdown
            phase={phase}
            startAt={config?.startAt}
            endAt={config?.endAt}
            launchLabel={config?.sale?.launchLabel}
            endLabel={config?.sale?.endLabel}
          />

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Raised" value={fmtUsd(stats?.totalUsdRaised)} sub={`${fmt(stats?.totalSolRaised, { maximumFractionDigits: 2 })} SOL`} />
            <Stat label="APTC sold" value={fmt(stats?.aptcSold, { maximumFractionDigits: 0 })} sub={`of ${fmt(stats?.aptcCap, { maximumFractionDigits: 0 })}`} />
            <Stat label="Buyers" value={fmt(stats?.uniqueBuyers, { maximumFractionDigits: 0 })} sub="unique wallets" />
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
            <ProgressBar pct={stats?.pctOfRaise} label={`Raise progress · target ${fmtUsd(stats?.raiseTargetUsd)}`} />
            <ProgressBar pct={stats?.pctOfCap} label={`Allocation progress${stats?.oversubscribed ? ' · oversubscribed' : ''}`} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {infoTabs.map((tab) => {
              const active = infoPanel === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => togglePanel(tab.id)}
                  aria-expanded={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100'
                      : 'border-white/15 bg-white/[0.04] text-white/65 hover:text-white hover:border-white/25'
                  }`}
                >
                  {tab.label}
                  {tab.badge ? (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[8px] tracking-wider text-emerald-200">
                      {tab.badge}
                    </span>
                  ) : null}
                  <span className={`text-[9px] ${active ? 'text-fuchsia-200/80' : 'text-white/35'}`} aria-hidden>
                    {active ? '−' : '+'}
                  </span>
                </button>
              );
            })}
            {showFullPageCta ? (
              <Link
                href="/ipo"
                className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-200 hover:bg-fuchsia-500/15 transition-colors"
              >
                Full page →
              </Link>
            ) : null}
          </div>

          {infoPanel ? (
            <div className="rounded-2xl border border-white/10 bg-[#120010]/80 p-4 md:p-5">
              {infoPanel === 'how' ? (
                <IpoWhatHappensNext
                  bare
                  lockDays={config?.stakingLockDays}
                  apyPct={config?.stakingApyPct}
                />
              ) : null}

              {infoPanel === 'verify' ? (
                <div className="space-y-4">
                  <IpoVerifyWallets
                    bare
                    treasury={config?.treasury}
                    distributor={config?.aptcDistributor}
                    mint={config?.mint}
                  />
                  <IpoAddToken mint={config?.mint} />
                </div>
              ) : null}

              {infoPanel === 'faq' ? <IpoFaq /> : null}

              {infoPanel === 'refer' ? (
                <div className="space-y-4">
                  <IpoAffiliateExplainer />
                  <IpoReferralShare bare wallet={connected ? address : null} />
                </div>
              ) : null}

              {infoPanel === 'board' ? (
                <div className="rounded-xl border border-white/10 overflow-hidden -m-1">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-white/40">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Wallet</th>
                        <th className="px-4 py-3 text-right">USD</th>
                        <th className="px-4 py-3 text-right hidden sm:table-cell">APTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-white/40 text-xs">
                            {loading ? 'Loading…' : 'No purchases yet'}
                          </td>
                        </tr>
                      ) : (
                        leaderboard.map((row) => (
                          <tr key={row.wallet} className="text-white/80">
                            <td className="px-4 py-2.5 tabular-nums text-white/50">{row.rank}</td>
                            <td className="px-4 py-2.5 font-mono text-xs break-all">{row.wallet}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(row.totalUsd)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums hidden sm:table-cell">
                              {fmt(row.totalAptc, { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {infoPanel === 'me' && connected && address ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-200/80">
                      Your IPO position
                    </p>
                    <p className="font-mono text-[11px] text-white/50">
                      {address.slice(0, 6)}…{address.slice(-6)}
                    </p>
                  </div>
                  {!hasPurchases ? (
                    <div className="space-y-4">
                      <p className="text-xs text-white/45 border border-dashed border-white/10 rounded-xl p-4">
                        No IPO purchases linked to this wallet yet. Use the swap panel to deposit SOL → APTC.
                      </p>
                      <IpoAddToken mint={config?.mint} />
                      <IpoSharePurchase />
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-white/45">{IPO_COPY.connectHint}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Stat
                          label="Your SOL deposited"
                          value={`${fmt(me?.summary?.totalSolDeposited, { maximumFractionDigits: 4 })} SOL`}
                        />
                        <Stat
                          label="APTC purchased"
                          value={fmt(me?.summary?.totalAptcPurchased, { maximumFractionDigits: 2 })}
                        />
                        <Stat
                          label="Est. staking reward"
                          value={fmt(
                            me?.stakingPositions?.reduce((s, p) => s + (p.estimatedRewardAptc || 0), 0),
                            { maximumFractionDigits: 2 },
                          )}
                          sub={`${me?.summary?.stakingApyPct}% APY · ${me?.summary?.stakingLockDays}d lock`}
                        />
                        <Stat
                          label="Unlock"
                          value={
                            me?.summary?.nextUnlockAt
                              ? new Date(me.summary.nextUnlockAt).toLocaleDateString()
                              : me?.summary?.purchaseCount > 0
                                ? 'Staked'
                                : '—'
                          }
                          sub={
                            me?.summary?.nextUnlockAt
                              ? new Date(me.summary.nextUnlockAt).toLocaleTimeString()
                              : null
                          }
                        />
                        <Stat
                          label="Status"
                          value={
                            me?.summary?.pendingPurchases > 0
                              ? 'Settling…'
                              : me?.summary?.purchaseCount > 0
                                ? 'Fulfilled'
                                : 'No purchases'
                          }
                        />
                        <Stat
                          label="Affiliate accrued"
                          value={fmt(me?.affiliate?.accruedAptc, { maximumFractionDigits: 2 })}
                          sub="Payout after cliff"
                        />
                      </div>
                      <IpoAddToken mint={config?.mint} />
                      <IpoSharePurchase
                        aptcAmount={me?.summary?.totalAptcPurchased}
                        solAmount={me?.summary?.totalSolDeposited}
                      />
                      <IpoPurchaseHistory purchases={me?.purchases} />
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] text-white/35 px-1">
              Tap a button above for how it works, verify wallets, FAQ, referrals, or your position.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
