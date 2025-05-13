'use client';

import { fmtNum } from '@/components/admin/ui';

const BREAK_EVEN_WIN_RATE = 50;

export default function GameModePnLPanel({ modes, totalRounds }) {
  if (!modes?.length) {
    return (
      <p className="text-sm text-white/40 py-6">
        No game rounds logged yet — play events appear after games sync to Supabase.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Game mode P&L</p>
          <p className="text-xs text-white/45 mt-1">Per-game house performance — native units per chain.</p>
        </div>
        {totalRounds != null && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/15 text-white/50">
            {fmtNum(totalRounds, 0)} rounds
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modes.map((m) => {
          const houseUp = m.housePnL >= 0;
          const aboveBreakEven = m.winRate > BREAK_EVEN_WIN_RATE;
          const delta = Math.abs(m.winRate - BREAK_EVEN_WIN_RATE).toFixed(1);

          return (
            <div
              key={m.mode}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#140010] to-[#0a0008] p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-display font-bold text-white">{m.label}</h4>
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    houseUp
                      ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                      : 'border-rose-500/40 text-rose-300 bg-rose-500/10'
                  }`}
                >
                  {houseUp ? '▲ House profit' : '▼ House loss'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/40">Rounds</p>
                  <p className="text-2xl font-display font-bold tabular-nums">{fmtNum(m.totalBets, 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/40">Win rate</p>
                  <p
                    className={`text-2xl font-display font-bold tabular-nums ${
                      aboveBreakEven ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {fmtNum(m.winRate, 1)}%
                  </p>
                </div>
              </div>

              <div className="text-xs text-white/50 flex gap-4">
                <span>
                  <span className="text-emerald-400">{m.wins}</span>
                  <span className="text-white/30"> / </span>
                  <span className="text-rose-400/80">{m.losses}</span> W/L
                </span>
                <span>
                  House P&L{' '}
                  <span className={houseUp ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                    {fmtNum(m.housePnL, 4)}
                  </span>
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/40 mb-1">
                  <span>User win rate</span>
                  <span className={aboveBreakEven ? 'text-rose-300' : 'text-emerald-300'}>
                    {aboveBreakEven ? `+${delta}% above` : `${delta}% below`} break-even
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${aboveBreakEven ? 'bg-rose-500/70' : 'bg-emerald-500/70'}`}
                    style={{ width: `${Math.min(100, m.winRate)}%` }}
                  />
                </div>
              </div>

              {Object.keys(m.byChain || {}).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <p className="text-[9px] uppercase tracking-wider text-white/35">By chain</p>
                  {Object.entries(m.byChain).map(([chain, c]) => (
                    <div key={chain} className="flex justify-between text-xs font-mono">
                      <span className="capitalize text-white/60">{chain}</span>
                      <span className={c.housePnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {fmtNum(c.housePnL, 4)}{' '}
                        <span className="text-white/30">
                          ({c.wins}/{c.totalBets})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {m.topAssets?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {m.topAssets.map((a) => (
                    <span
                      key={a.asset}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50"
                    >
                      {a.asset} {a.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
