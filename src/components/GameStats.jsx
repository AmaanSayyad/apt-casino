'use client';

import { FaDice, FaCoins, FaTrophy } from 'react-icons/fa';
import { getCombinedNativeParts } from '@/lib/formatVolume';
import { useSharedLiveStats } from '@/hooks/useSharedStats';

function fmtCount(n) {
  if (n == null || !Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function ChainValues({ parts, gradientClass, empty = '0' }) {
  if (!parts.length) {
    return (
      <p className="font-display text-base font-bold tabular-nums whitespace-nowrap text-white/50 sm:text-lg">
        {empty}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5 sm:items-end">
      {parts.map(({ chain, amount, symbol }) => (
        <p
          key={chain}
          className="font-display text-base font-bold tabular-nums whitespace-nowrap leading-tight sm:text-lg"
        >
          <span className={`bg-clip-text text-transparent ${gradientClass}`}>{amount}</span>
          <span className="ml-1 text-[0.72em] font-semibold text-white/55">{symbol}</span>
        </p>
      ))}
    </div>
  );
}

function StatCell({ icon: Icon, iconClass, label, children }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 px-3 py-3 sm:px-4 sm:py-3.5 sm:items-end">
      <div className="flex items-center gap-1.5 text-white/55">
        <Icon className={`shrink-0 text-[11px] ${iconClass}`} aria-hidden />
        <span className="whitespace-nowrap text-[10px] font-display uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

const GameStats = () => {
  const { data: stats } = useSharedLiveStats();

  const totalBets = stats?.totalBets ?? 0;
  const volumeParts = getCombinedNativeParts(stats?.totalWageredByChain);
  const maxWinParts = getCombinedNativeParts(stats?.maxWinByChain);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="grid grid-cols-3 divide-x divide-white/10">
        <StatCell icon={FaDice} iconClass="text-blue-400" label="Total bets">
          <p className="font-display text-xl font-bold tabular-nums whitespace-nowrap bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent sm:text-2xl">
            {fmtCount(totalBets)}
          </p>
        </StatCell>

        <StatCell icon={FaCoins} iconClass="text-amber-400" label="Volume">
          <ChainValues
            parts={volumeParts}
            gradientClass="bg-gradient-to-r from-amber-200 to-orange-300"
          />
        </StatCell>

        <StatCell icon={FaTrophy} iconClass="text-emerald-400" label="Max win">
          <ChainValues
            parts={maxWinParts}
            gradientClass="bg-gradient-to-r from-emerald-200 to-teal-300"
          />
        </StatCell>
      </div>
    </div>
  );
};

export default GameStats;
