/**
 * Meteora DBC on-chain state for Bags bonding-curve graduation progress.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { getSolanaRpcEndpoint } from '@/lib/solana/config';

const LAMPORTS_PER_SOL = 1_000_000_000;

export type MeteoraCurveState = {
  dbcPoolKey: string;
  dbcConfigKey: string | null;
  quoteReserveSol: number | null;
  curveProgressPct: number | null;
  graduationThresholdSol: number | null;
  isMigrated: boolean;
};

let clientPromise: Promise<DynamicBondingCurveClient> | null = null;

function getDbcClient(): Promise<DynamicBondingCurveClient> {
  if (!clientPromise) {
    clientPromise = Promise.resolve().then(() => {
      const connection = new Connection(getSolanaRpcEndpoint(), 'confirmed');
      return DynamicBondingCurveClient.create(connection, 'confirmed');
    });
  }
  return clientPromise;
}

export async function fetchMeteoraCurveByMint(mint: string): Promise<MeteoraCurveState | null> {
  if (!mint) return null;

  try {
    const client = await getDbcClient();
    const poolAccount = await client.state.getPoolByBaseMint(mint);
    if (!poolAccount) return null;

    const dbcPoolKey = poolAccount.publicKey.toBase58();
    const [progress, threshold, pool] = await Promise.all([
      client.state.getPoolQuoteTokenCurveProgress(dbcPoolKey).catch(() => null),
      client.state.getPoolMigrationQuoteThreshold(dbcPoolKey).catch(() => null),
      client.state.getPool(dbcPoolKey).catch(() => null),
    ]);

    const quoteReserveLamports = pool?.quoteReserve != null ? Number(pool.quoteReserve) : null;
    const quoteReserveSol =
      quoteReserveLamports != null && Number.isFinite(quoteReserveLamports)
        ? quoteReserveLamports / LAMPORTS_PER_SOL
        : null;

    const graduationThresholdSol =
      threshold != null && Number.isFinite(Number(threshold))
        ? Number(threshold) / LAMPORTS_PER_SOL
        : null;

    let dbcConfigKey: string | null = null;
    try {
      const configKey = (poolAccount.account as { config?: PublicKey })?.config;
      dbcConfigKey = configKey?.toBase58?.() ?? null;
    } catch {
      dbcConfigKey = null;
    }

    return {
      dbcPoolKey,
      dbcConfigKey,
      quoteReserveSol,
      curveProgressPct: progress != null && Number.isFinite(progress) ? progress : null,
      graduationThresholdSol,
      isMigrated: Boolean(pool?.isMigrated),
    };
  } catch {
    return null;
  }
}

export async function fetchMeteoraCurveByPoolKey(dbcPoolKey: string): Promise<MeteoraCurveState | null> {
  if (!dbcPoolKey) return null;

  try {
    const client = await getDbcClient();
    const [progress, threshold, pool] = await Promise.all([
      client.state.getPoolQuoteTokenCurveProgress(dbcPoolKey).catch(() => null),
      client.state.getPoolMigrationQuoteThreshold(dbcPoolKey).catch(() => null),
      client.state.getPool(dbcPoolKey).catch(() => null),
    ]);

    const quoteReserveLamports = pool?.quoteReserve != null ? Number(pool.quoteReserve) : null;

    return {
      dbcPoolKey,
      dbcConfigKey: null,
      quoteReserveSol:
        quoteReserveLamports != null && Number.isFinite(quoteReserveLamports)
          ? quoteReserveLamports / LAMPORTS_PER_SOL
          : null,
      curveProgressPct: progress != null && Number.isFinite(progress) ? progress : null,
      graduationThresholdSol:
        threshold != null && Number.isFinite(Number(threshold))
          ? Number(threshold) / LAMPORTS_PER_SOL
          : null,
      isMigrated: Boolean(pool?.isMigrated),
    };
  } catch {
    return null;
  }
}
