'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import ChainConnectModal from '@/components/wallet/ChainConnectModal';
import {
  buildAptcEntryFeeTransaction,
  getSolanaConnection,
  waitForSolanaSignatureConfirmed,
  formatSolanaError,
} from '@/lib/solana/client';
import GradientBorderButton from './GradientBorderButton';

function fmtVol(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatTimeRemaining(seconds) {
  if (seconds <= 0) return 'Now';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}

export default function UpcomingTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [registeringId, setRegisteringId] = useState(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const { connected, address, chain, isDemo, solana } = usePlayWallet();
  const router = useRouter();
  const solanaReady = chain === 'solana' && connected && address && solana?.sendTransaction && !isDemo;

  const load = useMemo(
    () => async () => {
      try {
        const r = await fetch('/api/tournaments');
        const d = await r.json();
        setTournaments(d.tournaments ?? []);
        if (d.supabaseConfigured === false) setSupabaseConfigured(false);
      } catch {
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const register = async (tournament) => {
    if (!solanaReady) {
      toast.error('Connect a Solana wallet to register for tournaments.');
      setConnectOpen(true);
      return;
    }

    const isVolume = tournament.competitionMode === 'volume';
    const entryFee = Number(tournament.entryFeeApt) || 0;
    setRegisteringId(tournament.id);
    try {
      let txHash = null;

      if (entryFee > 0) {
        toast.info(`Confirm ${fmtVol(entryFee)} APTC entry fee in your wallet…`);
        const connection = getSolanaConnection();
        const tx = await buildAptcEntryFeeTransaction(entryFee, address, connection);
        txHash = await solana.sendTransaction(tx, connection);
        await waitForSolanaSignatureConfirmed(connection, txHash);
      }

      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          wallet: address,
          chain: 'solana',
          txHash,
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) {
        if (res.status === 409) {
          toast.info('Already registered — opening the leaderboard.');
          if (isVolume) router.push('/competition');
          load();
          return;
        }
        throw new Error(d.error || 'Registration failed');
      }
      if (isVolume) {
        toast.success(
          entryFee > 0
            ? `Paid ${fmtVol(entryFee)} APTC — you're in. Play to climb the volume leaderboard.`
            : "You're in. Play to climb the volume leaderboard.",
        );
        router.push('/competition');
      } else {
        toast.success("You're registered. Good luck!");
      }
      load();
    } catch (e) {
      toast.error(formatSolanaError(e).message || e.message || 'Registration failed');
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <>
    <ChainConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    <section className="py-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div className="flex items-start min-w-0 flex-1">
            <div className="w-1 h-6 bg-gradient-to-r from-red-magic to-blue-magic rounded-full mr-3 shrink-0 mt-1"></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-display font-bold text-white">Tournaments &amp; volume cups</h2>
              <p className="text-white/50 text-sm mt-1 max-w-3xl leading-relaxed">
                Volume cups: register with your wallet, then compete by on-chain wager during the window. Standings
                are on the Volume cup page. Classic registration events use the same button before start.
              </p>
            </div>
          </div>
          <Link href="/competition" className="shrink-0 self-start lg:pt-1">
            <span className="text-white/70 hover:text-white text-sm flex items-center cursor-pointer">
              Volume cup leaderboard
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </Link>
        </div>

        {loading ? (
          <p className="text-white/50">Loading tournaments…</p>
        ) : tournaments.length === 0 ? (
          <div className="p-[1px] bg-gradient-to-r from-red-magic/30 to-blue-magic/30 rounded-xl">
            <div className="bg-[#120010] rounded-xl p-8 text-center">
              <p className="text-white font-medium mb-1">No competitions scheduled.</p>
              <p className="text-white/50 text-sm">
                {supabaseConfigured
                  ? 'Add rows to public.tournaments (volume or registration) to feature them here.'
                  : 'Set SUPABASE_SERVICE_ROLE_KEY and run the tournaments migration to enable this section.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => {
              const isLiveVolume = t.phase === 'live_volume';
              const isVolume = t.competitionMode === 'volume';
              const endMs = t.endsAt ? new Date(t.endsAt).getTime() : null;
              const startMs = new Date(t.startsAt).getTime();
              const countdownSeconds =
                isLiveVolume && endMs
                  ? Math.max(0, Math.floor((endMs - now) / 1000))
                  : Math.max(0, Math.floor((startMs - now) / 1000));
              const countdownLabel = isLiveVolume ? 'Ends in' : 'Starts in';
              const badge = isLiveVolume ? 'LIVE · Volume cup' : isVolume ? 'Upcoming · Volume' : t.gameLabel;
              const fillPct =
                t.maxParticipants > 0 ? Math.min(100, Math.round((t.participants / t.maxParticipants) * 100)) : 0;
              const isFull = t.participants >= t.maxParticipants;
              const buttonLabel = isFull
                ? 'Full'
                : registeringId === t.id
                  ? 'Registering…'
                  : isVolume
                    ? isLiveVolume
                      ? 'Register & play'
                      : 'Register'
                    : countdownSeconds === 0
                      ? 'Starting now'
                      : 'Register Now';

              return (
                <div key={t.id} className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl">
                  <div className="bg-[#1A0015] rounded-xl h-full flex flex-col">
                    <div className="p-4 relative h-32 overflow-hidden rounded-t-xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#250020] to-[#1A0015]"></div>
                      <div className="relative z-10">
                        <span className="inline-block bg-red-magic/80 text-white text-xs py-1 px-2 rounded">
                          {badge}
                        </span>
                        <h3 className="text-white text-xl font-medium mt-2">{t.name}</h3>
                      </div>
                    </div>

                    <div className="p-4 border-t border-white/5 flex-1 flex flex-col">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-white/50 text-xs">Prize Pool</p>
                          <p className="text-white font-bold tabular-nums">
                            {t.prizePoolApt.toLocaleString('en-US', { maximumFractionDigits: 2 })} APTC
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs">Entry Fee</p>
                          <p className="text-white font-bold tabular-nums">
                            {t.entryFeeApt > 0
                              ? `${t.entryFeeApt.toLocaleString('en-US', { maximumFractionDigits: 4 })} APTC`
                              : 'Free'}
                          </p>
                        </div>
                        {isVolume ? (
                          <div className="col-span-2">
                            <p className="text-white/50 text-xs">How it works</p>
                            <p className="text-white/80 text-sm leading-snug">
                              Play with your wallet on{' '}
                              {t.includedGames && t.includedGames.length
                                ? t.includedGames.join(', ')
                                : 'Plinko, Mines, Roulette, wheel'}
                              . We sum on-chain bet volume for the event window; top wallets earn from the pool (paid by
                              the platform).
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-white/50 text-xs">Participants</p>
                            <p className="text-white font-bold tabular-nums">
                              {t.participants}/{t.maxParticipants}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-white/50 text-xs">{countdownLabel}</p>
                          <p className="text-white font-bold tabular-nums">{formatTimeRemaining(countdownSeconds)}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="w-full h-2 bg-[#250020] rounded-full overflow-hidden">
                          <div className="h-full magic-gradient" style={{ width: `${fillPct}%` }}></div>
                        </div>
                        <p className="text-xs text-white/50 mt-1 text-right">{fillPct}% Full</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => register(t)}
                        disabled={
                          isFull || registeringId === t.id || (!isVolume && countdownSeconds === 0)
                        }
                        className="w-full mt-auto"
                      >
                        <GradientBorderButton classes="w-full">
                          <div className="w-full text-center">{buttonLabel}</div>
                        </GradientBorderButton>
                      </button>

                      {isVolume && (
                        <Link
                          href="/competition"
                          className="block mt-2 text-center text-xs text-white/55 hover:text-white"
                        >
                          {isLiveVolume ? 'View live leaderboard →' : 'Volume cup page'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
    </>
  );
}
