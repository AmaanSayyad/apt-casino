'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/layout/PageShell';
import ChainConnectModal from '@/components/wallet/ChainConnectModal';
import { CHAIN_UI } from '@/lib/chains/chainUi';
import { explorerAddressUrl, explorerTxUrl } from '@/lib/chains/explorer';
import {
  FaCopy,
  FaCheck,
  FaUser,
  FaArrowDown,
  FaArrowUp,
  FaTrophy,
  FaDice,
  FaExternalLinkAlt,
  FaEdit,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaSync,
  FaGamepad,
  FaGift,
  FaChartLine,
  FaHistory,
  FaBullhorn,
  FaVideo,
  FaTicketAlt,
  FaCoins,
} from 'react-icons/fa';
import ProfileEditModal from './ProfileEditModal';
import XProfileConnect from './XProfileConnect';
import CashbackPanel from './CashbackPanel';
import DepositAptcBonusPanel from './DepositAptcBonusPanel';
import DailyStreakPanel from './DailyStreakPanel';
import PromotionsPanel from './PromotionsPanel';
import PlayerAvatar from '@/components/PlayerAvatar';
import { resolvePlayerDisplayName, resolveLinkedTwitterHandle } from '@/lib/xProfile';
const TABS = [
  { id: 'overview', label: 'Overview', icon: FaChartLine },
  { id: 'games', label: 'Games', icon: FaDice },
  { id: 'activity', label: 'Activity', icon: FaHistory },
  { id: 'earn', label: 'Earn', icon: FaGift },
];

const GAME_META = {
  plinko: { label: 'Plinko', href: '/game/plinko', color: 'from-violet-500/20 to-fuchsia-500/10' },
  mines: { label: 'Mines', href: '/game/mines', color: 'from-amber-500/20 to-orange-500/10' },
  roulette: { label: 'Roulette', href: '/game/roulette', color: 'from-emerald-500/20 to-teal-500/10' },
  wheel: { label: 'Wheel', href: '/game/wheel', color: 'from-rose-500/20 to-red-500/10' },
};

export function fmtNative(n, opts = {}) {
  const { max = 4, min = 0 } = opts;
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return v.toLocaleString(undefined, { maximumFractionDigits: max, minimumFractionDigits: min });
}

