'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  APTC_LAUNCH_METRICS,
  APTC_LAUNCH_STEPS,
  APTC_TOKENOMICS,
  APTC_UTILITY,
  IPO_LAUNCH_MODE,
  APTC_LOGO,
  getTradeResearchTools,
  solscanTokenUrl,
} from '@/lib/config/tokenomics';
import { IPO_SALE, getIpoPhase } from '@/lib/config/ipo';
import { isAptcLaunched } from '@/lib/config/launchStatus';
import IpoStackLogos from '@/components/IpoStackLogos';
import IpoPriceLadder from '@/components/IpoPriceLadder';
import { SolscanLink } from '@/components/ui/SolscanMark';

const AllocationDonut = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.AllocationDonut),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> },
);
const BuybackSplitDonut = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.BuybackSplitDonut),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> },
);
const TraderTransparencyPanel = dynamic(
  () => import('@/components/tokenomics/TokenomicsCharts').then((m) => m.TraderTransparencyPanel),
  { ssr: false, loading: () => <ChartSkeleton height={320} /> },
);

const _MINT = 'TBD';

/** Trade & research — full platform grid (generic URLs pre-TGE, live mint links after Raydium) */
function getTradeTools() {
  return getTradeResearchTools();
}

export default function TokenomicsSection() {
  const [buyback, setBuyback] = useState(null);
  const [market, setMarket] = useState(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const launched = isAptcLaunched();
  const ipoPhase = getIpoPhase();
  const statusBadge =
    launched
      ? '$APTC · Live on Solana'
      : ipoPhase === 'live'
        ? '$APTC · IPO Live'
        : ipoPhase === 'upcoming'
          ? `$APTC · Opens ${IPO_SALE.launchLabel}`
          : ipoPhase === 'ended'
            ? '$APTC · IPO Complete'
            : '$APTC · Launching Soon';
  const statusLive = launched || ipoPhase === 'live';
  const mint = APTC_TOKENOMICS.mint;
  const TRADE_TOOLS = getTradeTools(); // Call at render time to get current launch status

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
  const hasLiveMarket = market?.priceUsd != null;
  const priceUsd = hasLiveMarket ? market.priceUsd : m.approxTokenPriceUsd;
  const mcapUsd = market?.marketCapUsd ?? market?.fdvUsd ?? m.approxMarketCapUsd;
  const vol24h = market?.volume24hUsd ?? null;
  const priceChange24h = market?.priceChange24h ?? null;
  const marketLabel = hasLiveMarket
    ? 'Live market · DexScreener'
    : 'Pre-launch · IPO';

  return (
    <section id="tokenomics" className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-[#070005]">
      <div className="max-w-7xl mx-auto">

        {/* Section heading */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 mb-4">
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
              {statusBadge}
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.08]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
              APTC
            </span>{' '}
            Tokenomics
          </h2>
          <p className="mt-3 max-w-full overflow-x-auto text-sm sm:text-base text-white/55 leading-relaxed whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            1B fixed supply · 25% public IPO · Raydium post-TGE · 0% team / founder allocation.
          </p>
        </div>

        {/* IPO launch */}
        <div className="mb-6 rounded-2xl border border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-950/40 via-[#120010] to-violet-950/30 p-5 md:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={APTC_LOGO} alt="APTC" className="h-10 w-10 rounded-xl object-cover bg-white/5 ring-1 ring-white/10" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-fuchsia-300/80">
                  {IPO_LAUNCH_MODE.label}
                </p>
                <h3 className="text-lg font-semibold text-white">{IPO_SALE.launchLabel}</h3>
                <p className="text-xs text-white/50">{IPO_LAUNCH_MODE.tagline}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 flex-1 min-w-[200px]">
              <LaunchStat label="Raise target" value={`$${(IPO_SALE.raiseTargetUsd / 1000).toFixed(0)}K`} />
              <LaunchStat label="IPO entry" value={`$${IPO_SALE.tokenPriceUsd}`} />
              <LaunchStat label="Sale supply" value={`${IPO_SALE.saleTokensShort} APTC`} />
              <LaunchStat label="Window" value={`${IPO_SALE.durationDays} days`} />
              <LaunchStat label="Post-IPO" value="Raydium LP" />
            </div>
          </div>
          <IpoPriceLadder className="mt-4" />
          <IpoStackLogos variant="compact" className="mt-4" />
        </div>

        {/* ── Main 2-column grid ── */}
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-6 mb-6 lg:items-start">

          {/* LEFT — identity, ticker, trade links, GGR buyback */}
          <div className="flex flex-col gap-5">

            {/* Authority chips + timeline */}
            <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-5 md:p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <AuthorityChip label="Mint revoked" />
                <AuthorityChip label="Freeze revoked" />
                <AuthorityChip label="Fixed-price IPO" />
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-white/45">
                {APTC_LAUNCH_STEPS.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-white/20">→</span>}
                    <span className="text-white/65">{step}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Live ticker */}
            <div className="rounded-2xl border border-white/10 bg-[#120010] p-5 md:p-6">
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
                      : hasLiveMarket ? 'APTC/USD' : 'At pool seed'
                  }
                  loading={marketLoading}
                />
                <TickerStat label="Market cap" value={fmtUsdCompact(mcapUsd)} loading={marketLoading} />
                <TickerStat
                  label="IPO supply"
                  value={`${m.curveSupplyPct}%`}
                  sub={hasLiveMarket ? 'Public sale' : IPO_SALE.launchLabel}
                  loading={marketLoading}
                />
                <TickerStat
                  label="24h volume"
                  value={vol24h != null ? fmtUsdCompact(vol24h) : '—'}
                  loading={marketLoading}
                />
              </div>
              <div className={`mt-4 flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                launched 
                  ? 'border-emerald-500/30 bg-emerald-500/10' 
                  : 'border-amber-500/30 bg-amber-500/10'
              }`}>
                {launched ? (
                  <>
                    <span className="text-emerald-200/90 font-medium truncate flex-1">
                      {mint}
                    </span>
                    <SolscanLink
                      href={solscanTokenUrl(mint)}
                      size={14}
                      className="text-emerald-300 hover:text-emerald-100 font-medium whitespace-nowrap"
                    >
                      Solscan
                    </SolscanLink>
                  </>
                ) : (
                  <span className="text-amber-200/90 font-medium">Contract Address (CA): Launching soon after IPO Sale Ends</span>
                )}
              </div>
            </div>

            {/* Trade & research grid */}
            <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-5 md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35 mb-3">
                Trade & research
              </p>
              <div className="grid grid-cols-4 gap-2">
                {TRADE_TOOLS.map((t) => {
                  const isExternal = !t.href.startsWith('/');
                  const cls = "group flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2.5 hover:border-white/20 hover:bg-white/[0.06] transition-all";
                  const inner = (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.logo} alt={t.label} className="w-7 h-7 rounded-lg object-contain bg-white/5 shrink-0" />
                      <span className="text-[10px] font-medium text-white/60 group-hover:text-white text-center leading-tight transition-colors truncate w-full text-center">{t.label}</span>
                    </>
                  );
                  return isExternal ? (
                    <a key={t.id} href={t.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                  ) : (
                    <Link key={t.id} href={t.href} className={cls}>{inner}</Link>
                  );
                })}
              </div>
            </div>

            {/* GGR buyback — fills left column under trade tools */}
            <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-5 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-1">GGR → buyback</h3>
              <p className="text-sm text-white/50 mb-2">
                Play → GGR → market buy on Jupiter / Raydium → burn · stake · treasury
              </p>
              <BuybackSplitDonut config={cfg} />
              {est?.projectedBuybackUsd30d != null && (
                <p className="text-xs text-white/50 border-t border-white/10 pt-4 mt-6">
                  30d buyback budget:{' '}
                  <span className="text-white/80 font-mono">${fmtUsd(est.projectedBuybackUsd30d)}</span>
                  {est.projectedBurnAptc30d != null && est.aptcPriceUsd ? (
                    <>
                      {' '}· est. burn{' '}
                      <span className="text-white/70 font-mono">{fmtNum(est.projectedBurnAptc30d)} APTC</span>
                    </>
                  ) : null}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — supply allocation + creator ops */}
          <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-6 md:p-8">
            <h3 className="text-xl font-semibold text-white mb-1">Supply allocation</h3>
            <p className="text-xs text-white/45 mb-5">
              25% public IPO · Raydium LP · 0% team
            </p>
            <AllocationDonut />
          </div>
        </div>

        {/* ── Transparency / trader due diligence ── */}
        <div className="mb-6">
          <TraderTransparencyPanel />
        </div>

        {/* ── Why APTC — 4-column row ── */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Why APTC</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
