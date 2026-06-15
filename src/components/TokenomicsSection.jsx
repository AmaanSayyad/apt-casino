'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  APTC_LAUNCH_METRICS,
  APTC_LAUNCH_STEPS,
  APTC_TOKENOMICS,
  APTC_UTILITY,
  APTC_WALLETS,
  getAptcTradeLinks,
  getWalletAllocationColor,
  solscanAccountUrl,
  solscanTokenUrl,
  truncateAddress,
} from '@/lib/config/tokenomics';

const AllocationDonut = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.AllocationDonut),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> },
);
const BuybackSplitDonut = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.BuybackSplitDonut),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> },
);

export default function TokenomicsSection() {
  const [buyback, setBuyback] = useState(null);
  const [market, setMarket] = useState(null);
  const [marketLoading, setMarketLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadMarket = () => {
      fetch('/api/staking/aptc-stats', { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setMarket(data);
        })
        .catch(() => {
          if (!cancelled) setMarket(null);
        })
        .finally(() => {
          if (!cancelled) setMarketLoading(false);
        });
    };

    fetch('/api/ggr/buyback')
      .then((r) => r.json())
      .then(setBuyback)
      .catch(() => {});

    loadMarket();
    const id = setInterval(loadMarket, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const cfg = buyback?.config;
  const est = buyback?.estimates;
  const m = APTC_LAUNCH_METRICS;
  const tradeLinks = getAptcTradeLinks({
    pairUrl: market?.pairUrl ?? undefined,
  });

  const hasLiveMarket = market?.priceUsd != null;
  const priceUsd = hasLiveMarket ? market.priceUsd : m.approxTokenPriceUsd;
  const mcapUsd = market?.marketCapUsd ?? market?.fdvUsd ?? m.approxMarketCapUsd;
  const liqUsd = market?.liquidityUsd ?? m.approxLiquidityUsd;
  const vol24h = market?.volume24hUsd ?? null;
  const priceChange24h = market?.priceChange24h ?? null;
  const marketLabel = hasLiveMarket ? 'Live market · DexScreener' : 'Launch targets';

  return (
    <section id="tokenomics" className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-[#070005]">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-6 md:p-10 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
                  $APTC · Live on Solana
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.08]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
                  APTC
                </span>{' '}
                Tokenomics
              </h2>

              <p className="mt-4 text-base md:text-lg text-white/60 leading-relaxed">
                1B fixed supply · fair launch on Raydium CPMM (1B APTC + 40 SOL). Casino GGR funds
                open-market buybacks — not empty emissions.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <AuthorityChip label="Mint revoked" />
                <AuthorityChip label="Freeze revoked" />
                <AuthorityChip label="Update revoked" />
              </div>

              {/* Launch timeline */}
              <div className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-white/45">
                {APTC_LAUNCH_STEPS.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-white/20">→</span>}
                    <span className="text-white/65">{step}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Live ticker */}
            <div className="rounded-2xl border border-white/10 bg-[#120010] p-4 md:p-5 w-full lg:max-w-md shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40 mb-3">
                {marketLabel}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <TickerStat
                  label="Price"
                  value={fmtPrice(priceUsd)}
                  sub={
                    priceChange24h != null
                      ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}% 24h`
                      : hasLiveMarket
                        ? 'APTC/USD'
                        : 'At pool seed'
                  }
                  loading={marketLoading}
                />
                <TickerStat label="Market cap" value={fmtUsdCompact(mcapUsd)} loading={marketLoading} />
                <TickerStat label="Liquidity" value={fmtUsdCompact(liqUsd)} sub="DEX pool" loading={marketLoading} />
                <TickerStat
                  label="24h volume"
                  value={vol24h != null ? fmtUsdCompact(vol24h) : '—'}
                  loading={marketLoading}
                />
              </div>
              {!marketLoading && !hasLiveMarket && (
                <p className="mt-3 text-[10px] text-amber-200/70 leading-relaxed">
                  Targets from Raydium pool seed (1B APTC + 40 SOL). Live DexScreener quotes appear once
                  the pair is indexed.
                </p>
              )}
              <a
                href={solscanTokenUrl(APTC_TOKENOMICS.mint)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-mono text-white/70 hover:text-white hover:border-white/20 transition-colors"
              >
                <span className="truncate">{APTC_TOKENOMICS.mint}</span>
                <span className="shrink-0 text-white/45">Solscan ↗</span>
              </a>
            </div>
          </div>

          {/* Launch stats + trade */}
          <div className="mt-8 pt-6 border-t border-white/[0.07] space-y-6">
            <div className="flex flex-wrap gap-2">
              <LaunchStat label="Pool" value={`${m.aptcInLpShort} + ${m.solInLp} SOL`} />
              <LaunchStat label="Fee tier" value={`${m.feeTierPct}%`} />
              <LaunchStat label="Launch MC" value={`~$${(m.approxMarketCapUsd / 1000).toFixed(1)}k`} />
              <LaunchStat label="Liquidity" value={`~$${(m.approxLiquidityUsd / 1000).toFixed(1)}k`} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35 mb-3">
                Trade & research
              </p>
              <div className="flex flex-wrap gap-2">
                {tradeLinks.map((link) =>
                  link.external ? (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex flex-col rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 hover:border-white/20 hover:bg-white/[0.06] transition-all min-w-[108px]"
                    >
                      <span className="text-sm font-semibold text-white">{link.label}</span>
                      <span className="text-[10px] text-white/40">{link.sub}</span>
                    </a>
                  ) : (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="group inline-flex flex-col rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 hover:border-white/20 hover:bg-white/[0.06] transition-all min-w-[108px]"
                    >
                      <span className="text-sm font-semibold text-white">{link.label}</span>
                      <span className="text-[10px] text-white/40">{link.sub}</span>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-6 md:p-8 h-full">
            <h3 className="text-xl font-semibold text-white mb-1">Supply allocation</h3>
            <p className="text-xs text-white/45 mb-6">1B APTC · 100% Raydium LP</p>
            <AllocationDonut />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-6 md:p-8 h-full">
            <h3 className="text-xl font-semibold text-white mb-1">GGR → buyback</h3>
            <p className="text-sm text-white/50 mb-2">
              Play → GGR → market buy on Raydium & Jupiter → burn · stake · treasury
            </p>
            <BuybackSplitDonut config={cfg} />
            {est?.projectedBuybackUsd30d != null && (
              <p className="text-xs text-white/50 border-t border-white/10 pt-4 mt-6">
                30d buyback budget:{' '}
                <span className="text-white/80 font-mono">${fmtUsd(est.projectedBuybackUsd30d)}</span>
                {est.projectedBurnAptc30d != null && est.aptcPriceUsd ? (
                  <>
                    {' '}
                    · est. burn{' '}
                    <span className="text-white/70 font-mono">{fmtNum(est.projectedBurnAptc30d)} APTC</span>
                  </>
                ) : null}
              </p>
            )}
          </div>
        </div>

        {/* Wallets */}
        <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-6 md:p-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Launch wallet</h3>
              <p className="text-sm text-white/50 mt-1">Full supply minted here · deposited into Raydium CPMM.</p>
            </div>
            <span className="text-xs font-mono text-white/40">fair launch</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {APTC_WALLETS.map((w) => (
              <WalletCard key={w.id} wallet={w} />
            ))}
          </div>
        </div>

        {/* Utility */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Why APTC</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {APTC_UTILITY.map((u) => (
              <div key={u.title} className="rounded-xl border border-white/10 bg-[#1A0015] p-5">
                <h4 className="text-white font-semibold mb-1.5">{u.title}</h4>
                <p className="text-sm text-white/55 leading-relaxed">{u.body}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-10 max-w-2xl mx-auto">
          Not financial advice. Market data from DexScreener when configured. GGR figures are protocol estimates.
        </p>
      </div>
    </section>
  );
}

function WalletCard({ wallet: w }) {
  return (
    <a
      href={solscanAccountUrl(w.address)}
      target="_blank"
      rel="noopener noreferrer"
      title={w.purpose}
      className="group rounded-xl border border-white/[0.08] bg-[#120010] p-4 hover:border-white/20 hover:bg-white/[0.03] transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-white min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: getWalletAllocationColor(w.id) }}
          />
          <span className="truncate">{w.label}</span>
        </span>
        <span className="font-mono text-sm text-white/75 shrink-0">{w.amountShort}</span>
      </div>
      <p className="text-[11px] text-white/40 mb-2">
        {w.pct}% · {w.purposeShort}
      </p>
      <p className="font-mono text-[10px] text-white/45 group-hover:text-white/70 transition-colors">
        {truncateAddress(w.address, 5)} ↗
      </p>
    </a>
  );
}

function LaunchStat({ label, value }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs">
      <span className="text-white/40">{label}</span>
      <span className="font-mono text-white/80">{value}</span>
    </span>
  );
}

function AuthorityChip({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/65">
      <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
      {label}
    </span>
  );
}

function TickerStat({ label, value, sub, loading }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-widest text-white/35 mb-0.5">{label}</p>
      {loading ? (
        <div className="h-6 w-16 rounded bg-white/10 animate-pulse" />
      ) : (
        <p className="text-lg font-bold text-white tabular-nums leading-tight">{value}</p>
      )}
      {sub && !loading && <p className="text-[10px] mt-0.5 tabular-nums text-white/40">{sub}</p>}
    </div>
  );
}

function ChartSkeleton({ height }) {
  return (
    <div className="w-full rounded-xl bg-white/[0.03] animate-pulse" style={{ height }} aria-hidden />
  );
}

function fmtUsd(n) {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function fmtUsdCompact(n) {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPrice(n) {
  if (!Number.isFinite(n)) return '—';
  if (n < 0.00001) return `$${n.toFixed(8)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function fmtNum(n) {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
