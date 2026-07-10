'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaSync, FaSignOutAlt } from 'react-icons/fa';
import OtcLotteryAdminPanel from '@/components/OtcLotteryAdminPanel';
import KolAllocationsAdminPanel from '@/components/admin/KolAllocationsAdminPanel';
import StreamerRewardsAdminPanel from '@/components/admin/StreamerRewardsAdminPanel';
import PromotionsAdminPanel from '@/components/admin/PromotionsAdminPanel';
import TournamentsAdminPanel from '@/components/admin/TournamentsAdminPanel';
import GgrBuybackPanel from '@/components/GgrBuybackPanel';
import IpoPayoutsAdminPanel from '@/components/admin/IpoPayoutsAdminPanel';
import WalletIntelPanel from '@/components/admin/WalletIntelPanel';
import DangerZonePanel from '@/components/admin/DangerZonePanel';
import GameModePnLPanel from '@/components/admin/GameModePnLPanel';
import { walletAddressSearchVariants } from '@/lib/admin/walletAddressVariants';
import {
  AdminTable,
  Badge,
  ChainPills,
  EmptyState,
  fmtAvgSession,
  fmtNum,
  NetworkEconomicsTable,
  TreasuryFlowTable,
  Panel,
  SearchInput,
  SectionHeading,
  WalletExplorerLink,
  StatBox,
  TabNav,
  TableRow,
  THead,
} from '@/components/admin/ui';

const TOKEN_LS = 'apt_casino_admin_token';

function matchesWalletFilter(wallet, query) {
  const q = query.trim();
  if (!q) return true;
  const w = String(wallet || '').toLowerCase();
  const needle = q.toLowerCase();
  if (w.includes(needle)) return true;
  const variants = walletAddressSearchVariants(q).map((v) => v.toLowerCase());
  return variants.some((v) => v === w || w.includes(v) || v.includes(w));
}

const TABLE_TABS = new Set([
  'users',
  'player_pnl',
  'gameplay',
  'financial',
  'staking',
  'referrals',
  'daily_streak',
  'newsletter',
]);

function buildTabGroups(pendingCount, dangerCount) {
  return [
    {
      label: 'Intelligence',
      tabs: [
        { id: 'wallet_intel', label: 'Wallet intel' },
        { id: 'danger', label: 'Danger zone', badge: dangerCount },
      ],
    },
    {
      label: 'Ledger & play',
      tabs: [
        { id: 'users', label: 'House ledger' },
        { id: 'player_pnl', label: 'Player P&L' },
        { id: 'gameplay', label: 'Gameplay' },
      ],
    },
    {
      label: 'Finance & growth',
      tabs: [
        { id: 'financial', label: 'Financials', badge: pendingCount },
        { id: 'staking', label: 'Staking' },
        { id: 'daily_streak', label: 'Daily streaks' },
        { id: 'referrals', label: 'Referrals' },
        { id: 'tournaments', label: 'Contests' },
      ],
    },
    {
      label: 'Integrations',
      tabs: [
        { id: 'otc', label: 'OTC lottery' },
        { id: 'ipo_payouts', label: 'IPO payouts' },
        { id: 'promotions', label: 'Promotions' },
        { id: 'kol', label: 'KOL allocations' },
        { id: 'streamers', label: 'Streamer rewards' },
        { id: 'ggr', label: 'GGR buyback' },
        { id: 'newsletter', label: 'Newsletter' },
      ],
    },
  ];
}

