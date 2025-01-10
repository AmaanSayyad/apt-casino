import { getPlayChainConfig } from '@/lib/chains/registry';
import { aggregatePlayEventsSince } from '@/lib/server/gamePlayEvents';
import { fetchAptcDexscreenerStats } from '@/lib/server/dexscreener';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

/** Basis points helpers */
function bps(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n < 0 || n > 10_000) return fallback;
  return Math.floor(n);
}

export function getGgrBuybackConfig() {
  const buybackBps = bps(Number(process.env.GGR_BUYBACK_BPS_OF_GGR), 3000);
  const burnBps = bps(Number(process.env.GGR_BURN_BPS_OF_BUYBACK), 5000);
  const stakerBps = bps(Number(process.env.GGR_STAKER_BPS_OF_BUYBACK), 3500);
  const treasuryBps = bps(Number(process.env.GGR_TREASURY_BPS_OF_BUYBACK), 1500);
  const avgHouseEdgeBps = bps(Number(process.env.GGR_AVG_HOUSE_EDGE_BPS), 250);

  const buybackPctOfGgr = buybackBps / 100;
  const burnPctOfBuyback = burnBps / 100;
  const stakerPctOfBuyback = stakerBps / 100;
  const treasuryPctOfBuyback = treasuryBps / 100;
  const avgHouseEdgePct = avgHouseEdgeBps / 100;

  return {
    buybackBpsOfGgr: buybackBps,
    burnBpsOfBuyback: burnBps,
    stakerBpsOfBuyback: stakerBps,
    treasuryBpsOfBuyback: treasuryBps,
    avgHouseEdgeBps,
    buybackPctOfGgr,
    burnPctOfBuyback,
    stakerPctOfBuyback,
    treasuryPctOfBuyback,
    avgHouseEdgePct,
    solUsdOverride: numEnv('SOL_USD_PRICE_OVERRIDE'),
    aptUsdOverride: numEnv('APT_USD_PRICE_OVERRIDE'),
  };
}

function numEnv(key: string): number | null {
  const v = process.env[key];
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchUsdPrices(): Promise<{ sol: number; apt: number }> {
  let sol = numEnv('SOL_USD_PRICE_OVERRIDE') ?? 150;
  let apt = numEnv('APT_USD_PRICE_OVERRIDE') ?? 8;
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana,aptos&vs_currencies=usd',
      { next: { revalidate: 300 } },
    );
    if (r.ok) {
      const j = await r.json();
      if (j?.solana?.usd) sol = j.solana.usd;
      if (j?.aptos?.usd) apt = j.aptos.usd;
    }
  } catch {
    /* use overrides */
  }
  return { sol, apt };
}

function wagerToUsd(byChain: Record<string, number>, prices: { sol: number; apt: number }): number {
  let usd = 0;
  for (const [chain, native] of Object.entries(byChain)) {
    const sym = getPlayChainConfig(chain)?.nativeSymbol;
    if (sym === 'SOL') usd += native * prices.sol;
    else if (sym === 'APT') usd += native * prices.apt;
    else usd += native * prices.apt;
  }
  return usd;
}

export async function computeGgrEstimates(sinceMs: number | null) {
  const cfg = getGgrBuybackConfig();
  const agg = await aggregatePlayEventsSince(sinceMs);
  const prices = await fetchUsdPrices();
  const wagerUsd = wagerToUsd(agg.totalWageredByChain, prices);
  const ggrUsd = wagerUsd * (cfg.avgHouseEdgeBps / 10_000);
  const projectedBuybackUsd = ggrUsd * (cfg.buybackBpsOfGgr / 10_000);
  const burnUsd = projectedBuybackUsd * (cfg.burnBpsOfBuyback / 10_000);

  const dex = await fetchAptcDexscreenerStats();
  const aptcPriceUsd = dex.priceUsd;
  const projectedBurnAptc =
    aptcPriceUsd && aptcPriceUsd > 0 ? burnUsd / aptcPriceUsd : null;

  return {
    totalBets: agg.totalBets,
    totalWageredUsd: wagerUsd,
    ggrUsd,
    projectedBuybackUsd,
    projectedBurnUsd: burnUsd,
    projectedBurnAptc,
    aptcPriceUsd,
    prices,
    periodMs: sinceMs,
  };
}

export async function listBuybackSnapshots(limit = 20) {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const { data } = await db
    .from('ggr_buyback_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function recordBuybackSnapshot(input: {
  periodStart: string;
  periodEnd: string;
  ggrUsd: number;
  buybackUsd: number;
  aptcBought?: number;
  aptcBurned?: number;
  txSignature?: string;
  notes?: string;
}) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Supabase not configured');
  const { data, error } = await db
    .from('ggr_buyback_snapshots')
    .insert({
      period_start: input.periodStart,
      period_end: input.periodEnd,
      ggr_usd: input.ggrUsd,
      buyback_usd: input.buybackUsd,
      aptc_bought: input.aptcBought ?? null,
      aptc_burned: input.aptcBurned ?? null,
      tx_signature: input.txSignature ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
