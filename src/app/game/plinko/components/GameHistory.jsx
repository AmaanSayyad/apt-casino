"use client";
import { useMemo, useState } from "react";
import { FaHistory, FaExternalLinkAlt } from "react-icons/fa";
import { gameHistoryProofHref, gameHistoryProofLabel } from '@/lib/provablyFair/explorerLinks';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';

function parseMultiplier(label) {
  if (label === undefined || label === null) return NaN;
  const raw = String(label).replace("x", "").trim();
  return parseFloat(raw);
}

function statusForGame(game) {
  const mult = parseMultiplier(game.multiplier);
  const isWin = Number.isFinite(mult) ? mult >= 1 : null;
  const statusColor =
    isWin === null
      ? "text-white/50 bg-white/5 border-white/10"
      : isWin
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
      : "text-rose-300 bg-rose-500/10 border-rose-500/30";
  const statusLabel = isWin === null ? "—" : isWin ? "WIN" : "LOSS";
  const multColor =
    isWin === null ? "text-white/80" : isWin ? "text-emerald-300" : "text-rose-300";
  return { statusColor, statusLabel, multColor };
}

export default function GameHistory({ history }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const { chain } = usePlayCurrency();

  const rows = useMemo(() => (Array.isArray(history) ? history : []), [history]);
  const visibleRows = rows.slice(0, visibleCount);

  return (
    <div className="relative">
      <div className="flex justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-pink-500/30 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <FaHistory className="text-pink-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-pink-300 bg-clip-text text-transparent truncate">
              Game History
            </h3>
            <p className="text-xs text-white/50">Your most recent Plinko drops</p>
          </div>
        </div>

        {rows.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((c) => Math.min(c + 5, rows.length))}
            className="shrink-0 bg-gradient-to-r from-purple-800/40 to-pink-700/20 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white hover:from-purple-700/50 hover:to-pink-600/30 transition-all"
          >
            Show more
          </button>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-[#2a1530]/70">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30">
                  {['Game', 'Round', 'Bet', 'Multiplier', 'Payout', 'Status', 'TX'].map((col) => (
                    <th
                      key={col}
                      className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-white/70"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((game) => {
                  const { statusColor, statusLabel, multColor } = statusForGame(game);
                  return (
                    <tr
                      key={game.id}
                      className="border-t border-[#2a1530]/50 hover:bg-purple-900/10 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-md shadow-purple-500/30">
                            <span className="text-xs font-bold text-white">P</span>
                          </div>
                          <span className="text-white text-sm font-medium">Plinko</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-300 text-sm">{game.title || "—"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white text-sm font-medium">{game.betAmount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-semibold ${multColor}`}>{game.multiplier}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white text-sm font-medium">{game.payout}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {game.txHash ? (
                          <a
                            href={gameHistoryProofHref({ chain, txHash: game.txHash, explorerUrl: game.explorerUrl }) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-xs font-mono"
                            title={gameHistoryProofLabel(chain)}
                          >
                            {game.txHash.slice(0, 6)}…{game.txHash.slice(-4)}
                            <FaExternalLinkAlt size={9} />
                          </a>
                        ) : (
                          <span className="text-gray-500 text-xs italic">pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {visibleRows.map((game) => {
              const { statusColor, statusLabel, multColor } = statusForGame(game);
              return (
                <div
                  key={game.id}
                  className="rounded-lg border border-[#2a1530]/70 bg-black/20 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 shrink-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">P</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium">Plinko</div>
                        <div className="text-gray-400 text-xs truncate">{game.title || "—"}</div>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <div className="text-white/50 mb-0.5">Bet</div>
                      <div className="text-white font-medium">{game.betAmount}</div>
                    </div>
                    <div>
                      <div className="text-white/50 mb-0.5">Multiplier</div>
                      <div className={`font-semibold ${multColor}`}>{game.multiplier}</div>
                    </div>
                    <div>
                      <div className="text-white/50 mb-0.5">Payout</div>
                      <div className="text-white font-medium">{game.payout}</div>
                    </div>
                    <div>
                      <div className="text-white/50 mb-0.5">TX</div>
                      {game.txHash ? (
                        <a
                          href={gameHistoryProofHref({ chain, txHash: game.txHash, explorerUrl: game.explorerUrl }) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-300 text-xs font-mono"
                        >
                          {game.txHash.slice(0, 6)}…{game.txHash.slice(-4)}
                          <FaExternalLinkAlt size={9} />
                        </a>
                      ) : (
                        <span className="text-gray-500 italic">pending</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {rows.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-800/40 to-pink-700/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaHistory className="text-2xl text-pink-300" />
          </div>
          <p className="text-white/80 text-sm font-medium">No drops yet</p>
          <p className="text-gray-500 text-xs mt-1">Drop your first ball to see results here.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
          <span className="text-gray-400">
            Showing {Math.min(visibleCount, rows.length)} of {rows.length} entries
          </span>
          <span className="text-gray-500">On-chain TX shown after settlement</span>
        </div>
      )}
    </div>
  );
}
