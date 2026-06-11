'use client';

import { FaDice, FaCoins, FaTrophy } from 'react-icons/fa';
import { formatCombinedNative } from '@/lib/formatVolume';
import { useSharedLiveStats } from '@/hooks/useSharedStats';

function fmtCount(n) {
  if (n == null || !Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

const GameStats = () => {
  const { data: stats } = useSharedLiveStats();

  const totalBets = stats?.totalBets ?? 0;
  const volumeDisplay =
    stats?.totalWageredDisplay || formatCombinedNative(stats?.totalWageredByChain) || '0';
  const maxWinDisplay =
    stats?.maxWinDisplay || formatCombinedNative(stats?.maxWinByChain) || '0';

  return (
    <div className="flex flex-col md:flex-row items-center justify-end gap-6 md:gap-8 text-white bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/5 shadow-lg">
      <div className="flex flex-col items-center md:items-end">
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <FaDice className="text-blue-400" />
          <span className="uppercase tracking-wider font-display">Total Bets</span>
        </div>
        <p className="font-display font-bold text-xl md:text-2xl bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent tabular-nums">
          {fmtCount(totalBets)}
        </p>
      </div>

      <div className="flex flex-col items-center md:items-end">
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <FaCoins className="text-yellow-400" />
          <span className="uppercase tracking-wider font-display">Volume (all chains)</span>
        </div>
        <p className="font-display font-bold text-lg md:text-xl bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent tabular-nums text-right max-w-[220px]">
          {volumeDisplay}
        </p>
      </div>

      <div className="flex flex-col items-center md:items-end">
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <FaTrophy className="text-green-400" />
          <span className="uppercase tracking-wider font-display">Max Win</span>
        </div>
        <p className="font-display font-bold text-lg md:text-xl bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent tabular-nums text-right max-w-[220px]">
          {maxWinDisplay}
        </p>
      </div>
    </div>
  );
};

export default GameStats;
