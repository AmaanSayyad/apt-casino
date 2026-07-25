'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  APTC_LAUNCH_METRICS,
  APTC_LAUNCH_STEPS,
  APTC_TOKENOMICS,
  APTC_UTILITY,
  VIRTUALS_LOGO_SRC,
  virtualsTokenUrl,
  explorerTokenUrl,
  dexscreenerTokenUrl,
  dexscreenerPairUrl,
} from '@/lib/config/tokenomics';
import { isAptcLaunched, hasAptcMintConfigured, getAptcPairAddress } from '@/lib/config/launchStatus';
import PumpLaunchPanel from '@/components/PumpLaunchPanel';

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

/** Get trade tools with conditional URLs based on launch status */
function getTradeTools() {
  const launched = isAptcLaunched();
  const mint = APTC_TOKENOMICS.mint;

  if (!launched) {
    const pair = getAptcPairAddress();
    const dexHref = pair ? dexscreenerPairUrl(pair) : 'https://dexscreener.com/robinhood';
    return [
      { id: 'virtuals',     label: 'Virtuals',       logo: VIRTUALS_LOGO_SRC,              href: virtualsTokenUrl(mint) },
      { id: 'dexscreener',  label: 'DexScreener',    logo: '/logos/dexscreener.png',       href: dexHref },
      { id: 'uniswap',      label: 'Uniswap',        logo: '/logos/uniswap-uni-logo.png', href: 'https://app.uniswap.org/' },
      { id: 'gecko',        label: 'GeckoTerminal',  logo: '/logos/gecko.png',             href: 'https://www.geckoterminal.com/' },
      { id: 'dextools',     label: 'DexTools',       logo: '/logos/dextools.png',          href: 'https://www.dextools.io/' },
      { id: 'axiom',        label: 'Axiom',          logo: '/logos/axiom.jpeg',            href: 'https://axiom.trade/' },
      { id: 'coingecko',    label: 'CoinGecko',      logo: '/logos/coingecko-logo.png',    href: 'https://www.coingecko.com/' },
      { id: 'cmc',          label: 'CMC',            logo: '/logos/cmc.png',               href: 'https://coinmarketcap.com/' },
    ];
  }

  return [
    { id: 'virtuals',     label: 'Virtuals',       logo: VIRTUALS_LOGO_SRC,              href: virtualsTokenUrl(mint) },
    { id: 'dexscreener',  label: 'DexScreener',    logo: '/logos/dexscreener.png',       href: dexscreenerTokenUrl(mint) },
    { id: 'uniswap',      label: 'Uniswap',        logo: '/logos/uniswap-uni-logo.png', href: `https://app.uniswap.org/explore/tokens/robinhood/${mint}` },
    { id: 'gecko',        label: 'GeckoTerminal',  logo: '/logos/gecko.png',             href: `https://www.geckoterminal.com/robinhood/tokens/${mint}` },
    { id: 'dextools',     label: 'DexTools',       logo: '/logos/dextools.png',          href: `https://www.dextools.io/app/en/robinhood/pair-explorer/${mint}` },
    { id: 'axiom',        label: 'Axiom',          logo: '/logos/axiom.jpeg',            href: `https://axiom.trade/token/${mint}` },
    { id: 'coingecko',    label: 'CoinGecko',      logo: '/logos/coingecko-logo.png',    href: `https://www.coingecko.com/en/coins/${mint}` },
    { id: 'cmc',          label: 'CMC',            logo: '/logos/cmc.png',               href: `https://coinmarketcap.com/currencies/${mint}/` },
  ];
}

export default function TokenomicsSection() {
  const [buyback, setBuyback] = useState(null);
  const [market, setMarket] = useState(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const launched = isAptcLaunched();
  const mintConfigured = hasAptcMintConfigured();
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
    : market?.pump?.source === 'live'
      ? 'Live · Virtuals'
      : 'Pre-launch · Virtuals';

  return (
    <section id="tokenomics" className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-[#070005]">
      <div className="max-w-7xl mx-auto">

        {/* Section heading */}
        <div className="mb-8">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.08]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
              APTC
            </span>{' '}
            Tokenomics
          </h2>
          <p className="mt-3 max-w-full overflow-x-auto text-sm sm:text-base text-white/55 leading-relaxed whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            1B fixed supply · Virtuals on Robinhood · 93.5% LP · 5% veVIRTUAL · 1.5% vested team buy.
          </p>
        </div>

        {/* ── Main 2-column grid ── */}
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-6 mb-6 items-start">

          {/* LEFT — market + launch + tools + buyback (fills the column, no dead stretch) */}
          <div className="flex flex-col gap-5">

            {/* Authority chips + timeline */}
            <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-5 md:p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <AuthorityChip label="Robinhood Chain" />
                <AuthorityChip label="Virtuals agent" />
                <AuthorityChip label="93.5% LP" />
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
                  label="Liquidity"
                  value={
                    market?.liquidityUsd != null
                      ? fmtUsdCompact(market.liquidityUsd)
                      : '—'
                  }
                  sub={hasLiveMarket ? 'Pool depth' : 'Post-launch'}
                  loading={marketLoading}
                />
                <TickerStat
                  label="24h volume"
                  value={vol24h != null ? fmtUsdCompact(vol24h) : '—'}
                  loading={marketLoading}
                />
              </div>
              <div className={`mt-4 flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                mintConfigured
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              }`}>
                {mintConfigured ? (
                  <>
                    <span className="text-emerald-200/90 font-medium truncate flex-1 font-mono">
                      {mint}
                    </span>
                    <a
                      href={explorerTokenUrl(mint)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-100 transition-colors font-medium whitespace-nowrap"
                    >
                      DexScreener →
                    </a>
                  </>
                ) : (
                  <span className="text-amber-200/90 font-medium">Token address: Launching soon</span>
                )}
              </div>
            </div>

            <PumpLaunchPanel pump={market?.pump} loading={marketLoading} compact />

            {/* Trade & research */}
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

            {/* GGR buyback — same column so left side isn't empty */}
            <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-5 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-1">GGR → buyback</h3>
              <p className="text-sm text-white/50 mb-3">
                Play → GGR → market buy on Robinhood / Uniswap → burn · stake · treasury
              </p>
              <BuybackSplitDonut config={cfg} />
              {est?.projectedBuybackUsd30d != null && (
                <p className="text-xs text-white/50 border-t border-white/10 pt-4 mt-4">
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

          {/* RIGHT — supply + ops */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-white/10 bg-[#1A0015] p-6 md:p-8">
              <h3 className="text-xl font-semibold text-white mb-1">Supply allocation</h3>
              <p className="text-xs text-white/45 mb-5">
                93.5% LP · 5% veVIRTUAL · 1.5% vested team buy
              </p>
              <AllocationDonut />
            </div>
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
