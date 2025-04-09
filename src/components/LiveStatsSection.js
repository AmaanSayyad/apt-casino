'use client';

import { useEffect, useState } from 'react';
import { FaUsers, FaCoins, FaTrophy } from 'react-icons/fa';

export default function LiveStatsSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/stats/live')
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setStats(d);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const activePlayers = stats?.activePlayers ?? 0;
  const totalWageredApt = stats?.totalWageredApt ?? 0;
  const dailyWinners = stats?.dailyWinners ?? 0;
  const recentWinners = stats?.recentWinners ?? [];

  const fmtApt = (n) =>
    typeof n === 'number' && Number.isFinite(n)
      ? `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} SOL · APT`
      : '0 SOL · APT';

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl">
          <div className="bg-[#120010] rounded-xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="bg-[#1A0015] rounded-lg p-5 flex items-center space-x-4 border border-white/5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-red-magic/30 to-blue-magic/30">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-white/70 text-sm">Active Players (24h)</h3>
                  <p className="text-white text-2xl font-bold tabular-nums">
                    {activePlayers.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-[#1A0015] rounded-lg p-5 flex items-center space-x-4 border border-white/5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-red-magic/30 to-blue-magic/30">
                  <FaCoins className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-white/70 text-sm">Total Wagered</h3>
                  <p className="text-white text-2xl font-bold tabular-nums">{fmtApt(totalWageredApt)}</p>
                </div>
              </div>

              <div className="bg-[#1A0015] rounded-lg p-5 flex items-center space-x-4 border border-white/5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-red-magic/30 to-blue-magic/30">
                  <FaTrophy className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-white/70 text-sm">Daily Winners (24h)</h3>
                  <p className="text-white text-2xl font-bold tabular-nums">{dailyWinners.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-white font-medium mb-4 flex items-center">
                <div className="w-1 h-4 magic-gradient rounded-full mr-2"></div>
                Recent Big Winners
              </h3>

              {recentWinners.length === 0 ? (
                <p className="text-white/50 text-sm">
                  No wins recorded yet. Play a round to appear here.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentWinners.map((winner, idx) => (
                    <div
                      key={`${winner.wallet}-${winner.timestampMicros}-${idx}`}
                      className="p-[1px] bg-gradient-to-r from-red-magic/40 to-blue-magic/40 rounded-lg"
                    >
                      <div className="bg-[#1A0015] rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-white font-medium truncate" title={winner.wallet}>
                            {winner.walletShort || 'Player'}
                          </p>
                          <span className="text-xs text-white/50 shrink-0 ml-2">{winner.timeAgo}</span>
                        </div>
                        <p className="text-sm text-white/70 mb-1">Game: {winner.game}</p>
                        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-magic to-blue-magic tabular-nums">
                          {winner.payoutApt.toLocaleString('en-US', { maximumFractionDigits: 4 })} SOL · APT
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