export function fmtUsd(usd) {
  if (usd === null || usd === undefined || !Number.isFinite(Number(usd))) return null;
  return `$${Number(usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function fmtPct(n) {
  if (!Number.isFinite(Number(n))) return '—';
  return `${(Number(n) * 100).toFixed(1)}%`;
}

function short(addr) {
  if (!addr) return '—';
  const s = String(addr);
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

export default function ProfileDashboard({
  connected,
  address,
  chain,
  chainLabel,
  nativeLabel,
  balanceNative,
  demoMode,
  profile,
  games,
  referralStats,
  loading,
  loadingGames,
  onRefresh,
  onRefreshGames,
  onSavedProfile,
  onCashbackClaimed,
}) {
  const [tab, setTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [activityView, setActivityView] = useState('deposits');

  const chainUi = CHAIN_UI[chain] || CHAIN_UI.solana;
  const displayHandle = profile?.profile?.handle || null;
  const avatarUrl = profile?.resolvedAvatarUrl ?? profile?.profile?.avatar_url ?? null;
  const bio = profile?.profile?.bio || null;
  const twitter = profile?.profile?.twitter_handle || null;
  const linkedX = resolveLinkedTwitterHandle({ twitterHandle: twitter, avatarUrl });
  const playerDisplayName = resolvePlayerDisplayName({
    handle: displayHandle,
    twitterHandle: twitter,
    avatarUrl,
    wallet: address,
  });
  const onChainNative = profile?.onChainBalanceNative ?? profile?.onChainBalanceApt ?? null;
  const memberSince = profile?.profile?.created_at || null;
  const netPnl = games?.netProfitApt ?? 0;
  const winrate = games?.winrate ?? 0;
  const isUp = netPnl >= 0;

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!connected) {
    return (
      <PageShell
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Profile' }]}
        badge="Account"
        title="Your profile"
        description="Connect a wallet to view balances, game stats, deposits, and referrals."
        maxWidth="4xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-[#1A0015]/80 p-10 text-center"
        >
          <motion.div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-magic/30 to-blue-magic/30 border border-white/10"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FaUser className="text-3xl text-white/40" />
          </motion.div>
          <h2 className="font-display text-xl font-bold text-white">Wallet not connected</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            Connect on Solana or Aptos to unlock your player dashboard — house balance, P&amp;L, deposit
            history, and APTC rewards.
          </p>
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-fuchsia-900/30 transition hover:opacity-95"
          >
            Connect wallet
          </button>
          <ChainConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />
        </motion.div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Profile' }]}
      badge={chainLabel || chain}
      title={playerDisplayName}
      description="House balance, on-chain stats, and account activity for your connected wallet."
      maxWidth="6xl"
    >
      {/* Hero card */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1A0015]/90">
        <motion.div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-magic/15 blur-3xl"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-magic/15 blur-3xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />

        <motion.div
          className="relative p-6 md:p-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="flex flex-col gap-6 lg:flex-row lg:items-start"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-red-magic/50 to-blue-magic/50 opacity-80" />
                <PlayerAvatar
                  avatarUrl={avatarUrl}
                  twitterHandle={twitter}
                  handle={displayHandle}
                  wallet={address}
                  size={96}
                  rounded="rounded-2xl"
                />
                <motion.div
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-[#0f0f0f]"
                  title={chainLabel}
                >
                  <Image src={chainUi.logo} alt="" width={20} height={20} className="object-contain" />
                </motion.div>
              </div>

              <motion.div className="min-w-0 flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
                    {playerDisplayName}
                  </h2>
                  {demoMode && (
                    <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                      Demo
                    </span>
                  )}
                </div>

                <motion.div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="hidden font-mono text-xs text-white/60 sm:inline">{address}</code>
                  <code className="font-mono text-xs text-white/60 sm:hidden">{short(address)}</code>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                    title="Copy address"
                  >
                    {copied ? <FaCheck className="text-emerald-400" /> : <FaCopy className="text-xs" />}
                  </button>
                  <a
                    href={explorerAddressUrl(chain, address) ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/55 hover:bg-white/10"
                  >
                    Explorer <FaExternalLinkAlt className="text-[8px]" />
                  </a>
                </motion.div>

                {bio ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">{bio}</p> : null}

                {memberSince ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/45">
                    <FaClock /> Since {new Date(memberSince).toLocaleDateString()}
                  </span>
                ) : null}
              </motion.div>
            </div>

            <motion.div
              className="flex w-full shrink-0 flex-col gap-3 lg:ml-auto lg:w-auto lg:max-w-[280px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 }}
            >
              <XProfileConnect
                wallet={address}
                chain={chain}
                twitterHandle={linkedX || twitter}
                displayHandle={displayHandle}
                avatarUrl={avatarUrl}
                demoMode={demoMode}
                onSaved={onSavedProfile}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onRefresh();
                    onRefreshGames();
                  }}
                  disabled={loading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={demoMode}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Edit display name and bio"
                >
                  <FaEdit /> Profile
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick actions */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-6">
            <QuickLink href="/game" icon={<FaGamepad />} label="Play" primary />
            <QuickLink href="/referral" icon={<FaGift />} label="Referrals" />
            <QuickLink href="/stake" icon={<FaLock />} label="Stake" />
            <QuickLink href="/leaderboard" icon={<FaTrophy />} label="Leaderboard" />
          </div>

          {/* Balance strip */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <BalanceCard
              label="House balance"
              value={`${fmtNative(balanceNative)} ${nativeLabel}`}
              hint="Ready to bet or withdraw"
              accent="text-emerald-300"
              loading={loading}
            />
            <BalanceCard
              label="Wallet (on-chain)"
              value={onChainNative != null ? `${fmtNative(onChainNative)} ${nativeLabel}` : '—'}
              hint="Live chain balance"
              accent="text-purple-300"
              loading={loading}
            />
            <BalanceCard
              label="Net deposited"
              value={`${fmtNative(profile?.deposits?.totalNetCreditedApt ?? 0)} ${nativeLabel}`}
              hint={
                loading
                  ? '…'
                  : `${fmtNative(profile?.deposits?.totalApt ?? 0)} gross · ${fmtNative(profile?.deposits?.totalFeesApt ?? 0)} fees`
              }
              accent="text-amber-300"
              loading={loading}
            />
          </div>

          {/* P&L highlight */}
          {!loadingGames && games?.totalBets > 0 ? (
            <div className="mt-4 flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center">
              <motion.div className="flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Lifetime P&amp;L</p>
                <p className={`mt-1 font-display text-3xl font-bold tabular-nums ${isUp ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {isUp ? '+' : ''}
                  {fmtNative(netPnl)} {nativeLabel}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {games.totalBets} bets · {fmtPct(winrate)} win rate
                  {games.biggestWinApt
                    ? ` · Best +${fmtNative(games.biggestWinApt)} on ${games.biggestWinGame}`
                    : ''}
                </p>
              </motion.div>
              <div className="w-full sm:w-40">
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/40">
                  <span>Win rate</span>
                  <span>{fmtPct(winrate)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-red-magic to-blue-magic"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, winrate * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </section>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-1 scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              tab === id
                ? 'bg-gradient-to-r from-red-magic/80 to-blue-magic/80 text-white shadow-md'
                : 'text-white/45 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <Icon className="text-sm" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-6"
        >
          {tab === 'overview' && (
            <OverviewTab
              profile={profile}
              games={games}
              loading={loading}
              loadingGames={loadingGames}
              nativeLabel={nativeLabel}
              chain={chain}
              demoMode={demoMode}
              wallet={address}
              onRefresh={onRefresh}
              onHouseBalanceUpdated={onCashbackClaimed}
              onCashbackClaimed={onCashbackClaimed}
            />
          )}
          {tab === 'games' && (
            <GamesTab games={games} loadingGames={loadingGames} nativeLabel={nativeLabel} />
          )}
          {tab === 'activity' && (
            <ActivityTab
              profile={profile}
              chain={chain}
              nativeLabel={nativeLabel}
              demoMode={demoMode}
              view={activityView}
              onViewChange={setActivityView}
            />
          )}
          {tab === 'earn' && (
            <EarnTab
              profile={profile}
              referralStats={referralStats}
              loading={loading}
              chain={chain}
              wallet={address}
              demoMode={demoMode}
              onRefresh={onRefresh}
              onClaimed={onRefresh}
              onHouseBalanceUpdated={onCashbackClaimed}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {editing ? (
        <ProfileEditModal
          initial={profile?.profile}
          wallet={address}
          chain={chain}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await onSavedProfile();
          }}
        />
      ) : null}
    </PageShell>
  );
}

function OverviewTab({
  profile,
  games,
  loading,
  loadingGames,
  nativeLabel,
  chain,
  demoMode,
  wallet,
  onRefresh,
  onHouseBalanceUpdated,
  onCashbackClaimed,
}) {
  if (loading) return <SkeletonGrid cols={4} />;

  return (
    <div className="space-y-5">
      <PromotionsPanel
        profile={profile}
        chain={chain}
        wallet={wallet}
        onClaimed={onRefresh}
        onBalanceUpdated={onHouseBalanceUpdated}
      />
      <CashbackPanel
        cashback={profile?.cashback}
        nativeLabel={nativeLabel}
        chain={chain}
        wallet={wallet}
        demoMode={demoMode}
        onClaimed={async (balanceNative) => {
          await onCashbackClaimed?.(balanceNative);
          await onRefresh?.();
        }}
      />
      <DepositAptcBonusPanel
        depositAptcBonus={profile?.depositAptcBonus}
        chain={chain}
        wallet={wallet}
        demoMode={demoMode}
        onClaimed={onRefresh}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<FaArrowDown className="text-emerald-300" />}
        label="Deposits"
        value={String(profile?.deposits?.count ?? 0)}
        hint={`${fmtNative(profile?.deposits?.totalApt ?? 0)} ${nativeLabel} total`}
      />
      <StatCard
        icon={<FaArrowUp className="text-purple-300" />}
        label="Withdrawals"
        value={String((profile?.withdrawals?.count ?? 0) - (profile?.withdrawals?.pendingCount ?? 0))}
        hint={
          profile?.withdrawals?.pendingCount
            ? `${profile.withdrawals.pendingCount} pending`
            : `${fmtNative(profile?.withdrawals?.totalApt ?? 0)} ${nativeLabel} sent`
        }
      />
      <StatCard
        icon={<FaDice className="text-pink-300" />}
        label="Total bets"
        value={loadingGames ? '…' : String(games?.totalBets ?? 0)}
        hint={games ? `${fmtPct(games.winrate)} win rate` : 'No games yet'}
      />
      <StatCard
        icon={<FaTrophy className="text-amber-300" />}
        label="Net P&amp;L"
        value={
          games
            ? `${games.netProfitApt >= 0 ? '+' : ''}${fmtNative(games.netProfitApt)} ${nativeLabel}`
            : '—'
        }
        hint="All games"
        tone={games ? (games.netProfitApt >= 0 ? 'positive' : 'negative') : 'neutral'}
      />
      </div>
    </div>
  );
}

