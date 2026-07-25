/**
 * DexScreener helper for APTC on Robinhood Chain (Virtuals Protocol).
 * Pulls the most-liquid pair and exposes price, FDV/market-cap and TVL (= USD liquidity).
 *
 * Token address: NEXT_PUBLIC_APTC_TOKEN_ADDRESS (preferred) or legacy NEXT_PUBLIC_APTC_SOLANA_MINT.
 * When unset (pre-launch), fetchers resolve to null without throwing so the UI can render
 * an indicative "Pre-launch" state.
 */

import {
  APTC_TOKEN_ADDRESS_DEFAULT,
  APTC_DEXSCREENER_PAIR_DEFAULT,
} from '@/lib/config/launchStatus';

const DEX_CHAIN = 'robinhood';

export const APTC_SOLANA_MINT =
  process.env.NEXT_PUBLIC_APTC_TOKEN_ADDRESS?.trim() ||
  process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim() ||
  APTC_TOKEN_ADDRESS_DEFAULT ||
  '';

/** DexScreener pair or token address — preferred for quotes when configured. */
const APTC_DEX_PAIR =
  process.env.NEXT_PUBLIC_APTC_DEXSCREENER_PAIR?.trim() ||
  process.env.APTC_DEX_PAIR_ADDRESS?.trim() ||
  process.env.APTC_RAYDIUM_POOL_ADDRESS?.trim() || // legacy env name
  APTC_DEXSCREENER_PAIR_DEFAULT ||
  '';

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

function pairToStats(top: DexscreenerPair, mint: string | null): DexscreenerStats {
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
    mint,
    fetchedAt: new Date().toISOString(),
  };
}

function emptyStats(mint: string | null): DexscreenerStats {
  return {
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
    mint,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchDexscreenerJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchPairDexscreenerStats(
  pairAddress: string,
  mint: string | null,
): Promise<DexscreenerStats | null> {
  const data = (await fetchDexscreenerJson(
    `https://api.dexscreener.com/latest/dex/pairs/${DEX_CHAIN}/${pairAddress}`,
  )) as { pair?: DexscreenerPair; pairs?: DexscreenerPair[] } | null;
  if (!data) return null;

  const pair = data.pair ?? (Array.isArray(data.pairs) ? data.pairs[0] : null);
  if (!pair?.priceUsd) return null;
  return pairToStats(pair, mint);
}

async function fetchTokenDexscreenerStats(mint: string): Promise<DexscreenerStats | null> {
  const data = (await fetchDexscreenerJson(
    `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
  )) as { pairs?: DexscreenerPair[] } | null;
  if (!data) return null;

  const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
  if (pairs.length === 0) return null;

  const sorted = [...pairs].sort(
    (a, b) => Number(b?.liquidity?.usd ?? 0) - Number(a?.liquidity?.usd ?? 0),
  );
  const top = sorted[0];
  if (!top?.priceUsd) return null;
  return pairToStats(top, mint);
}

export async function fetchAptcDexscreenerStats(): Promise<DexscreenerStats> {
  const mint = APTC_SOLANA_MINT || null;
  const empty = emptyStats(mint);

  if (APTC_DEX_PAIR) {
    const fromPair = await fetchPairDexscreenerStats(APTC_DEX_PAIR, mint);
    if (fromPair?.priceUsd != null) return fromPair;
  }

  if (!mint) return empty;

  const fromToken = await fetchTokenDexscreenerStats(mint);
  return fromToken ?? empty;
}
