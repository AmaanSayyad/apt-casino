'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import {
  FaTrophy,
  FaMedal,
  FaCrown,
  FaUserFriends,
  FaDice,
  FaFire,
  FaPercent,
  FaCoins,
  FaSyncAlt,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { CHAINS } from '@/lib/chains';
import PlayerAvatar from '@/components/PlayerAvatar';
import { normalizeTwitterHandle, resolvePlayerDisplayName, resolveLinkedTwitterHandle } from '@/lib/xProfile';

const METRIC_TABS = [
  { id: 'biggest', label: 'Biggest win', icon: <FaFire />, hint: 'Single biggest payout' },
  { id: 'pnl', label: 'Net P&L', icon: <FaTrophy />, hint: 'Highest net profit' },
  { id: 'wagered', label: 'Wagered', icon: <FaCoins />, hint: 'Most volume (SOL · APT)' },
  { id: 'winrate', label: 'Winrate', icon: <FaPercent />, hint: 'Min 10 bets' },
  { id: 'bets', label: 'Most bets', icon: <FaDice />, hint: 'Total plays' },
];

const PERIOD_TABS = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'all', label: 'All-time' },
];

const GAME_TABS = [
  { id: 'all', label: 'All games' },
  { id: 'plinko', label: 'Plinko' },
  { id: 'mines', label: 'Mines' },
  { id: 'roulette', label: 'Roulette' },
  { id: 'wheel', label: 'Wheel' },
];

const NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
const PAGE_SIZE = 10;
const explorerAddressUrl = (addr) =>
  addr
    ? `https://explorer.aptoslabs.com/account/${addr}${NETWORK !== 'mainnet' ? `?network=${NETWORK}` : ''}`
    : null;

