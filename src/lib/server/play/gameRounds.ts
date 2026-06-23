import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import type { ChainId } from '@/lib/chains/registry';

const SESSION_TTL_MS = 15 * 60 * 1000;

export type GameType = 'mines' | 'plinko' | 'roulette' | 'wheel';

function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

export async function beginGameRound(input: {
  wallet: string;
  chain: ChainId;
  game: string;
  betRaw: bigint;
  gameData?: Record<string, unknown>;
}): Promise<{ roundId: string; serverSeedHash: string }> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const roundId = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error } = await db.from('game_sessions').insert({
    id: roundId,
    wallet: input.wallet,
    chain: input.chain,
    game: input.game,
    bet_raw: input.betRaw.toString(),
    server_seed: serverSeed,
    server_seed_hash: serverSeedHash,
    game_data: input.gameData ?? {},
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);

  return { roundId, serverSeedHash };
}

export type LoadedGameRound = {
  id: string;
  serverSeed: string;
  betRaw: bigint;
  game: string;
  gameData: Record<string, unknown>;
};

export async function loadOpenGameRound(input: {
  roundId: string;
  wallet: string;
  chain: ChainId;
}): Promise<LoadedGameRound> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const now = new Date().toISOString();
  const { data, error } = await db
    .from('game_sessions')
    .select('id, server_seed, bet_raw, game, game_data')
    .eq('id', input.roundId)
    .eq('wallet', input.wallet)
    .eq('chain', input.chain)
    .is('consumed_at', null)
    .gt('expires_at', now)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Invalid or expired game round');

  return {
    id: String(data.id),
    serverSeed: String(data.server_seed),
    betRaw: BigInt(String(data.bet_raw ?? '0')),
    game: String(data.game),
    gameData: (data.game_data as Record<string, unknown>) ?? {},
  };
}

export async function consumeGameRound(roundId: string): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const { error } = await db
    .from('game_sessions')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', roundId)
    .is('consumed_at', null);

  if (error) throw new Error(error.message);
}

export function serverSeedToBytes(serverSeed: string): Uint8Array {
  const hex = serverSeed.trim();
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  }
  return new TextEncoder().encode(serverSeed);
}

export function fairnessRevealSeedToBytes(revealSeed: string): Uint8Array {
  const hex = revealSeed.trim();
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  }
  return new Uint8Array(0);
}