function adminFetch(path, token, init = {}) {
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'x-admin-token': token,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('wallet_intel');
  const [search, setSearch] = useState('');
  const [financialWalletSearch, setFinancialWalletSearch] = useState('');

  const [stats, setStats] = useState(null);
  const [treasury, setTreasury] = useState(null);
  const [treasuryLoading, setTreasuryLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [playerPnl, setPlayerPnl] = useState([]);
  const [playerPnlSort, setPlayerPnlSort] = useState({ key: 'wagered', dir: 'desc' });
  const [transactions, setTransactions] = useState([]);
  const [bets, setBets] = useState([]);
  const [pendingWd, setPendingWd] = useState([]);
  const [staking, setStaking] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [subs, setSubs] = useState(null);
  const [subsError, setSubsError] = useState('');
  const [dailyStreakLeaders, setDailyStreakLeaders] = useState([]);
  const [dailyStreakRecent, setDailyStreakRecent] = useState([]);

  const [walletQuery, setWalletQuery] = useState('');
  const [walletIntel, setWalletIntel] = useState(null);
  const [walletIntelLoading, setWalletIntelLoading] = useState(false);
  const [walletIntelError, setWalletIntelError] = useState('');

  const [chainFilter, setChainFilter] = useState('ALL');
  const [wdActionId, setWdActionId] = useState(null);
  const [danger, setDanger] = useState(null);
  const [bannedWallets, setBannedWallets] = useState([]);
  const [loadedTabs, setLoadedTabs] = useState({});
  const [banAddressInput, setBanAddressInput] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [modeAnalytics, setModeAnalytics] = useState(null);

  const probeAuth = useCallback(async (token) => {
    const r = await adminFetch('/api/admin/stats', token);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${r.status}`);
    }
    return r.json();
  }, []);

  const fetchCoreData = useCallback(
    async (token) => {
      const t = token ?? adminToken;
      if (!t) return;

      await adminFetch('/api/admin/banned-wallets/reconcile', t, { method: 'POST' });

      const [statsJson, pendingRes, dangerRes, bannedRes] = await Promise.all([
        adminFetch('/api/admin/stats', t).then((r) => r.json()),
        adminFetch('/api/admin/withdrawals/pending', t),
        adminFetch('/api/admin/danger-zone', t),
        adminFetch('/api/admin/banned-wallets', t),
      ]);

      setStats(statsJson);
      if (pendingRes.ok) {
        const pj = await pendingRes.json();
        setPendingWd(pj.pending ?? []);
      }
      if (dangerRes.ok) setDanger(await dangerRes.json());
      if (bannedRes.ok) setBannedWallets((await bannedRes.json()).bans ?? []);
    },
    [adminToken],
  );

  const fetchTabData = useCallback(
    async (tab, token, force = false) => {
      const t = token ?? adminToken;
      if (!t) return;
      if (!force && tab !== 'gameplay' && loadedTabs[tab]) return;

      switch (tab) {
        case 'users': {
          const res = await adminFetch('/api/admin/users', t);
          if (res.ok) setUsers((await res.json()).users ?? []);
          break;
        }
        case 'player_pnl': {
          const res = await adminFetch('/api/admin/player-ledger', t);
          if (res.ok) setPlayerPnl((await res.json()).rows ?? []);
          break;
        }
        case 'financial': {
          const res = await adminFetch('/api/admin/transactions?limit=80', t);
          if (res.ok) setTransactions((await res.json()).transactions ?? []);
          break;
        }
        case 'gameplay': {
          const [betsRes, modeRes] = await Promise.all([
            adminFetch(`/api/admin/game-history?limit=500${chainFilter !== 'ALL' ? `&chain=${chainFilter}` : ''}`, t),
            adminFetch('/api/admin/mode-analytics', t),
          ]);
          if (betsRes.ok) setBets((await betsRes.json()).bets ?? []);
          if (modeRes.ok) setModeAnalytics(await modeRes.json());
          break;
        }
        case 'staking': {
          const res = await adminFetch('/api/admin/staking', t);
          if (res.ok) setStaking(await res.json());
          break;
        }
        case 'referrals': {
          const res = await adminFetch('/api/admin/referrals', t);
          if (res.ok) setReferrals((await res.json()).rows ?? []);
          break;
        }
        case 'newsletter': {
          const res = await adminFetch('/api/newsletter/list?limit=200', t);
          if (res.ok) {
            setSubs(await res.json());
            setSubsError('');
          } else {
            const sj = await res.json().catch(() => ({}));
            setSubs(null);
            setSubsError(sj.error || 'Newsletter load failed');
          }
          break;
        }
        case 'daily_streak': {
          const res = await adminFetch('/api/admin/daily-streak', t);
          if (res.ok) {
            const j = await res.json();
            setDailyStreakLeaders(j.leaders ?? []);
            setDailyStreakRecent(j.recent ?? []);
          }
          break;
        }
        default:
          break;
      }

      if (tab !== 'gameplay') {
        setLoadedTabs((prev) => ({ ...prev, [tab]: true }));
      }
    },
    [adminToken, chainFilter, loadedTabs],
  );

  const syncTerminal = useCallback(
    async (token) => {
      const t = token ?? adminToken;
      if (!t) return;
      setSyncing(true);
      setSessionError('');
      try {
        await fetchCoreData(t);
        await fetchTabData(activeTab, t, true);
        setLastSyncAt(new Date());
      } catch (e) {
        setSessionError(e.message || 'Sync failed');
        if (String(e.message).includes('401')) {
          setAuthorized(false);
        }
      } finally {
        setSyncing(false);
      }
    },
    [activeTab, adminToken, fetchCoreData, fetchTabData],
  );

  const refreshTreasury = useCallback(async () => {
    if (!adminToken) return;
    setTreasuryLoading(true);
    try {
      const r = await adminFetch('/api/admin/treasury-balances', adminToken);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Treasury failed');
      setTreasury(j);
    } catch {
      setTreasury(null);
    } finally {
      setTreasuryLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    try {
      const t = window.localStorage.getItem(TOKEN_LS);
      if (t) {
        setAdminToken(t);
        setTokenInput(t);
        probeAuth(t)
          .then((s) => {
            setStats(s);
            setAuthorized(true);
            void syncTerminal(t);
            void refreshTreasury();
          })
          .catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, [probeAuth, refreshTreasury, syncTerminal]);

  useEffect(() => {
    if (!authorized || !adminToken) return;
    void fetchTabData(activeTab, adminToken);
  }, [activeTab, adminToken, authorized, fetchTabData]);

  const unlock = async (e) => {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    setSessionError('');
    try {
      await probeAuth(t);
      setAdminToken(t);
      setAuthorized(true);
      setLoadedTabs({});
      window.localStorage.setItem(TOKEN_LS, t);
      await syncTerminal(t);
      await refreshTreasury();
    } catch (err) {
      setSessionError(err.message || 'Invalid token');
      setAuthorized(false);
    }
  };

  const signOut = () => {
    setAdminToken('');
    setTokenInput('');
    setAuthorized(false);
    setStats(null);
    setLoadedTabs({});
    window.localStorage.removeItem(TOKEN_LS);
  };

  const runWalletIntel = async () => {
    const q = walletQuery.trim();
    if (!q || !adminToken) return;
    setWalletIntelLoading(true);
    setWalletIntelError('');
    try {
      const r = await adminFetch(`/api/admin/wallet-insights?address=${encodeURIComponent(q)}`, adminToken);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Lookup failed');
      setWalletIntel(j);
    } catch (e) {
      setWalletIntel(null);
      setWalletIntelError(e.message || 'Lookup failed');
    } finally {
      setWalletIntelLoading(false);
    }
  };

  const approveWithdrawal = async (requestId) => {
    const chainLabel = pendingWd.find((w) => w.id === requestId)?.chain || 'chain';
    if (!adminToken || !window.confirm(`Approve and execute this ${chainLabel} withdrawal on-chain?`)) return;
    setWdActionId(requestId);
    try {
      const r = await adminFetch('/api/admin/withdrawals/approve', adminToken, {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Approve failed');
      await syncTerminal();
    } catch (e) {
      alert(e.message || 'Approve failed');
    } finally {
      setWdActionId(null);
    }
  };

  const rejectWithdrawal = async (requestId) => {
    if (!adminToken || !window.confirm('Reject this withdrawal and restore house balance?')) return;
    setWdActionId(requestId);
    try {
      const r = await adminFetch('/api/admin/withdrawals/reject', adminToken, {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Reject failed');
      await syncTerminal();
    } catch (e) {
      alert(e.message || 'Reject failed');
    } finally {
      setWdActionId(null);
    }
  };

  const filterRow = (wallet) => {
    if (!search.trim()) return true;
    return String(wallet).toLowerCase().includes(search.trim().toLowerCase());
  };

  const handlePlayerPnlSort = (key) => {
    setPlayerPnlSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    );
  };

  const sortedPlayerPnl = useMemo(() => {
    const filtered = playerPnl.filter((r) => filterRow(r.wallet));
    const { key, dir } = playerPnlSort;
    const mul = dir === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (key === 'joinedAt') {
        if (!a.joinedAt && !b.joinedAt) return 0;
        if (!a.joinedAt) return 1;
        if (!b.joinedAt) return -1;
        return (new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()) * mul;
      }

      const va = a[key] ?? 0;
      const vb = b[key] ?? 0;
      if (typeof va === 'string' || typeof vb === 'string') {
        return String(va).localeCompare(String(vb)) * mul;
      }
      return (Number(va) - Number(vb)) * mul;
    });
  }, [playerPnl, playerPnlSort, search]);

  if (!authorized) {
    return (
      <div className="site-page-top min-h-screen bg-sharp-black text-white flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.12)_0%,_transparent_55%)]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full" />
        <form
          onSubmit={unlock}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#120010]/95 backdrop-blur-xl p-8 space-y-5 shadow-2xl shadow-violet-950/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-700 flex items-center justify-center font-display font-bold text-sm shadow-lg">
              APT
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-violet-300/80">Restricted</p>
              <h1 className="text-xl font-display font-bold">Operations terminal</h1>
            </div>
          </div>
          <p className="text-sm text-white/50 leading-relaxed">
            Use your server <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">DASHBOARD_ADMIN_TOKEN</code>.
            Grants treasury, ledger, wallet intel, danger zone, contests, OTC, and GGR tools.
          </p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Admin token"
            className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            autoComplete="off"
          />
          {sessionError ? (
            <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
              {sessionError}
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl magic-gradient font-display font-bold text-sm shadow-lg shadow-red-magic/20 hover:opacity-95 transition-opacity"
          >
            Unlock terminal
          </button>
          <Link href="/" className="block text-center text-xs text-white/40 hover:text-violet-200 transition-colors">
            ← Back to site
          </Link>
        </form>
      </div>
    );
  }

  const real = stats?.real;
  const pendingCount = pendingWd.length;
  const dangerCount =
    (danger?.frequencyUsers?.length ?? 0) + (danger?.suspiciousUsers?.length ?? 0);
  const tabGroups = buildTabGroups(pendingCount, dangerCount);
  const activeTabMeta = tabGroups.flatMap((g) => g.tabs).find((t) => t.id === activeTab);

  return (
    <div className="site-page-top min-h-screen bg-[#060005] text-white pb-16 overflow-x-hidden max-w-[100vw]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.15),transparent)]" />

      <div className="relative max-w-[1680px] mx-auto w-full min-w-0 px-4 md:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-4 mb-6 border-b border-white/10 bg-[#060005]/85 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/90 to-fuchsia-800/90 items-center justify-center font-display text-xs font-bold shadow-md">
                APT
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-display font-bold">Core operations</h1>
                  {syncing ? <Badge tone="accent">Syncing</Badge> : lastSyncAt ? (
                    <Badge tone="neutral">Synced {lastSyncAt.toLocaleTimeString()}</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-white/40 mt-0.5 hidden sm:block">
                  Treasury · play economics · compliance queues
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('financial')}
                  className="text-xs px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-200 hover:bg-amber-500/25 transition-colors"
                >
                  {pendingCount} pending withdrawal{pendingCount !== 1 ? 's' : ''}
                </button>
              )}
              <button
                type="button"
                disabled={syncing}
                onClick={() => void syncTerminal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-sm hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                <FaSync className={syncing ? 'animate-spin text-violet-300' : 'text-white/50'} />
                {syncing ? 'Syncing…' : 'Sync'}
              </button>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                <FaSignOutAlt /> Sign out
              </button>
            </div>
          </div>
        </header>

        {sessionError ? (
          <p className="mb-6 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
            {sessionError}
          </p>
        ) : null}

        <section className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <SectionHeading
              title="Platform overview"
              description={overviewOpen ? 'Live aggregates from Supabase' : 'Collapsed — expand for KPIs and treasury'}
            />
            <button
              type="button"
              onClick={() => setOverviewOpen((o) => !o)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/50 hover:text-white hover:bg-white/5 shrink-0"
            >
              {overviewOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {overviewOpen && (
            <div className="space-y-6">
              {(() => {
                const solPlay = real?.platformPnLByNetwork?.solana;
                const solTreasury = stats?.treasuryByChain?.solana;
                const playPnl = real?.platformPnL ?? 0;
                const playPositive = playPnl >= 0;
                return (
                  <div className="grid gap-3 lg:grid-cols-3">
                    <StatBox
                      label="Play P&L (all-time)"
                      value={
                        solPlay
                          ? `${playPnl >= 0 ? '+' : ''}${fmtNum(playPnl, 4)} · ${solPlay.currency}`
                          : fmtNum(playPnl, 4)
                      }
                      hint="Σ(wager − gross return) from game_play_events. Short-term variance can be negative even with house edge."
                      variant={playPositive ? 'success' : 'danger'}
                    />
                    <StatBox
                      label="Treasury net float"
                      value={
                        solTreasury
                          ? `${solTreasury.netFlow >= 0 ? '+' : ''}${fmtNum(solTreasury.netFlow, 4)} ${solTreasury.currency}`
                          : '—'
                      }
                      hint="Gross deposits − completed withdrawals (custody, not play outcome)."
                      variant={solTreasury && solTreasury.netFlow >= 0 ? 'success' : 'warning'}
                    />
                    <StatBox
                      label="GGR estimate (30d)"
                      value={stats?.ggrEstimateUsd30d != null ? `$${fmtNum(stats.ggrEstimateUsd30d, 0)}` : '—'}
                      hint={`Theoretical edge on $${fmtNum(stats?.totalWageredUsd30d ?? 0, 0)} wagered (30d) — not realized P&L.`}
                      variant="accent"
                    />
                  </div>
                );
              })()}

              <div className="grid gap-4 xl:grid-cols-2">
                <NetworkEconomicsTable
                  rows={real?.platformPnLByNetwork}
                  title="Play economics by chain"
                />
                <TreasuryFlowTable rows={stats?.treasuryByChain} title="Treasury flows by chain" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <StatBox label="Rounds logged" value={fmtNum(real?.totalBets, 0)} variant="accent" />
                <StatBox
                  label="Σ wagered"
                  value={fmtNum(real?.totalVolume, 4)}
                  hint="Native units · do not sum across chains"
                />
                <StatBox
                  label="Player win rate"
                  value={real ? `${fmtNum(real.winRate, 1)}%` : '—'}
                  hint={
                    real?.pushes
                      ? `${fmtNum(real.wins, 0)}W / ${fmtNum(real.losses, 0)}L / ${fmtNum(real.pushes, 0)} push`
                      : `${fmtNum(real?.wins, 0)}W / ${fmtNum(real?.losses, 0)}L`
                  }
                />
                <StatBox label="Unique wallets" value={fmtNum(real?.totalUsers, 0)} hint="Play + ledger + tracked" />
                <StatBox label="Valid referrals" value={fmtNum(real?.totalReferrals, 0)} variant="success" />
                <StatBox
                  label="Avg. session"
                  value={fmtAvgSession(real?.averageSessionSeconds, real?.sessionSampleCount)}
                  hint={
                    real?.sessionSampleCount
                      ? `${fmtNum(real.sessionSampleCount, 0)} sessions (7d)`
                      : 'user_sessions (7d lookback)'
                  }
                  variant="accent"
                />
                <StatBox label="Deposit txs" value={fmtNum(real?.totalDeposits, 0)} />
                <StatBox label="Withdrawal txs" value={fmtNum(real?.totalWithdrawals, 0)} />
              </div>

              <Panel className="p-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Liquidity rails</p>
                    <p className="text-sm font-display font-semibold mt-1">Treasury EOA balances</p>
                    {treasury?.usdNote ? <p className="text-xs text-white/40 mt-0.5">{treasury.usdNote}</p> : null}
                    {treasury?.generatedAt ? (
                      <p className="text-[10px] text-white/30 mt-1 font-mono">
                        Snapshot: {new Date(treasury.generatedAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={treasuryLoading}
                    onClick={() => void refreshTreasury()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 disabled:opacity-50"
                  >
                    {treasuryLoading ? 'Refreshing…' : 'Refresh balances'}
                  </button>
                </div>
                {(treasury?.rows ?? []).length === 0 ? (
                  <div className="p-6">
                    <EmptyState title="Treasury not loaded" description="Hit Refresh balances or Sync." />
                  </div>
                ) : (
                  <AdminTable className="border-0 rounded-none" stickyHeader>
                    <THead cols={['Chain', 'Label', 'Address', 'Asset', 'Balance', '≈ USD', '']} />
                    <tbody>
                      {(treasury?.rows ?? []).map((row) => (
                        <TableRow key={`${row.chain}-${row.label}`}>
                          <td className="px-4 py-3 capitalize text-white/85">{row.chain}</td>
                          <td className="px-4 py-3 text-white/70">{row.label}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <WalletExplorerLink wallet={row.address} chain={row.chain} />
                          </td>
                          <td className="px-4 py-3 text-white/60 text-xs font-bold">{row.asset}</td>
                          <td className="px-4 py-3 font-mono text-sm">
                            {row.error ? (
                              <span className="text-amber-300/90 text-xs" title={row.error}>
                                {row.error}
                              </span>
                            ) : (
                              row.formatted
                            )}
                          </td>
                          <td className="px-4 py-3 text-white/70">{row.formattedUsd}</td>
                          <td className="px-4 py-3">
                            {row.explorerUrl ? (
                              <a
                                href={row.explorerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-cyan-400/90 hover:text-cyan-300 uppercase tracking-wider"
                              >
                                View
                              </a>
                            ) : null}
                          </td>
                        </TableRow>
                      ))}
                    </tbody>
                  </AdminTable>
                )}
              </Panel>
            </div>
          )}
        </section>

        <div className="grid w-full min-w-0 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8">
          <aside className="min-w-0 w-full lg:sticky lg:top-24 lg:self-start">
            <Panel className="p-4 hidden lg:block">
              <TabNav groups={tabGroups} activeTab={activeTab} onSelect={setActiveTab} />
            </Panel>
            <div className="lg:hidden w-full min-w-0">
              <label htmlFor="admin-tab-select" className="sr-only">
                Admin section
              </label>
              <select
                id="admin-tab-select"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm font-semibold text-white focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              >
                {tabGroups.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.tabs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                        {t.badge > 0 ? ` (${t.badge})` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </aside>

          <main className="min-w-0 w-full">
            <Panel className="min-w-0 overflow-hidden p-4 sm:p-5 md:p-6 lg:p-7">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-6 pb-5 border-b border-white/10">
                <div className="min-w-0">
                  <h2 className="text-lg font-display font-semibold">{activeTabMeta?.label ?? 'Workspace'}</h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    {activeTab === 'wallet_intel' && 'Cross-chain wallet lookup and risk signals'}
                    {activeTab === 'danger' && 'Bans, freezes, frequency review, win streaks'}
                    {activeTab === 'financial' && 'Manual withdrawals and cash flow'}
                    {activeTab === 'ipo_payouts' && 'IPO staking rewards and affiliate payout queue'}
                    {activeTab === 'gameplay' && 'Recent bets from game_play_events'}
                    {activeTab === 'daily_streak' && 'Wallets who claimed daily streak APTC'}
                    {TABLE_TABS.has(activeTab) && activeTab !== 'financial' && activeTab !== 'gameplay' && 'Filterable ledger data'}
                  </p>
                </div>
                {TABLE_TABS.has(activeTab) && activeTab !== 'financial' && (
                  <div className="w-full sm:w-auto sm:max-w-md min-w-0">
                    <SearchInput
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter by wallet…"
                      className="w-full"
                    />
                  </div>
                )}
              </div>

          {activeTab === 'wallet_intel' && (
            <WalletIntelPanel
              walletQuery={walletQuery}
              setWalletQuery={setWalletQuery}
              onAnalyze={() => void runWalletIntel()}
              loading={walletIntelLoading}
              error={walletIntelError}
              intel={walletIntel}
              onBanPrefill={(addr) => {
                setBanAddressInput(addr);
                setBanReasonInput('Flagged from wallet intel');
                setActiveTab('danger');
              }}
            />
          )}

          {activeTab === 'danger' && (
            <DangerZonePanel
              adminToken={adminToken}
              danger={danger}
              bannedWallets={bannedWallets}
              onRefresh={() => void syncTerminal()}
              onApproveWithdrawal={approveWithdrawal}
              onRejectWithdrawal={rejectWithdrawal}
              wdActionId={wdActionId}
              banAddressInput={banAddressInput}
              setBanAddressInput={setBanAddressInput}
              banReasonInput={banReasonInput}
              setBanReasonInput={setBanReasonInput}
            />
          )}

          {activeTab === 'users' && (
            users.filter((u) => filterRow(u.userAddress)).length === 0 ? (
              <EmptyState title="No ledger rows" description="Sync terminal or adjust your wallet filter." />
            ) : (
              <AdminTable stickyHeader>
                <THead cols={['Wallet', 'Chain', 'Balance', 'Bets', 'Volume', 'Referrals']} />
                <tbody>
                  {users.filter((u) => filterRow(u.userAddress)).map((u) => (
                    <TableRow key={`${u.userAddress}-${u.chain}`}>
                      <td className="px-4 py-3 font-mono text-xs">
                        <WalletExplorerLink wallet={u.userAddress} chain={u.chain} />
                      </td>
                      <td className="px-4 py-3 capitalize">{u.chain}</td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {fmtNum(u.balance)} <span className="text-white/40">{u.currency}</span>
                      </td>
                      <td className="px-4 py-3">{u.activity?.bets ?? 0}</td>
                      <td className="px-4 py-3 font-mono">{fmtNum(u.activity?.volume)}</td>
                      <td className="px-4 py-3">{u.referralCount}</td>
                    </TableRow>
                  ))}
                </tbody>
              </AdminTable>
            )
          )}

          {activeTab === 'player_pnl' && (
            <div className="space-y-4">
              <p className="text-xs text-white/45 max-w-3xl leading-relaxed">
                Per-wallet financial summary. Deposited = on-chain top-ups. Withdrawn = completed payouts.
                Avail. balance = house funds they can still withdraw. Player P&L = (Withdrawn + Avail.) − Deposited;
                positive means the user is net-up.
              </p>
              {sortedPlayerPnl.length === 0 ? (
                <EmptyState title="No P&L rows" description="Player ledger populates after deposits and play." />
              ) : (
                <AdminTable stickyHeader>
                  <THead
                    cols={[
                      'Player',
                      'Currency',
                      { key: 'joinedAt', label: 'Joined', sortable: true },
                      'Deposited',
                      'Withdrawn',
                      'Avail. balance',
                      'Player P&L',
                      'Bets',
                      'Wagered',
                    ]}
                    sortKey={playerPnlSort.key}
                    sortDir={playerPnlSort.dir}
                    onSort={handlePlayerPnlSort}
                  />
                  <tbody>
                    {sortedPlayerPnl.map((r) => (
                      <TableRow key={`${r.wallet}-${r.chain}`}>
                        <td className="px-4 py-3 font-mono text-xs">
                          <WalletExplorerLink wallet={r.wallet} chain={r.chain} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone="neutral">{r.currency}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                          {r.joinedAt ? new Date(r.joinedAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono">{fmtNum(r.deposited)}</td>
                        <td className="px-4 py-3 font-mono">{fmtNum(r.withdrawn)}</td>
                        <td className="px-4 py-3 font-mono text-amber-200">{fmtNum(r.withdrawableNow ?? r.balance)}</td>
                        <td className="px-4 py-3 font-mono">
                          <span className={r.playerPnL >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            {fmtNum(r.playerPnL)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{r.bets}</td>
                        <td className="px-4 py-3 font-mono">{fmtNum(r.wagered)}</td>
                      </TableRow>
                    ))}
                  </tbody>
                </AdminTable>
              )}
            </div>
          )}

          {activeTab === 'gameplay' && (
            <div className="space-y-8">
              <GameModePnLPanel modes={modeAnalytics?.modes} totalRounds={modeAnalytics?.totalRounds} />
              <SectionHeading title="Recent bets" description="Latest rounds from game_play_events" />
              <ChainPills
                options={['ALL', 'solana', 'aptos']}
                value={chainFilter}
                onChange={setChainFilter}
              />
              {bets.filter((b) => filterRow(b.wallet)).length === 0 ? (
                <EmptyState title="No bets" description="Try another chain filter or sync terminal." />
              ) : (
                <AdminTable className="max-h-[560px] overflow-y-auto" stickyHeader>
                  <THead cols={['Time', 'Chain', 'Game', 'Wallet', 'Bet', 'Payout', 'House']} />
                  <tbody>
                    {bets.filter((b) => filterRow(b.wallet)).map((b) => (
                      <TableRow key={b.id}>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-white/60">
                          {new Date(b.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 capitalize text-xs">{b.chain}</td>
                        <td className="px-4 py-2.5 text-xs">{b.game}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">
                          <WalletExplorerLink wallet={b.wallet} chain={b.chain} />
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">{fmtNum(b.bet)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{fmtNum(b.payout)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">
                          <span className={b.housePnL >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}>
                            {fmtNum(b.housePnL)}
                          </span>
                        </td>
                      </TableRow>
                    ))}
                  </tbody>
                </AdminTable>
              )}
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Wallet filter</p>
                  <p className="text-xs text-white/40 mt-1 max-w-xl">
                    Enter a Solana or Aptos address to show only that wallet&apos;s pending withdrawals and deposit/withdrawal history.
                  </p>
                </div>
                <div className="flex w-full sm:w-auto sm:min-w-[320px] gap-2">
                  <SearchInput
                    value={financialWalletSearch}
                    onChange={(e) => setFinancialWalletSearch(e.target.value)}
                    placeholder="Wallet address…"
                    className="w-full"
                  />
                  {financialWalletSearch.trim() ? (
                    <button
                      type="button"
                      onClick={() => setFinancialWalletSearch('')}
                      className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/5"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              {(() => {
                const filterFinancialWallet = (wallet) =>
                  matchesWalletFilter(wallet, financialWalletSearch);
                const filteredPending = pendingWd.filter((w) => filterFinancialWallet(w.wallet));
                const filteredTransactions = transactions.filter((t) => filterFinancialWallet(t.wallet));

                return (
                  <>
              <div>
                <SectionHeading
                  title="Pending withdrawals"
                  description={
                    financialWalletSearch.trim()
                      ? `Showing ${filteredPending.length} pending for this wallet.`
                      : 'Amounts over manual USD threshold — approve to execute on-chain.'
                  }
                />
                {filteredPending.length === 0 ? (
                  <EmptyState
                    title={financialWalletSearch.trim() ? 'No pending withdrawals' : 'Queue clear'}
                    description={
                      financialWalletSearch.trim()
                        ? 'This wallet has no withdrawals awaiting manual review.'
                        : 'No withdrawals awaiting manual review.'
                    }
                  />
                ) : (
                  <AdminTable stickyHeader>
                    <THead cols={['Wallet', 'Chain', 'Gross', 'USD est.', 'Created', 'Action']} />
                    <tbody>
                      {filteredPending.map((w) => (
                        <TableRow key={w.id}>
                          <td className="px-4 py-3 font-mono text-xs">
                            <WalletExplorerLink wallet={w.wallet} chain={w.chain} />
                          </td>
                          <td className="px-4 py-3 capitalize">{w.chain}</td>
                          <td className="px-4 py-3 font-mono">{fmtNum(w.gross_apt)}</td>
                          <td className="px-4 py-3 font-mono text-amber-200">${fmtNum(w.usd_estimate, 2)}</td>
                          <td className="px-4 py-3 text-xs text-white/50">
                            {new Date(w.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {w.chain === 'aptos' || w.chain === 'solana' ? (
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={wdActionId === w.id}
                                  onClick={() => void approveWithdrawal(w.id)}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={wdActionId === w.id}
                                  onClick={() => void rejectWithdrawal(w.id)}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-rose-500/50 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-white/40 text-xs">Unsupported</span>
                            )}
                          </td>
                        </TableRow>
                      ))}
                    </tbody>
                  </AdminTable>
                )}
              </div>
              <div>
                <SectionHeading
                  title="Recent deposits & withdrawals"
                  description={
                    financialWalletSearch.trim()
                      ? `Showing ${filteredTransactions.length} transactions for this wallet.`
                      : undefined
                  }
                />
                {filteredTransactions.length === 0 ? (
                  <EmptyState
                    title="No transactions"
                    description={
                      financialWalletSearch.trim()
                        ? 'No deposits or withdrawals logged for this wallet address.'
                        : 'Deposit and withdrawal activity will appear here.'
                    }
                  />
                ) : (
                  <AdminTable className="max-h-[420px] overflow-y-auto" stickyHeader>
                    <THead cols={['Time', 'Type', 'Wallet', 'Chain', 'Amount', 'Status']} />
                    <tbody>
                      {filteredTransactions.map((t) => (
                        <TableRow key={t.id}>
                          <td className="px-4 py-2.5 text-xs text-white/50">{new Date(t.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-2.5 capitalize text-xs">
                            <Badge tone={t.type === 'deposit' ? 'success' : 'warning'}>{t.type}</Badge>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs">
                            <WalletExplorerLink wallet={t.wallet} chain={t.chain} />
                          </td>
                          <td className="px-4 py-2.5 capitalize text-xs">{t.chain}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">
                            {fmtNum(t.amount)} {t.currency}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-white/60">{t.status}</td>
                        </TableRow>
                      ))}
                    </tbody>
                  </AdminTable>
                )}
              </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'staking' && (
            !staking ? (
              <EmptyState title="Staking data not loaded" description="Run Sync to fetch pool stats." />
            ) : (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatBox label="Active positions" value={staking.summary?.activePositions} variant="accent" />
                  <StatBox
                    label="Wallets staking"
                    value={staking.summary?.distinctWallets}
                    hint={`${staking.summary?.claimedPositions ?? 0} claimed`}
                  />
                  <StatBox label="Principal locked" value={fmtNum(staking.summary?.principalLocked)} hint="APTC" variant="success" />
                  <StatBox label="Est. payout" value={fmtNum(staking.summary?.estPayout)} hint="APTC" />
                </div>
                {staking.maturity && (
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      ['≤ 7 days', staking.maturity.within7d],
                      ['8–30 days', staking.maturity.within30d],
                      ['30+ days', staking.maturity.later],
                    ].map(([label, bucket]) => (
                      <Panel key={label} className="p-4">
                        <p className="text-[10px] uppercase tracking-widest text-violet-300/70">{label}</p>
                        <p className="text-sm mt-2">
                          {bucket.positions} pos · {fmtNum(bucket.principal, 0)} APTC principal
                        </p>
                        <p className="text-xs text-white/40 mt-1">Est. {fmtNum(bucket.estPayout, 0)} payout</p>
                      </Panel>
                    ))}
                  </div>
                )}
                <AdminTable stickyHeader>
                  <THead cols={['Pool', 'Active', 'Wallets', 'Principal']} />
                  <tbody>
                    {(staking.poolStats ?? []).map((p) => (
                      <TableRow key={p.poolKey}>
                        <td className="px-4 py-3 font-medium">{p.poolKey}</td>
                        <td className="px-4 py-3">{p.activePositions}</td>
                        <td className="px-4 py-3">{p.distinctWallets}</td>
                        <td className="px-4 py-3 font-mono">{fmtNum(p.principalLocked)}</td>
                      </TableRow>
                    ))}
                  </tbody>
                </AdminTable>
                {(staking.recentPositions ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                      Recent positions (newest)
                    </p>
                    <AdminTable className="max-h-80 overflow-y-auto" stickyHeader>
                      <THead cols={['Created', 'Wallet', 'Pool', 'Amount', 'Status', 'Unlock']} />
                      <tbody>
                        {staking.recentPositions.map((p) => (
                          <TableRow key={p.id}>
                            <td className="px-4 py-2 text-xs text-white/50">
                              {new Date(p.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs">
                              <WalletExplorerLink wallet={p.user_address} chain="solana" />
                            </td>
                            <td className="px-4 py-2 text-xs">{p.pool_key}</td>
                            <td className="px-4 py-2 font-mono text-xs">{fmtNum(p.amount, 0)}</td>
                            <td className="px-4 py-2">
                              <Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>
                            </td>
                            <td className="px-4 py-2 text-xs text-white/50">
                              {p.unlock_at ? new Date(p.unlock_at).toLocaleString() : '—'}
                            </td>
                          </TableRow>
                        ))}
                      </tbody>
                    </AdminTable>
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === 'referrals' && (
            referrals.filter((r) => filterRow(r.wallet)).length === 0 ? (
              <EmptyState title="No referral leaders" />
            ) : (
              <AdminTable stickyHeader>
                <THead cols={['Rank', 'Wallet', 'Code', 'Referrals', 'Earned (octas)']} />
                <tbody>
                  {referrals.filter((r) => filterRow(r.wallet)).map((r) => (
                    <TableRow key={r.wallet}>
                      <td className="px-4 py-3 text-violet-300 font-bold">#{r.rank}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <WalletExplorerLink wallet={r.wallet} chain={r.chain} />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{r.code ?? '—'}</td>
                      <td className="px-4 py-3">{r.referrals}</td>
                      <td className="px-4 py-3 font-mono">{fmtNum(r.earnedOctas, 0)}</td>
                    </TableRow>
                  ))}
                </tbody>
              </AdminTable>
            )
          )}

          {activeTab === 'daily_streak' && (
            <div className="space-y-8">
              {dailyStreakLeaders.filter((r) => filterRow(r.wallet)).length === 0 ? (
                <EmptyState
                  title="No daily streak claims yet"
                  description="Daily streak claims appear here once wallets start checking in daily (UTC)."
                />
              ) : (
                <div>
                  <SectionHeading title="Daily streak leaders" description="Total APTC claimed via daily sign-in streaks." />
                  <AdminTable stickyHeader>
                    <THead cols={['Wallet', 'Chain', 'Current', 'Best', 'Total claimed (APTC)']} />
                    <tbody>
                      {dailyStreakLeaders
                        .filter((r) => filterRow(r.wallet))
                        .map((r) => (
                          <TableRow key={`${r.wallet}-${r.chain}`}>
                            <td className="px-4 py-3 font-mono text-xs">
                              <WalletExplorerLink wallet={r.wallet} chain={r.chain} />
                            </td>
                            <td className="px-4 py-3 capitalize">{r.chain}</td>
                            <td className="px-4 py-3 font-mono text-sm">{r.currentStreak}</td>
                            <td className="px-4 py-3 font-mono text-sm text-amber-200">{r.longestStreak}</td>
                            <td className="px-4 py-3 font-mono text-sm">{fmtNum(r.totalAptcClaimed, 4)}</td>
                          </TableRow>
                        ))}
                    </tbody>
                  </AdminTable>
                </div>
              )}

              <div>
                <SectionHeading title="Recent daily streak claims" description="Latest daily check-ins (UTC)." />
                <AdminTable stickyHeader>
                  <THead cols={['Time', 'Wallet', 'Chain', 'Day', 'Reward (APTC)', 'Tx']} />
                  <tbody>
                    {dailyStreakRecent
                      .filter((r) => filterRow(r.wallet))
                      .slice(0, 200)
                      .map((r) => (
                        <TableRow key={r.id ?? `${r.wallet}-${r.createdAt}-${r.streakDay}`}>
                          <td className="px-4 py-2.5 whitespace-nowrap text-xs text-white/60">
                            {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs">
                            <WalletExplorerLink wallet={r.wallet} chain={r.chain} />
                          </td>
                          <td className="px-4 py-2.5 capitalize text-xs">{r.chain}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">{r.streakDay}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-emerald-300">{fmtNum(r.rewardAptc, 4)}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-white/50">
                            {r.claimTxHash ? (
                              <a
                                href={r.claimTxHash}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-cyan-400/90 hover:text-cyan-300 uppercase tracking-wider"
                              >
                                Tx
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                        </TableRow>
                      ))}
                  </tbody>
                </AdminTable>
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && <TournamentsAdminPanel adminToken={adminToken} />}
          {activeTab === 'otc' && <OtcLotteryAdminPanel adminToken={adminToken} />}
          {activeTab === 'ipo_payouts' && <IpoPayoutsAdminPanel adminToken={adminToken} />}
          {activeTab === 'promotions' && <PromotionsAdminPanel adminToken={adminToken} />}
          {activeTab === 'kol' && <KolAllocationsAdminPanel adminToken={adminToken} />}
          {activeTab === 'streamers' && <StreamerRewardsAdminPanel adminToken={adminToken} />}
          {activeTab === 'ggr' && <GgrBuybackPanel adminToken={adminToken} />}
          {activeTab === 'newsletter' && (
            <div>
              {subsError ? (
                <p className="text-rose-300 text-sm mb-4 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3">
                  {subsError}
                </p>
              ) : null}
              {!subs ? (
                <EmptyState title="Loading subscribers…" />
              ) : subs.subscribers?.length === 0 ? (
                <EmptyState title="No subscribers yet" />
              ) : (
                <AdminTable className="max-h-[520px] overflow-y-auto" stickyHeader>
                  <THead cols={['Email', 'Source', 'Signed up']} />
                  <tbody>
                    {subs.subscribers.map((s) => (
                      <TableRow key={s.id}>
                        <td className="px-4 py-3 font-mono text-xs">{s.email}</td>
                        <td className="px-4 py-3 text-white/60">{s.source}</td>
                        <td className="px-4 py-3 text-xs text-white/50">{new Date(s.created_at).toLocaleString()}</td>
                      </TableRow>
                    ))}
                  </tbody>
                </AdminTable>
              )}
            </div>
          )}
            </Panel>
          </main>
        </div>
      </div>
    </div>
  );
}
