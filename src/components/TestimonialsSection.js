'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaQuoteLeft, FaTrophy } from 'react-icons/fa';
import { explorerAddressUrl } from '@/lib/chains/explorer';

function formatRelative(tsSec) {
  if (!tsSec) return null;
  const diff = Date.now() / 1000 - Number(tsSec);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

function winAmountLabel(w) {
  return w.biggestWinDisplay || `${w.biggestWinApt?.toLocaleString('en-US', { maximumFractionDigits: 4 }) ?? '0'}`;
}

const TestimonialsSection = () => {
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleConfigured, setModuleConfigured] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/players/top-wins?top=8');
        const d = await r.json();
        setWins(d.wins ?? []);
        setModuleConfigured(d.moduleConfigured !== false);
      } catch {
        setWins([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (wins.length < 2) return;
    const id = setInterval(() => {
      setActiveIndex((p) => (p + 1) % wins.length);
    }, 8000);
    return () => clearInterval(id);
  }, [wins.length]);

  const featured = wins[activeIndex];

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 relative overflow-hidden">
      <div className="absolute -top-20 left-1/4 w-64 h-64 rounded-full bg-red-magic/5 blur-[100px] z-0"></div>
      <div className="absolute -bottom-20 right-1/4 w-64 h-64 rounded-full bg-blue-magic/5 blur-[100px] z-0"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center mb-3 justify-center">
          <div className="w-1 h-6 bg-gradient-to-r from-red-magic to-blue-magic rounded-full mr-3"></div>
          <h2 className="text-2xl font-display font-bold text-white">Biggest wins on-chain</h2>
        </div>
        <p className="text-center text-white/55 text-sm max-w-2xl mx-auto mb-12">
          Pulled live from Aptos <code className="text-xs bg-white/10 px-1 rounded">game_logger</code> and verified
          Supabase play events (Solana + multichain). Each row is a real wallet and single-round profit (payout − bet).
        </p>

        {loading ? (
          <p className="text-white/50 text-center">Loading on-chain wins…</p>
        ) : !moduleConfigured ? (
          <div className="p-[1px] bg-gradient-to-r from-red-magic/30 to-blue-magic/30 rounded-xl max-w-2xl mx-auto">
            <div className="bg-[#120010] rounded-xl p-8 text-center">
              <p className="text-white font-medium mb-1">On-chain log not configured.</p>
              <p className="text-white/50 text-sm">
                Set <code className="text-xs">NEXT_PUBLIC_CASINO_MODULE_ADDRESS</code> to enable this section.
              </p>
            </div>
          </div>
        ) : wins.length === 0 ? (
          <div className="p-[1px] bg-gradient-to-r from-red-magic/30 to-blue-magic/30 rounded-xl max-w-2xl mx-auto">
            <div className="bg-[#120010] rounded-xl p-8 text-center">
              <p className="text-white font-medium mb-1">No wins logged yet.</p>
              <p className="text-white/50 text-sm">
                Wins appear here after logged play rounds (on-chain Aptos or recorded Solana fairness events).
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="p-[1px] bg-gradient-to-r from-red-magic to-blue-magic rounded-xl">
              <div className="bg-[#1A0015] rounded-xl p-6 md:p-8 h-full relative">
                <FaQuoteLeft className="text-red-magic/20 text-6xl absolute top-4 right-4" />

                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-red-magic/40 to-blue-magic/40 flex items-center justify-center mr-4">
                        <FaTrophy className="text-amber-200" />
                      </div>
                      <div>
                        <Link
                          href={explorerAddressUrl(featured.chain || 'aptos', featured.wallet) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium font-mono hover:underline"
                        >
                          {featured.walletShort}
                        </Link>
                        <p className="text-white/50 text-xs mt-0.5">
                          {featured.bets} bets · {featured.wins} wins
                          {featured.biggestWinAt
                            ? ` · biggest hit ${formatRelative(featured.biggestWinAt)}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <p className="text-white/80 text-lg leading-snug">
                      Hit a single-round profit of{' '}
                      <span className="text-amber-200 font-semibold">{winAmountLabel(featured)}</span>{' '}
                      on <span className="text-white">{featured.biggestWinGameLabel}</span>.
                    </p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-white/50 text-sm">Favorite Game</p>
                        <p className="text-white">{featured.favoriteGameLabel}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Biggest Win</p>
                        <p className="text-white font-bold">{winAmountLabel(featured)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-center md:text-left mb-6">
                <h3 className="text-white text-lg font-medium">Top wins this period</h3>
                <p className="text-white/60">
                  Real wallets, real payouts — sourced directly from the on-chain game log. Click any wallet to view
                  it on Solscan or Aptos Explorer.
                </p>
              </div>

              <div className="space-y-3">
                {wins.map((w, index) => (
                  <button
                    key={`${w.chain || 'aptos'}-${w.wallet}`}
                    type="button"
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      activeIndex === index
                        ? 'bg-gradient-to-r from-red-magic/20 to-blue-magic/20 border-l-2 border-red-magic'
                        : 'hover:bg-[#250020]/30'
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#250020] flex items-center justify-center mr-3 text-amber-200 text-sm font-semibold">
                        #{index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-mono text-sm truncate">{w.walletShort}</p>
                        <p className="text-white/55 text-xs">
                          {w.biggestWinGameLabel} · {w.bets} bets
                        </p>
                      </div>
                      <span className="ml-auto text-amber-200/90 text-sm tabular-nums font-semibold">
                        {winAmountLabel(w)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {wins.length > 0 && (
          <div className="flex justify-center mt-6 md:hidden">
            {wins.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 mx-1 rounded-full ${activeIndex === index ? 'bg-red-magic' : 'bg-white/30'}`}
                aria-label={`Go to win ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
