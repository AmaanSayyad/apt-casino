'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isAptcLaunched, getLaunchStyles } from '@/lib/config/launchStatus';

const EMBED_PARAMS =
  'embed=1&loadChartSettings=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15';

function buildEmbedUrl(pairUrl, pairAddress) {
  if (pairUrl) {
    const base = pairUrl.split('?')[0];
    return `${base}?${EMBED_PARAMS}`;
  }
  if (pairAddress) {
    return `https://dexscreener.com/robinhood/${pairAddress}?${EMBED_PARAMS}`;
  }
  return null;
}

function formatDexLabel(dexId) {
  if (!dexId) return 'Robinhood';
  return dexId.charAt(0).toUpperCase() + dexId.slice(1);
}

export default function DexscreenerEmbedSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const launched = isAptcLaunched();
  const styles = getLaunchStyles();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/staking/aptc-stats');
        const j = await r.json();
        if (!cancelled && r.ok) setStats(j);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pairUrl = stats?.pairUrl ?? null;
  const pairAddress = stats?.pairAddress ?? null;
  const embedUrl = buildEmbedUrl(pairUrl, pairAddress);
  const dexLabel = formatDexLabel(stats?.dexId);
  const hasLivePair = Boolean(embedUrl && launched); // Only show embed if launched AND pair exists

  return (
    <section className="apt-dex-section border-y border-white/[0.06] bg-[#070005] py-16 md:py-20 site-page-pad-x">
      <div className="max-w-[1480px] mx-auto w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className={`inline-flex items-center gap-2.5 rounded-full border ${styles.badgeBorder} ${styles.badgeBg} px-4 py-2 mb-4`}>
              <span className={`w-2 h-2 rounded-full ${styles.dotColor} ${hasLivePair ? styles.dotShadow : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                {hasLivePair ? 'Live chart' : 'Chart'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
              APTC / VIRTUAL
              {hasLivePair && (
                <span className="text-base md:text-lg font-semibold text-white/30 uppercase tracking-wider ml-1">
                  · Robinhood · {dexLabel}
                </span>
              )}
            </h2>
            <p className="mt-3 w-full max-w-none text-sm md:text-base text-white/50 md:whitespace-nowrap">
              {hasLivePair
                ? 'Real-time chart, liquidity, and trade activity for the $APTC pair on Robinhood Chain.'
                : 'Live chart appears here after Virtuals launch and DexScreener indexing on Robinhood.'}
            </p>
          </div>

          {pairUrl ? (
            <a
              href={pairUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10 hover:border-white/25 transition-all"
            >
              View chart
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ) : (
            <Link
              href="/stake"
              className="inline-flex items-center gap-2 shrink-0 rounded-full border border-purple-400/30 bg-purple-500/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-200 hover:bg-purple-500/20 transition-all"
            >
              Stake APTC
            </Link>
          )}
        </div>

        <div className="apt-dex-embed-slot rounded-2xl border border-white/10 overflow-hidden bg-[#0a0008] shadow-[0_24px_80px_rgba(0,0,0,0.45)] min-h-0">
          {loading ? (
            <div className="apt-dex-embed-placeholder flex items-center justify-center text-white/40 text-sm">
              Loading chart…
            </div>
          ) : hasLivePair ? (
            <div id="apt-dexscreener-embed" className="apt-dex-embed-frame">
              <iframe
                src={embedUrl}
                title="Dexscreener chart: APTC/VIRTUAL on Robinhood"
                allow="clipboard-write; fullscreen"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="apt-dex-embed-placeholder flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-white/70 font-medium text-lg">
                {launched ? 'Indexing DexScreener…' : 'Chart unlocks at launch'}
              </p>
              <p className="w-full max-w-none text-sm text-white/45 md:whitespace-nowrap">
                {launched
                  ? 'Refresh in a few moments once the pool is indexed.'
                  : 'See launch params under Tokenomics.'}
              </p>
              <Link
                href="/#tokenomics"
                className="text-sm text-purple-300 hover:text-white transition-colors"
              >
                APTC tokenomics →
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
