/** Pyth Hermes SOL/USD — cached ~3 min; falls back to env override. */

const CACHE_MS = 180_000;

let cached: { price: number; at: number } | null = null;

function parsePythPrice(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as { parsed?: unknown[] };
  const feeds = Array.isArray(payload) ? payload : root.parsed;
  if (!Array.isArray(feeds) || feeds.length === 0) return null;
  const row = feeds[0] as {
    price?: { price?: string; expo?: number };
    ema_price?: { price?: string; expo?: number };
  };
  const p = row.price ?? row.ema_price;
  if (!p?.price || p.expo === undefined) return null;
  const raw = Number(p.price);
  const expo = Number(p.expo);
  if (!Number.isFinite(raw) || !Number.isFinite(expo)) return null;
  const usd = raw * 10 ** expo;
  return usd > 0 ? usd : null;
}

async function fetchPythSolUsd(): Promise<number | null> {
  const feedId =
    process.env.PYTH_SOL_USD_FEED_ID?.trim() ||
    'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
  const url = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${encodeURIComponent(`0x${feedId.replace(/^0x/, '')}`)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 180 } });
    if (!res.ok) return null;
    const json = await res.json();
    return parsePythPrice(json);
  } catch {
    return null;
  }
}

/**
 * SOL/USD spot for IPO settlement. Cached ~3 min; falls back to env override.
 */
export async function getSolUsdPrice(): Promise<number> {
  const fallback = Number(process.env.IPO_SOL_USD_FALLBACK);
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.price;

  const live = await fetchPythSolUsd();
  if (live && Number.isFinite(live)) {
    cached = { price: live, at: now };
    return live;
  }
  if (Number.isFinite(fallback) && fallback > 0) {
    cached = { price: fallback, at: now };
    return fallback;
  }
  if (cached) return cached.price;
  throw new Error('SOL/USD price unavailable — configure IPO_SOL_USD_FALLBACK or Pyth feed.');
}

export function solToAptc(solAmount: number, solUsd: number, aptcPriceUsd: number): number {
  if (solAmount <= 0 || solUsd <= 0 || aptcPriceUsd <= 0) return 0;
  const usd = solAmount * solUsd;
  return usd / aptcPriceUsd;
}

export function estimateStakingReward(
  aptcAmount: number,
  apyBps: number,
  lockDays: number,
): number {
  if (aptcAmount <= 0 || apyBps <= 0 || lockDays <= 0) return 0;
  return aptcAmount * (apyBps / 10_000) * (lockDays / 365);
}