function GamesTab({ games, loadingGames, nativeLabel }) {
  if (loadingGames) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (!games?.totalBets) {
    return (
      <EmptyState
        icon={<FaDice className="text-3xl text-white/25" />}
        title="No games yet"
        description="Your provably fair game history will show up here after your first bet."
        action={{ href: '/game', label: 'Browse games' }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        <span className="font-semibold text-white/80">{fmtNative(games.totalWageredApt)} {nativeLabel}</span>{' '}
        wagered across {games.totalBets} bets
      </p>
      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {Object.keys(GAME_META).map((slug) => {
          const meta = GAME_META[slug];
          const g = games.perGame?.[slug];
          return (
            <motion.div
              key={slug}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            >
              <Link
                href={meta.href}
                className={`group block rounded-xl border border-white/10 bg-gradient-to-br ${meta.color} p-4 transition hover:border-white/25 hover:shadow-lg`}
              >
                <motion.div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70">{meta.label}</span>
                  <span className="text-[10px] text-white/40">{g?.bets ?? 0} bets</span>
                </motion.div>
                {g ? (
                  <>
                    <p className={`mt-3 font-display text-xl font-bold ${g.netProfitApt >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {g.netProfitApt >= 0 ? '+' : ''}
                      {fmtNative(g.netProfitApt)} {nativeLabel}
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">
                      {fmtPct(g.winrate)} wins · {fmtNative(g.wageredApt)} wagered
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-white/35">Not played</p>
                )}
                <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-wider text-blue-magic opacity-0 transition group-hover:opacity-100">
                  Play →
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function ActivityTab({ profile, chain, nativeLabel, demoMode, view, onViewChange }) {
  const hasDeposits = profile?.deposits?.recent?.length > 0;
  const hasWithdrawals = profile?.withdrawals?.recent?.length > 0;
  const depositEmptyHint = demoMode
    ? 'Demo mode uses play credits only — turn off Demo in the navbar and deposit SOL to see real deposit history here.'
    : 'Fund your house balance from the wallet menu in the game lobby.';

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="inline-flex rounded-lg border border-white/10 bg-black/40 p-1">
        {['deposits', 'withdrawals'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              view === v ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'deposits' ? (
        !hasDeposits ? (
          <EmptyState
            icon={<FaArrowDown className="text-3xl text-emerald-300/40" />}
            title="No deposits"
            description={depositEmptyHint}
            action={{ href: '/game', label: 'Go to games' }}
          />
        ) : (
          <TxTable
            headers={['When', 'Gross', 'Fee', 'Credited', 'Tx']}
            rows={profile.deposits.recent.map((d) => [
              fmtDate(d.createdAt),
              `${fmtNative(d.amountApt)} ${nativeLabel}`,
              `${fmtNative(d.feeApt)} ${nativeLabel}`,
              <span key="c" className="text-emerald-300">
                {fmtNative(d.netCreditedApt)} {nativeLabel}
              </span>,
              d.txHash ? (
                <TxLink chain={chain} hash={d.txHash} />
              ) : (
                '—'
              ),
            ])}
          />
        )
      ) : !hasWithdrawals ? (
        <EmptyState
          icon={<FaArrowUp className="text-3xl text-purple-300/40" />}
          title="No withdrawals"
          description="Withdrawals from your house balance will appear here."
        />
      ) : (
        <TxTable
          headers={['When', 'Gross', 'Net', 'Fee', 'Status', 'Tx']}
          rows={profile.withdrawals.recent.map((w) => [
            fmtDate(w.createdAt),
            <>
              {fmtNative(w.grossApt)} {nativeLabel}
              {w.usdEstimate != null ? (
                <span className="ml-1 text-[10px] text-white/40">({fmtUsd(w.usdEstimate)})</span>
              ) : null}
            </>,
            <span key="n" className="text-emerald-300">
              {fmtNative(w.netApt)} {nativeLabel}
            </span>,
            `${fmtNative(w.feeApt)} ${nativeLabel}`,
            <StatusBadge key="s" status={w.status} />,
            w.payoutTxHash ? <TxLink chain={chain} hash={w.payoutTxHash} /> : '—',
          ])}
        />
      )}
    </motion.div>
  );
}

function EarnTab({
  profile,
  referralStats,
  loading,
  chain,
  wallet,
  demoMode,
  onRefresh,
  onClaimed,
  onHouseBalanceUpdated,
}) {
  if (loading) return <SkeletonGrid cols={2} tall />;

  return (
    <div className="space-y-6">
      <PromotionsPanel
        profile={profile}
        chain={chain}
        wallet={wallet}
        onClaimed={onClaimed}
        onBalanceUpdated={onHouseBalanceUpdated}
      />
      <DailyStreakPanel
        dailyStreak={profile?.dailyStreak}
        chain={chain}
        wallet={wallet}
        demoMode={demoMode}
        onClaimed={onRefresh}
      />
      <DepositAptcBonusPanel
        depositAptcBonus={profile?.depositAptcBonus}
        chain={chain}
        wallet={wallet}
        demoMode={demoMode}
        onClaimed={onRefresh}
      />
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Referrals" icon={<FaGift className="text-blue-magic" />} href="/referral" linkLabel="Referral hub">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniStat label="Your code" value={profile?.referrals?.code ?? '—'} mono />
          <MiniStat label="Valid referrals" value={String(profile?.referrals?.validReferrals ?? 0)} />
          <MiniStat label="Pending" value={String(profile?.referrals?.pendingReferrals ?? 0)} hint="Awaiting deposit" />
          <MiniStat
            label="APTC earned"
            value={`${fmtNative(profile?.referrals?.earnedApt ?? 0)} APTC`}
            accent="text-emerald-300"
            hint={referralStats?.rank ? `Rank #${referralStats.rank}` : 'Share your code'}
          />
        </div>
      </Panel>

      <Panel title="APTC staking" icon={<FaLock className="text-emerald-300" />} href="/stake" linkLabel="Stake">
        {!profile?.staking?.activeCount ? (
          <p className="text-sm text-white/50">
            No active stakes. Lock APTC in the{' '}
            <Link href="/stake" className="text-blue-magic hover:underline">
              Stake
            </Link>{' '}
            page to earn yield.
          </p>
        ) : (
          <>
            <motion.div className="mb-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Positions" value={String(profile.staking.activeCount)} />
              <MiniStat label="Staked" value={`${fmtNative(profile.staking.totalActiveAptc)} APTC`} />
              <MiniStat
                label="Claimable"
                value={String(profile.staking.claimableCount)}
                accent={profile.staking.claimableCount ? 'text-amber-300' : undefined}
              />
            </motion.div>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-white/[0.03] text-left text-[10px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="px-3 py-2">Pool</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">APY</th>
                    <th className="px-3 py-2">Unlock</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.staking.positions.slice(0, 6).map((p) => {
                    const unlocked = p.status === 'active' && new Date(p.unlockAt).getTime() <= Date.now();
                    return (
                      <tr key={p.id} className="border-t border-white/5 text-white/80">
                        <td className="px-3 py-2 font-semibold">{p.lockDays}D</td>
                        <td className="px-3 py-2">{fmtNative(p.amount)} APTC</td>
                        <td className="px-3 py-2">{(p.apyBps / 100).toFixed(0)}%</td>
                        <td className="px-3 py-2 text-xs text-white/55">{fmtDate(p.unlockAt)}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={p.status === 'active' && unlocked ? 'claimable' : p.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </div>
    <EarnMoreWaysPanel />
    </div>
  );
}

function EarnMoreWaysPanel() {
  const opportunities = [
    {
      title: 'Go live and earn creator rewards',
      desc: 'Stream your gameplay and earn 0.1% / 0.2% / 0.3% of platform revenue at 5 / 15 / 30+ minutes.',
      href: '/live',
      cta: 'Start streaming',
      icon: <FaVideo className="text-cyan-300" />,
    },
    {
      title: 'Grow referrals',
      desc: 'Share your code and earn up to 20% of each qualified deposit as APTC referral rewards.',
      href: '/referral',
      cta: 'Open referrals',
      icon: <FaBullhorn className="text-blue-300" />,
    },
    {
      title: 'Claim daily streak rewards',
      desc: 'Check in daily and climb streak tiers (up to ~30 APTC on top day) to compound rewards.',
      href: '/profile',
      cta: 'Claim streak',
      icon: <FaGift className="text-amber-300" />,
    },
    {
      title: 'Deposit cashback',
      desc: 'Deposit on Solana and reclaim up to 1% of net deposits through the cashback panel.',
      href: '/profile',
      cta: 'View cashback',
      icon: <FaCoins className="text-emerald-300" />,
    },
    {
      title: 'Stake APTC',
      desc: 'Lock APTC in fixed pools with APY tiers currently ranging from 30% up to 360%.',
      href: '/stake',
      cta: 'Stake now',
      icon: <FaLock className="text-fuchsia-300" />,
    },
    {
      title: 'OTC lottery access',
      desc: 'Join OTC lottery rounds and often avoid DEX-style swap/LP/slippage fees (effective savings vary).',
      href: '/otc-lottery',
      cta: 'Open OTC lottery',
      icon: <FaTicketAlt className="text-rose-300" />,
    },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-[#1A0015]/70 p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
            <FaChartLine className="text-purple-300" />
          </div>
          <h3 className="font-display text-lg font-medium">More ways to earn</h3>
        </div>
      </div>
      <p className="mb-5 text-sm text-white/55">
        Stack multiple income paths on APT-Casino. Mix creator rewards, referrals, streaks, cashback, staking,
        and OTC campaigns to maximize your total earnings.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {opportunities.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-xl border border-white/10 bg-black/25 p-4 hover:border-white/20 hover:bg-black/35 transition"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{item.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-white/50 leading-relaxed">{item.desc}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wider font-semibold text-blue-magic">
                  {item.cta} →
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ——— UI primitives ———

function QuickLink({ href, icon, label, primary }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
        primary
          ? 'bg-gradient-to-r from-red-magic to-blue-magic text-white shadow-md hover:opacity-95'
          : 'border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </Link>
  );
}

function BalanceCard({ label, value, hint, accent, loading }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">{label}</p>
      {loading ? (
        <motion.div className="mt-2 h-7 w-24 animate-pulse rounded bg-white/10" />
      ) : (
        <p className={`mt-1 font-display text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      )}
      <p className="mt-1 text-[11px] text-white/40">{hint}</p>
    </div>
  );
}

function StatCard({ icon, label, value, hint, tone = 'neutral' }) {
  const ring =
    tone === 'positive' ? 'border-emerald-500/30' : tone === 'negative' ? 'border-rose-500/30' : 'border-white/10';
  return (
    <div className={`rounded-xl border ${ring} bg-[#1A0015]/60 p-4`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
        {icon} {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/45">{hint}</p>
    </div>
  );
}

function MiniStat({ label, value, hint, accent = 'text-white', mono = false }) {
  return (
    <motion.div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent} ${mono ? 'font-mono text-sm' : ''}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-white/40">{hint}</p> : null}
    </motion.div>
  );
}

function Panel({ title, icon, href, linkLabel, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1A0015]/70 p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <motion.div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">{icon}</div>
          <h3 className="font-display text-lg font-medium">{title}</h3>
        </motion.div>
        {href ? (
          <Link href={href} className="text-xs text-blue-magic hover:underline inline-flex items-center gap-1">
            {linkLabel} <FaExternalLinkAlt className="text-[9px]" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function TxTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-white/[0.03] text-left text-[10px] uppercase tracking-widest text-white/40">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-t border-white/5 text-white/80">
              {cells.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 text-xs sm:text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TxLink({ chain, hash }) {
  return (
    <a
      href={explorerTxUrl(chain, hash) ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-magic hover:underline"
    >
      View <FaExternalLinkAlt className="text-[9px]" />
    </a>
  );
}

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-white/50">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function SkeletonGrid({ cols, tall }) {
  return (
    <div className={`grid gap-4 ${cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-xl bg-white/5 ${tall ? 'h-48' : 'h-28'}`} />
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    sent: { tone: 'emerald', label: 'Sent', icon: <FaCheckCircle className="text-[10px]" /> },
    auto: { tone: 'emerald', label: 'Sent', icon: <FaCheckCircle className="text-[10px]" /> },
    completed: { tone: 'emerald', label: 'Done', icon: <FaCheckCircle className="text-[10px]" /> },
    claimable: { tone: 'purple', label: 'Claimable', icon: <FaCheckCircle className="text-[10px]" /> },
    pending: { tone: 'amber', label: 'Pending', icon: <FaClock className="text-[10px]" /> },
    queued: { tone: 'amber', label: 'Queued', icon: <FaClock className="text-[10px]" /> },
    manual_pending: { tone: 'amber', label: 'Review', icon: <FaClock className="text-[10px]" /> },
    approved: { tone: 'amber', label: 'Approved', icon: <FaClock className="text-[10px]" /> },
    rejected: { tone: 'rose', label: 'Rejected', icon: <FaTimesCircle className="text-[10px]" /> },
    failed: { tone: 'rose', label: 'Failed', icon: <FaTimesCircle className="text-[10px]" /> },
  };
  const def = map[String(status)] || { tone: 'white', label: status, icon: null };
  const palette = {
    emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    purple: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
    amber: 'bg-amber-500/15 border-amber-400/30 text-amber-200',
    rose: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
    white: 'bg-white/10 border-white/15 text-white/70',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${palette[def.tone]}`}
    >
      {def.icon} {def.label}
    </span>
  );
}
