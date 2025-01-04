/**
 * DexScreener helper for SPL APTC (Solana).
 * Pulls the most-liquid pair and exposes price, FDV/market-cap and TVL (= USD liquidity).
 *
 * APTC mint is read from NEXT_PUBLIC_APTC_SOLANA_MINT. When it is not configured
 * (pre-launch), fetchers resolve to null without throwing so the UI can render an
 * indicative "Pre-launch" state.
 */

export const APTC_SOLANA_MINT = process.env.NEXT_PUBLIC_APTC_SOLANA_MINT || '';

export type DexscreenerStats = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  priceChange24h: number | null;
  pairUrl: string | null;
  pairAddress: string | null;
  dexId: string | null;
  source: 'dexscreener';
  mint: string | null;
  fetchedAt: string;
};

type DexscreenerPair = {
  pairAddress?: string;
  url?: string;
  dexId?: string;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
};

function num(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export async function fetchAptcDexscreenerStats(): Promise<DexscreenerStats> {
  const empty: DexscreenerStats = {
    priceUsd: null,
    marketCapUsd: null,
    fdvUsd: null,
    liquidityUsd: null,
    volume24hUsd: null,
    priceChange24h: null,
    pairUrl: null,
    pairAddress: null,
    dexId: null,
    source: 'dexscreener',
    mint: APTC_SOLANA_MINT || null,
    fetchedAt: new Date().toISOString(),
  };

  if (!APTC_SOLANA_MINT) return empty;

  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${APTC_SOLANA_MINT}`,
      { cache: 'no-store', signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return empty;

    const data = (await res.json()) as { pairs?: DexscreenerPair[] };
    const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
    if (pairs.length === 0) return empty;

    // Most-liquid pair wins (avoids stale / illiquid prints).
    const sorted = [...pairs].sort(
      (a, b) => Number(b?.liquidity?.usd ?? 0) - Number(a?.liquidity?.usd ?? 0),
    );
    const top = sorted[0] || {};

    return {
      priceUsd: num(top.priceUsd),
      marketCapUsd: num(top.marketCap),
      fdvUsd: num(top.fdv),
      liquidityUsd: num(top.liquidity?.usd),
      volume24hUsd: num(top.volume?.h24),
      priceChange24h: num(top.priceChange?.h24),
      pairUrl: top.url ?? null,
      pairAddress: top.pairAddress ?? null,
      dexId: top.dexId ?? null,
      source: 'dexscreener',
      mint: APTC_SOLANA_MINT,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return empty;
  }
}