function fmtApt(apt, { max = 4 } = {}) {
  const n = Number(apt);
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  // Avoid showing "0" for dust amounts (was hiding real wagered on P&L rows)
  const digits = abs > 0 && abs < 0.01 ? Math.max(max, 4) : abs > 0 && abs < 1 ? Math.max(max, 3) : max;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtSignedApt(apt) {
  const n = Number(apt) || 0;
  if (n > 0) return `+${fmtApt(n)} SOL · APT`;
  if (n < 0) return `−${fmtApt(Math.abs(n))} SOL · APT`;
  return `${fmtApt(0)} SOL · APT`;
}

function fmtPct(n, digits = 1) {
  return `${(Number(n) * 100).toFixed(digits)}%`;
}

function short(addr) {
  if (!addr) return '—';
  const s = String(addr);
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

export default function LeaderboardPage() {
  const { account, connected } = useWallet();
  const userWallet = account?.address ? String(account.address).toLowerCase() : null;

  const [metric, setMetric] = useState('biggest');
  const [period, setPeriod] = useState('all');
  const [game, setGame] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        metric,
        period,
        game,
        top: '2000',
      });
      const r = await fetch(`/api/leaderboard?${params}`);
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setError(j?.error || 'Failed to load leaderboard');
        setData(null);
        return;
      }
      setData(j);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [metric, period, game]);

  useEffect(() => {
    setPage(1);
  }, [metric, period, game]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const board = data?.leaderboard || [];
  const topThree = board.slice(0, 3);
  const totalPages = Math.max(1, Math.ceil(board.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const tableRows = board.slice(pageStart, pageStart + PAGE_SIZE);

  const comingSoonChains = useMemo(
    () => CHAINS.filter((c) => c.status !== 'live').map((c) => c.label),
    [],
  );

  return (
    <div className="site-page-top site-page-pad-x min-h-[100dvh] bg-gradient-to-b from-sharp-black to-[#150012] pb-[max(4rem,env(safe-area-inset-bottom))] text-white md:min-h-screen md:pb-16">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center">
          
          <h1 className="text-3xl md:text-4xl font-display font-bold">Leaderboard</h1>
          <p className="text-white/55 text-sm max-w-5xl mx-auto mt-2 text-balance sm:whitespace-nowrap">
            Aggregated from on-chain play (Solana · Aptos). Every row here is backed by a verifiable on-chain transaction.
            {comingSoonChains.length > 0 && (
              <span className="block text-white/35 text-xs mt-1 whitespace-normal">
                Other chains will appear here when enabled ({comingSoonChains.join(', ')}).
              </span>
            )}
          </p>
          <p className="text-white/35 text-xs mt-2 max-w-3xl mx-auto">
            Net P&L = total returns − total wagered. Biggest win is the best single bet — you can still be down overall.
          </p>
        </header>

        {/* Summary tiles */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            icon={<FaDice className="text-pink-300" />}
            label="Bets placed"
            value={loading && !data ? '…' : (data?.totalBets ?? 0).toLocaleString()}
            hint={gameLabel(game)}
          />
          <Tile
            icon={<FaCoins className="text-amber-300" />}
            label="Volume wagered (SOL · APT)"
            value={loading && !data ? '…' : fmtApt(data?.totalWageredApt ?? 0, { max: 2 })}
            hint="In the selected window"
          />
          <Tile
            icon={<FaTrophy className="text-emerald-300" />}
            label="Paid out (SOL · APT)"
            value={loading && !data ? '…' : fmtApt(data?.totalReturnedApt ?? 0, { max: 2 })}
            hint={
              data?.totalWageredApt
                ? `${fmtPct((data?.totalReturnedApt ?? 0) / data.totalWageredApt, 1)} RTP`
                : '—'
            }
          />
        </section>

        {/* Filters */}
        <section className="space-y-3">
          <Filters
            tabs={METRIC_TABS}
            value={metric}
            onChange={setMetric}
            label="Sort by"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Filters tabs={PERIOD_TABS} value={period} onChange={setPeriod} label="Window" compact />
            <Filters tabs={GAME_TABS} value={game} onChange={setGame} label="Game" compact />
          </div>
          <div className="flex items-center justify-end text-xs text-white/40 gap-3">
            {lastFetched && <span>Updated {lastFetched.toLocaleTimeString()}</span>}
            <button
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 hover:border-white/40 disabled:opacity-50"
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Podium */}
        {topThree.length > 0 && (
          <section className="grid gap-3 sm:grid-cols-3">
            {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((row) => (
              <PodiumCard
                key={row.wallet}
                row={row}
                metric={metric}
                isYou={userWallet && row.wallet === userWallet}
              />
            ))}
          </section>
        )}

        {/* Table */}
        <section>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1A0015]/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="px-4 py-3 w-14">Rank</th>
                    <th className="px-4 py-3">Player</th>
                    <th
                      className={`px-4 py-3 text-right ${metric === 'pnl' ? 'text-fuchsia-200' : ''}`}
                      title="Total returns minus total wagered · default sort"
                    >
                      Net P&L{metric === 'pnl' ? ' ↓' : ''}
                    </th>
                    <th className={`px-4 py-3 text-right ${metric === 'wagered' ? 'text-fuchsia-200' : ''}`}>
                      Wagered{metric === 'wagered' ? ' ↓' : ''}
                    </th>
                    <th className={`px-4 py-3 text-right ${metric === 'bets' ? 'text-fuchsia-200' : ''}`}>
                      Bets{metric === 'bets' ? ' ↓' : ''}
                    </th>
                    <th className={`px-4 py-3 text-right ${metric === 'winrate' ? 'text-fuchsia-200' : ''}`}>
                      Winrate{metric === 'winrate' ? ' ↓' : ''}
                    </th>
                    <th
                      className={`px-4 py-3 text-right ${metric === 'biggest' ? 'text-fuchsia-200' : ''}`}
                      title="Largest single-bet profit (not overall P&L)"
                    >
                      Biggest win{metric === 'biggest' ? ' ↓' : ''}
                    </th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !data && (
                    <SkeletonRows />
                  )}
                  {!loading && tableRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-white/50">
                        No games match these filters yet.{' '}
                        <Link href="/game" className="text-blue-magic hover:underline">Start playing</Link> and you
                        could be #1.
                      </td>
                    </tr>
                  )}
                  {tableRows.map((row) => (
                    <LeaderboardRow
                      key={row.wallet}
                      row={row}
                      metric={metric}
                      isYou={userWallet && row.wallet === userWallet}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {board.length > 0 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalRows={board.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              disabled={loading}
            />
          )}
          {data?.eligibilityThreshold && (
            <p className="mt-2 text-[11px] text-white/40">
              Winrate ranking requires at least {data.eligibilityThreshold} bets in the selected window.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, totalRows, pageSize, onPageChange, disabled }) {
  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalRows);

  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const set = new Set([1, totalPages, page, page - 1, page + 1]);
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-white/45">
        Showing <span className="text-white/70">{from}–{to}</span> of{' '}
        <span className="text-white/70">{totalRows}</span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const showEllipsis = prev != null && p - prev > 1;
          return (
            <span key={p} className="inline-flex items-center gap-1.5">
              {showEllipsis && <span className="px-1 text-white/35">…</span>}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(p)}
                className={`min-w-[2rem] rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                  p === page
                    ? 'border-transparent bg-gradient-to-r from-red-magic to-blue-magic text-white'
                    : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// =================================================================================
// Components

function Tile({ icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/45">
        {icon} <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[11px] text-white/40">{hint}</p>
    </div>
  );
}

function Filters({ tabs, value, onChange, label, compact = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 w-16">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              title={t.hint || undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 ${
                compact ? 'py-1 text-xs' : 'py-1.5 text-xs'
              } font-bold transition-colors ${
                active
                  ? 'bg-gradient-to-r from-red-magic to-blue-magic border-transparent text-white'
                  : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
              }`}
            >
              {t.icon && <span className={active ? 'text-white' : 'text-white/60'}>{t.icon}</span>}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PodiumCard({ row, metric, isYou }) {
  const podiumStyles = {
    1: {
      gradient: 'from-amber-500/30 to-amber-700/10',
      ring: 'border-amber-400/40',
      icon: <FaCrown className="text-amber-300 text-xl" />,
      label: '1st',
      tilt: 'sm:-translate-y-3',
    },
    2: {
      gradient: 'from-zinc-300/20 to-zinc-500/10',
      ring: 'border-zinc-300/30',
      icon: <FaMedal className="text-zinc-200 text-lg" />,
      label: '2nd',
      tilt: '',
    },
    3: {
      gradient: 'from-orange-600/20 to-orange-900/10',
      ring: 'border-orange-500/30',
      icon: <FaMedal className="text-orange-300 text-lg" />,
      label: '3rd',
      tilt: '',
    },
  };
  const style = podiumStyles[row.rank] || podiumStyles[3];

  return (
    <div className={`relative ${style.tilt}`}>
      {isYou && (
        <span className="absolute -top-2 right-3 rounded-full bg-emerald-500/25 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
          You
        </span>
      )}
      <div
        className={`rounded-2xl border ${style.ring} bg-gradient-to-br ${style.gradient} p-5 h-full`}
      >
        <div className="flex items-center gap-2 mb-3">
          {style.icon}
          <span className="text-xs uppercase tracking-widest text-white/55">{style.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <PlayerCell row={row} isYou={isYou} avatarSize={48} nameClass="font-bold" />
        </div>
        <div className="mt-4">
          <PrimaryStat row={row} metric={metric} large />
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/55">
            <span>{row.bets.toLocaleString()} bets</span>
            <span>{fmtPct(row.winrate, 0)} winrate</span>
            {row.biggestWinApt > 0 && <span>Top hit: {fmtApt(row.biggestWinApt)} SOL · APT</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ row, metric, isYou }) {
  const profileHref = `/profile?wallet=${encodeURIComponent(row.wallet)}`;
  const explorerHref = explorerAddressUrl(row.wallet);
  const xHandle = resolveLinkedTwitterHandle({
    twitterHandle: row.twitterHandle,
    avatarUrl: row.avatarUrl,
  });
  // Profit = green, loss = muted (not alarm-red). Winrate stays neutral — low % isn't an error.
  const pnlClass = row.pnlApt > 0 ? 'text-emerald-300' : row.pnlApt < 0 ? 'text-white/55' : 'text-white/70';

  return (
    <tr
      className={`border-t border-white/5 ${isYou ? 'bg-purple-500/8 text-white' : 'text-white/85'} hover:bg-white/[0.03]`}
    >
      <td className="px-4 py-3 font-bold">
        <RankCell rank={row.rank} highlighted={metricHighlightsRank(metric)} />
      </td>
      <td className="px-4 py-3">
        <PlayerCell row={row} isYou={isYou} />
      </td>
      <td className={`px-4 py-3 text-right font-bold ${pnlClass}`}>{fmtSignedApt(row.pnlApt)}</td>
      <td className="px-4 py-3 text-right">{fmtApt(row.wageredApt, { max: 2 })} SOL · APT</td>
      <td className="px-4 py-3 text-right">{row.bets.toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-white/70">{fmtPct(row.winrate, 1)}</td>
      <td className="px-4 py-3 text-right text-white/70">
        {row.biggestWinApt > 0 ? `+${fmtApt(row.biggestWinApt)} SOL · APT` : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 justify-end">
          {xHandle && (
            <a
              href={`https://x.com/${xHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400/70 hover:text-sky-300"
              title="Open X profile"
            >
              <FaXTwitter className="text-xs" />
            </a>
          )}
          <Link href={profileHref} className="text-white/40 hover:text-white" title="View profile">
            <FaUserFriends className="text-xs" />
          </Link>
          {explorerHref && (
            <a
              href={explorerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white"
              title="Open on explorer"
            >
              <FaExternalLinkAlt className="text-[10px]" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function PrimaryStat({ row, metric, large = false }) {
  const cls = large ? 'text-2xl font-bold' : 'text-lg font-bold';
  switch (metric) {
    case 'wagered':
      return <p className={`${cls} text-white`}>{fmtApt(row.wageredApt, { max: 2 })} SOL · APT wagered</p>;
    case 'bets':
      return <p className={`${cls} text-white`}>{row.bets.toLocaleString()} bets</p>;
    case 'winrate':
      return <p className={`${cls} text-white`}>{fmtPct(row.winrate, 1)} winrate</p>;
    case 'biggest':
      return <p className={`${cls} text-white`}>+{fmtApt(row.biggestWinApt)} SOL · APT</p>;
    default: {
      const pnlClass = row.pnlApt > 0 ? 'text-emerald-300' : row.pnlApt < 0 ? 'text-white/70' : 'text-white';
      return <p className={`${cls} ${pnlClass}`}>{fmtSignedApt(row.pnlApt)}</p>;
    }
  }
}

function RankCell({ rank }) {
  if (rank <= 3) {
    const palette =
      rank === 1
        ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
        : rank === 2
          ? 'bg-zinc-300/15 border-zinc-300/40 text-zinc-200'
          : 'bg-orange-700/20 border-orange-500/40 text-orange-200';
    return (
      <span className={`inline-flex items-center justify-center min-w-[2.25rem] rounded-full border px-2 py-0.5 text-xs font-bold ${palette}`}>
        #{rank}
      </span>
    );
  }
  return <span className="text-white/55">#{rank}</span>;
}

function PlayerCell({ row, isYou, avatarSize = 36, nameClass = 'font-semibold' }) {
  const xHandle = resolveLinkedTwitterHandle({
    twitterHandle: row.twitterHandle,
    avatarUrl: row.avatarUrl,
  });
  const displayName = resolvePlayerDisplayName({
    handle: row.handle,
    twitterHandle: row.twitterHandle,
    avatarUrl: row.avatarUrl,
    wallet: row.wallet,
  });

  return (
    <div className="flex items-center gap-3 min-w-0">
      <PlayerAvatar
        avatarUrl={row.avatarUrl}
        twitterHandle={row.twitterHandle}
        handle={row.handle}
        wallet={row.wallet}
        size={avatarSize}
      />
      <div className="min-w-0">
        <p className={`${nameClass} truncate`}>
          {displayName}
          {isYou && (
            <span className="ml-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 align-middle">
              You
            </span>
          )}
        </p>
        {xHandle && row.handle ? (
          <a
            href={`https://x.com/${xHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-sky-400/90 hover:text-sky-300"
          >
            <FaXTwitter className="shrink-0 text-[10px]" />
            <span className="truncate">@{xHandle}</span>
          </a>
        ) : (
          <p className="text-[11px] font-mono text-white/40 truncate">{short(row.wallet)}</p>
        )}
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-t border-white/5 animate-pulse">
          <td className="px-4 py-3"><div className="h-4 w-8 rounded bg-white/10" /></td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10" />
              <div className="space-y-1">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="h-2 w-20 rounded bg-white/5" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-right"><div className="h-4 w-20 rounded bg-white/10 ml-auto" /></td>
          <td className="px-4 py-3 text-right"><div className="h-4 w-16 rounded bg-white/10 ml-auto" /></td>
          <td className="px-4 py-3 text-right"><div className="h-4 w-10 rounded bg-white/10 ml-auto" /></td>
          <td className="px-4 py-3 text-right"><div className="h-4 w-12 rounded bg-white/10 ml-auto" /></td>
          <td className="px-4 py-3 text-right"><div className="h-4 w-16 rounded bg-white/10 ml-auto" /></td>
          <td className="px-4 py-3"></td>
        </tr>
      ))}
    </>
  );
}

// =================================================================================
// Tiny helpers

function metricHighlightsRank(metric) {
  return metric === 'biggest' || metric === 'pnl' || metric === 'winrate';
}

function periodLabel(period) {
  switch (period) {
    case '24h':
      return 'Last 24 hours';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    default:
      return 'All-time';
  }
}

function gameLabel(game) {
  if (game === 'all') return 'Across all games';
  return `${game.charAt(0).toUpperCase()}${game.slice(1)} only`;
}
