/**
 * Bags.fm REST API client (server-only).
 * @see https://docs.bags.fm/api-reference/introduction
 */

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';

type BagsEnvelope<T> = {
  success: boolean;
  response?: T;
  error?: string;
};

export type BagsPoolRecord = {
  tokenMint: string;
  dbcConfigKey: string;
  dbcPoolKey: string;
  dammV2PoolKey: string | null;
};

export type BagsClaimStat = {
  wallet: string;
  totalClaimed: string;
  royaltyBps: number;
  isCreator: boolean;
  bagsUsername?: string;
  twitterUsername?: string;
};

function getBagsApiKey(): string | null {
  const key = process.env.BAGS_API_KEY?.trim();
  return key || null;
}

async function bagsGet<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  const apiKey = getBagsApiKey();
  if (!apiKey) return null;

  const url = new URL(`${BAGS_API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as BagsEnvelope<T>;
    if (!data.success || data.response === undefined) return null;
    return data.response;
  } catch {
    return null;
  }
}

export function isBagsApiConfigured(): boolean {
  return Boolean(getBagsApiKey());
}

export async function fetchBagsPoolByMint(mint: string): Promise<BagsPoolRecord | null> {
  return bagsGet<BagsPoolRecord>('/solana/bags/pools/token-mint', { tokenMint: mint });
}

export async function fetchBagsLifetimeFeesLamports(mint: string): Promise<string | null> {
  const fees = await bagsGet<string>('/token-launch/lifetime-fees', { tokenMint: mint });
  return fees ?? null;
}

export async function fetchBagsClaimStats(mint: string): Promise<BagsClaimStat[] | null> {
  const stats = await bagsGet<BagsClaimStat[]>('/token-launch/claim-stats', { tokenMint: mint });
  return stats ?? null;
}

export function lamportsToSol(lamports: string | number | bigint | null | undefined): number | null {
  if (lamports === null || lamports === undefined) return null;
  try {
    const n = Number(lamports);
    if (!Number.isFinite(n)) return null;
    return n / 1_000_000_000;
  } catch {
    return null;
  }
}
