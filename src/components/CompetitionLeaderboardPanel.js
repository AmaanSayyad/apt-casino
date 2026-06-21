'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaTrophy,
  FaSync,
  FaClock,
  FaUsers,
  FaCoins,
  FaGamepad,
  FaMedal,
  FaCheckCircle,
} from 'react-icons/fa';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import ChainConnectModal from '@/components/wallet/ChainConnectModal';
import {
  buildAptcEntryFeeTransaction,
  getSolanaConnection,
  waitForSolanaSignatureConfirmed,
  formatSolanaError,
} from '@/lib/solana/client';
function walletsMatch(a, b, chain) {
  if (!a || !b) return false;
  if ((chain || '').toLowerCase() === 'solana') {
    return a === b || a.toLowerCase() === b.toLowerCase();
  }
  const norm = (x) => {
    const t = String(x).trim().toLowerCase();
    if (/^0x[0-9a-f]+$/.test(t)) {
      return `0x${t.slice(2).padStart(64, '0')}`;
    }
    return t;
  };
  return norm(a) === norm(b);
}

function fmtVol(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function useCountdown(endsAt) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!endsAt) {
      setLeft(null);
      return;
    }
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      if (ms <= 0) {
        setLeft({ over: true, d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      const s = Math.floor(ms / 1000);
      setLeft({
        over: false,
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return left;
}

export default function CompetitionLeaderboardPanel() {
  const { connected, address, chain, chainLabel, solana } = usePlayWallet();
  const nativeLabel = chain === 'solana' ? 'SOL' : 'APT';
  const [comp, setComp] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);

  const loadCompetition = useCallback(async () => {
    setLoading(true);
    try {
      const q =
        connected && address
          ? `?wallet=${encodeURIComponent(address)}&chain=${encodeURIComponent(chain)}&top=50`
          : `?top=50`;
      const r = await fetch(`/api/competitions/active${q}`);
      setComp(await r.json());
    } catch {
      setComp(null);
    } finally {
      setLoading(false);
    }
  }, [connected, address, chain]);

  useEffect(() => {
    loadCompetition();
    const id = setInterval(loadCompetition, 60_000);
    return () => clearInterval(id);
  }, [loadCompetition]);

  const c = comp?.competition;
  const standings = comp?.standings ?? [];
  const countdown = useCountdown(c?.endsAt);
  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);

  const prizeDisplay = useMemo(() => {
    const pool = c?.prizePoolAptc ?? c?.prizePoolApt;
    if (!pool) return '—';
    return `${fmtVol(pool)} APTC`;
  }, [c?.prizePoolAptc, c?.prizePoolApt]);

  const entryFeeDisplay = useMemo(() => {
    const fee = c?.entryFeeAptc ?? c?.entryFeeApt ?? 0;
    if (!fee) return 'Free';
    return `${fmtVol(fee)} APTC`;
  }, [c?.entryFeeAptc, c?.entryFeeApt]);

  const solanaReady = chain === 'solana' && connected && address && solana?.sendTransaction;

  const registerForActive = async () => {
    if (!c?.id) return;

    if (!solanaReady) {
      toast.error('Connect a Solana wallet to register — APTC entry fees are on Solana.');
      setConnectOpen(true);
      return;
    }

    const entryFee = Number(c?.entryFeeAptc ?? c?.entryFeeApt) || 0;
    setRegistering(true);
    try {
      let txHash = null;

      if (entryFee > 0) {
        toast.info(`Confirm ${fmtVol(entryFee)} APTC entry fee in your wallet…`);
        const connection = getSolanaConnection();
        const tx = await buildAptcEntryFeeTransaction(entryFee, address, connection);
        txHash = await solana.sendTransaction(tx, connection);
        await waitForSolanaSignatureConfirmed(connection, txHash);
      }

      const r = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: c.id,
          wallet: address,
          chain: 'solana',
          txHash,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) {
        if (r.status === 409) {
          toast.info('Already registered.');
          await loadCompetition();
          return;
        }
        throw new Error(d.error || 'Registration failed');
      }
      toast.success(
        entryFee > 0
          ? `Paid ${fmtVol(entryFee)} APTC — you're in! Start playing to climb the board.`
          : "You're in — start playing to climb the board.",
      );
      await loadCompetition();
    } catch (e) {
      toast.error(formatSolanaError(e).message || e.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const isRegistered = comp?.isRegistered === true;
  const isFull = c?.maxParticipants ? c.participantCount >= c.maxParticipants : false;

  if (!comp?.supabaseConfigured) {
    return (
      <EmptyCup
        title="Competitions unavailable"
        description={comp?.message || 'Configure Supabase to enable Volume Cup events.'}
      />
    );
  }

  if (!loading && !c) {
    return (
      <EmptyCup
        title="No active Volume Cup"
        description={
          comp?.message ||
          'Check back soon — the next seasonal volume competition will appear here when it goes live.'
        }
        action={{ href: '/game', label: 'Play games' }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Event hero strip */}
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-[#1a0a12] to-[#120010] p-5 md:p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
        <motion.div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <motion.div>
            {loading ? (
              <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
            ) : (
              <h3 className="font-display text-xl font-bold text-white md:text-2xl">{c?.name}</h3>
            )}
            <p className="mt-1 text-sm text-white/50">
              Wager volume on qualifying games · Solana registration · APTC prizes
            </p>
          </motion.div>
          <motion.div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadCompetition()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
            >
              <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            {solanaReady && !isRegistered && c && (
              <button
                type="button"
                onClick={registerForActive}
                disabled={registering || isFull}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-black shadow-lg disabled:opacity-50"
              >
                {registering ? 'Joining…' : isFull ? 'Cup full' : entryFeeDisplay === 'Free' ? 'Join cup' : `Join · ${entryFeeDisplay}`}
              </button>
            )}
            {!solanaReady && (
              <button
                type="button"
                onClick={() => setConnectOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-5 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                Connect Solana to join
              </button>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <StatPill icon={<FaCoins className="text-amber-300" />} label="Prize pool" value={loading ? '…' : prizeDisplay} />
          <StatPill icon={<FaCoins className="text-emerald-300" />} label="Entry fee" value={loading ? '…' : entryFeeDisplay} />
          <StatPill
            icon={<FaUsers className="text-purple-300" />}
            label="Registered"
            value={
              loading
                ? '…'
                : `${c?.participantCount ?? 0}${c?.maxParticipants ? ` / ${c.maxParticipants}` : ''}`
            }
          />
          <StatPill
            icon={<FaClock className="text-cyan-300" />}
            label="Time left"
            value={
              loading
                ? '…'
                : countdown?.over
                  ? 'Ended'
                  : countdown
                    ? `${countdown.d}d ${countdown.h}h ${countdown.m}m`
                    : '—'
            }
          />
          <StatPill
            icon={<FaGamepad className="text-pink-300" />}
            label="Games"
            value={loading ? '…' : (c?.includedGames || []).length ? (c.includedGames || []).join(', ') : 'All'}
            small
          />
        </motion.div>
      </motion.div>

      {/* Your status */}
      <AnimatePresence mode="wait">
        {connected && c && (
          <motion.div
            key={isRegistered ? 'reg' : 'unreg'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl border px-4 py-3 text-sm ${
              isRegistered
                ? 'border-emerald-500/30 bg-emerald-950/20'
                : 'border-amber-500/30 bg-amber-950/20'
            }`}
          >
            {isRegistered ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <FaCheckCircle className="text-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-200">You&apos;re registered</span>
                <span className="text-white/40">·</span>
                <span className="font-mono text-xs text-white/70">
                  {address?.slice(0, 8)}…{address?.slice(-4)}
                </span>
                {comp.yourRank != null ? (
                  <span className="ml-auto font-bold text-emerald-300">
                    Rank #{comp.yourRank} · {fmtVol(comp.yourVolumeApt)} {nativeLabel} · {comp.yourBets} bets
                  </span>
                ) : (
                  <span className="ml-auto text-white/55">No qualifying bets yet — play to rank</span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-amber-100/90">
                  {chain !== 'solana'
                    ? 'Switch to Solana to register — entry fee is charged in APTC.'
                    : entryFeeDisplay === 'Free'
                      ? 'Join the cup to count your wagers toward the leaderboard.'
                      : `Pay ${entryFeeDisplay} entry fee to join the cup.`}
                </p>
                {solanaReady ? (
                  <button
                    type="button"
                    onClick={registerForActive}
                    disabled={registering || isFull}
                    className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
                  >
                    {registering ? '…' : entryFeeDisplay === 'Free' ? 'Register now' : `Pay ${entryFeeDisplay}`}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConnectOpen(true)}
                    className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black"
                  >
                    Connect Solana
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Podium */}
      {!loading && top3.length > 0 && (
        <motion.div
          className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-lg mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PodiumPlace row={top3[1]} place={2} nativeLabel={nativeLabel} delay={0.1} />
          <PodiumPlace row={top3[0]} place={1} nativeLabel={nativeLabel} delay={0} tall />
          <PodiumPlace row={top3[2]} place={3} nativeLabel={nativeLabel} delay={0.2} />
        </motion.div>
      )}

      {/* Leaderboard table */}
      <motion.div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-left text-[10px] uppercase tracking-widest text-white/45">
            <tr>
              <th className="px-4 py-3 w-16">Rank</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">Volume</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Bets</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-white/5" />
                  </td>
                </tr>
              ))
            ) : standings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-white/45">
                  {c?.participantCount === 0
                    ? 'Be the first to join this cup.'
                    : 'No qualifying bets yet — registered players appear once they wager.'}
                </td>
              </tr>
            ) : (
              [...top3, ...rest].map((row) => {
                const isYou =
                  connected && address && walletsMatch(row.wallet, address, chain);
                return (
                  <tr
                    key={row.wallet}
                    className={`border-t border-white/5 transition-colors ${
                      isYou ? 'bg-amber-500/10' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={row.rank} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-white/85">{row.walletShort}</span>
                      {isYou && (
                        <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-200">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                      {fmtVol(row.volumeApt)} <span className="text-white/40 text-xs">{nativeLabel}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/55 hidden sm:table-cell">
                      {row.bets}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </motion.div>

      {c?.rewardsDistributedAt && (
        <p className="text-center text-xs text-emerald-300/70">
          Prizes distributed {new Date(c.rewardsDistributedAt).toLocaleString()}
        </p>
      )}

      <ChainConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}

function StatPill({ icon, label, value, small }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/40">
        {icon} {label}
      </div>
      <p className={`mt-1 font-bold tabular-nums text-white ${small ? 'text-xs truncate' : 'text-lg'}`}>
        {value}
      </p>
    </div>
  );
}

function PodiumPlace({ row, place, nativeLabel, tall, delay }) {
  if (!row) {
    return <div className="h-16" />;
  }
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' };
  const medals = {
    1: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
    2: 'text-zinc-200 border-zinc-400/40 bg-zinc-400/10',
    3: 'text-orange-300 border-orange-500/40 bg-orange-600/10',
  };
  return (
    <motion.div
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        className={`mb-2 flex w-full flex-col items-center justify-end rounded-t-xl border ${medals[place]} ${tall ? heights[1] : heights[place]}`}
      >
        <FaMedal className={`mb-1 text-xl ${place === 1 ? 'text-2xl' : ''}`} />
        <span className="font-mono text-[10px] text-white/70 px-1 truncate max-w-full">{row.walletShort}</span>
        <span className="text-xs font-bold tabular-nums text-white mt-0.5 pb-2">
          {fmtVol(row.volumeApt)} {nativeLabel}
        </span>
      </div>
      <RankBadge rank={place} />
    </motion.div>
  );
}

function RankBadge({ rank }) {
  const styles =
    rank === 1
      ? 'bg-amber-500/25 text-amber-200 border-amber-400/40'
      : rank === 2
        ? 'bg-zinc-400/15 text-zinc-200 border-zinc-300/35'
        : rank === 3
          ? 'bg-orange-600/20 text-orange-200 border-orange-500/35'
          : 'bg-white/5 text-white/60 border-white/15';
  return (
    <span
      className={`inline-flex min-w-[2rem] justify-center rounded-full border px-2 py-0.5 text-xs font-bold ${styles}`}
    >
      #{rank}
    </span>
  );
}

function EmptyCup({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
      <FaTrophy className="mx-auto mb-4 text-4xl text-white/20" />
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/50">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
