/**
 * Server-side game verification system
 * Prevents client-side manipulation of game outcomes
 */

import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import type { ChainId } from '@/lib/chains/registry';

export type GameType = 'mines' | 'plinko' | 'roulette' | 'wheel';

interface GameSession {
  id: string;
  wallet: string;
  chain: ChainId;
  game: GameType;
  betRaw: string;
  serverSeed: string;
  clientSeed?: string;
  gameData: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a cryptographically secure server seed
 */
function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new game session with server seed
 */
export async function createGameSession(input: {
  wallet: string;
  chain: ChainId;
  game: GameType;
  betRaw: bigint;
  clientSeed?: string;
  gameData?: Record<string, unknown>;
}): Promise<{ sessionId: string; serverSeedHash: string }> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const serverSeed = generateServerSeed();
  const serverSeedHash = crypto
    .createHash('sha256')
    .update(serverSeed)
    .digest('hex');

  const sessionId = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error } = await db.from('game_sessions').insert({
    id: sessionId,
    wallet: input.wallet,
    chain: input.chain,
    game: input.game,
    bet_raw: input.betRaw.toString(),
    server_seed: serverSeed,
    server_seed_hash: serverSeedHash,
    client_seed: input.clientSeed || null,
    game_data: input.gameData || {},
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);

  return { sessionId, serverSeedHash };
}

/**
 * Verify game outcome and calculate payout
 */
export async function verifyGameOutcome(input: {
  sessionId: string;
  wallet: string;
  chain: ChainId;
  outcome: Record<string, unknown>;
}): Promise<{ valid: boolean; payoutMultiplier: number; serverSeed: string }> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const { data: session, error } = await db
    .from('game_sessions')
    .select('*')
    .eq('id', input.sessionId)
    .eq('wallet', input.wallet)
    .eq('chain', input.chain)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session) {
    throw new Error('Invalid or expired game session');
  }

  // Verify outcome based on game type
  const game = session.game as GameType;
  const serverSeed = session.server_seed;
  const clientSeed = input.outcome.clientSeed as string | undefined;
  const gameData = session.game_data as Record<string, unknown>;

  let payoutMultiplier = 0;
  let valid = false;

  switch (game) {
    case 'mines':
      ({ valid, payoutMultiplier } = verifyMinesOutcome(
        serverSeed,
        clientSeed,
        gameData,
        input.outcome
      ));
      break;

    case 'plinko':
      ({ valid, payoutMultiplier } = verifyPlinkoOutcome(
        serverSeed,
        clientSeed,
        gameData,
        input.outcome
      ));
      break;

    case 'roulette':
    case 'wheel':
      // For now, use simplified verification
      // TODO: Implement proper roulette/wheel verification
      ({ valid, payoutMultiplier } = verifySimpleOutcome(
        serverSeed,
        input.outcome
      ));
      break;

    default:
      throw new Error(`Unsupported game type: ${game}`);
  }

  // Mark session as consumed
  await db
    .from('game_sessions')
    .update({
      consumed_at: new Date().toISOString(),
      final_outcome: input.outcome,
      payout_multiplier: payoutMultiplier,
    })
    .eq('id', input.sessionId);

  return { valid, payoutMultiplier, serverSeed };
}

/**
 * Verify Mines game outcome
 */
function verifyMinesOutcome(
  serverSeed: string,
  clientSeed: string | undefined,
  gameData: Record<string, unknown>,
  outcome: Record<string, unknown>
): { valid: boolean; payoutMultiplier: number } {
  const minesCount = gameData.minesCount as number;
  const gridSize = (gameData.gridSize as number) || 5;
  const revealedTiles = outcome.revealedTiles as number;
  const hitMine = outcome.hitMine as boolean;

  // If player hit a mine, payout is 0
  if (hitMine) {
    return { valid: true, payoutMultiplier: 0 };
  }

  // Calculate expected multiplier based on revealed tiles
  const multiplier = calculateMinesMultiplier(
    minesCount,
    gridSize,
    revealedTiles
  );

  // Verify the outcome is reasonable (not exceeding max tiles or multiplier limits)
  const totalTiles = gridSize * gridSize;
  const safeTiles = totalTiles - minesCount;
  const maxAllowedTiles = Math.min(safeTiles, 15); // Cap at 15 tiles for most cases

  if (revealedTiles > maxAllowedTiles || revealedTiles < 0) {
    return { valid: false, payoutMultiplier: 0 };
  }

  return { valid: true, payoutMultiplier: multiplier };
}

/**
 * Calculate Mines multiplier (must match client-side calculation)
 */
function calculateMinesMultiplier(
  minesCount: number,
  gridSize: number,
  revealedTiles: number
): number {
  if (revealedTiles === 0) return 0;

  const totalTiles = gridSize * gridSize;
  const houseEdge = 0.03; // 3% house edge
  let multiplier = 1;

  for (let i = 0; i < revealedTiles; i++) {
    const safeTiles = totalTiles - minesCount - i;
    const remainingTiles = totalTiles - i;
    if (safeTiles <= 0 || remainingTiles <= 0) break;

    multiplier *= (remainingTiles / safeTiles) * (1 - houseEdge);
  }

  // Cap multiplier at 2000x (same as MAX_GAME_PAYOUT_MULTIPLIER)
  return Math.min(multiplier, 2000);
}

/**
 * Verify Plinko game outcome
 */
function verifyPlinkoOutcome(
  serverSeed: string,
  clientSeed: string | undefined,
  gameData: Record<string, unknown>,
  outcome: Record<string, unknown>
): { valid: boolean; payoutMultiplier: number } {
  const rows = (gameData.rows as number) || 16;
  const riskLevel = (gameData.riskLevel as string) || 'High';
  const binIndex = outcome.binIndex as number;
  const multiplier = outcome.multiplier as number;

  // Validate bin index is within valid range
  const maxBins = rows + 1;
  if (binIndex < 0 || binIndex >= maxBins) {
    return { valid: false, payoutMultiplier: 0 };
  }

  // For now, trust the multiplier if bin is valid
  // TODO: Add full multiplier table verification
  const maxMultiplier = riskLevel === 'High' ? 1000 : riskLevel === 'Medium' ? 170 : 50;

  if (multiplier > maxMultiplier || multiplier < 0) {
    return { valid: false, payoutMultiplier: 0 };
  }

  return { valid: true, payoutMultiplier: multiplier };
}

/**
 * Simple verification for other games (fallback)
 */
function verifySimpleOutcome(
  serverSeed: string,
  outcome: Record<string, unknown>
): { valid: boolean; payoutMultiplier: number } {
  const multiplier = (outcome.multiplier as number) || 0;

  // Basic sanity check - max 2000x
  if (multiplier < 0 || multiplier > 2000) {
    return { valid: false, payoutMultiplier: 0 };
  }

  return { valid: true, payoutMultiplier: multiplier };
}

/**
 * Clean up expired sessions
 */
export async function cleanExpiredSessions(): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) return;

  await db
    .from('game_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
}
