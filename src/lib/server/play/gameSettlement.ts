/**
 * Server-side payout verification — never trust client-supplied payout amounts.
 */

import type { ChainId } from '@/lib/chains/registry';
import { calculateRouletteRoundResult } from '@/lib/client/roulettePayout';
import { buildMinesMultiplierRows } from '@/lib/minesPayTable';
import { resolvePlinkoBoard } from '@/lib/plinko/plinkoConfig';
import {
  pickWeightedPlinkoBin,
  parsePlinkoMultiplierLabel,
  PLINKO_MAX_LANDING_MULTIPLIER,
} from '@/lib/plinko/playableBins';
import {
  deriveRouletteOutcome,
  deriveMinePositions,
  verifySolanaFairnessProof,
  type SolanaFairnessProof,
} from '@/lib/provablyFair/solanaFairness';
import {
  consumeGameRound,
  fairnessRevealSeedToBytes,
  loadOpenGameRound,
  serverSeedToBytes,
} from '@/lib/server/play/gameRounds';
import {
  computeWheelPayoutNative,
  resolveWheelSegmentIndex,
} from '@/lib/wheel/wheelSegments';

export type GameRoundPayload = Record<string, unknown>;

export function isPayoutVerificationRequired(): boolean {
  const raw = process.env.GAME_PAYOUT_VERIFICATION_REQUIRED?.trim();
  if (raw === 'false' || raw === '0') return false;
  return true;
}

function asNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : null;
}

function assertBetTotalMatches(
  betAmountNative: number,
  expectedTotal: number,
  tolerance = 0.000001,
) {
  if (Math.abs(betAmountNative - expectedTotal) > tolerance) {
    throw new Error('Bet amount does not match submitted game parameters');
  }
}

async function resolveSeedBytes(input: {
  wallet: string;
  chain: ChainId;
  game: string;
  fairnessProof?: SolanaFairnessProof;
  roundId?: string;
}): Promise<Uint8Array> {
  if (input.fairnessProof) {
    const valid = await verifySolanaFairnessProof(input.fairnessProof).catch(() => false);
    if (!valid) throw new Error('Invalid fairness proof');
    if (input.fairnessProof.wallet !== input.wallet) {
      throw new Error('Fairness proof wallet mismatch');
    }
    if (input.fairnessProof.game !== input.game) {
      throw new Error('Fairness proof game mismatch');
    }
    const seed = fairnessRevealSeedToBytes(input.fairnessProof.revealSeed);
    if (seed.length !== 32) throw new Error('Invalid fairness reveal seed');
    return seed;
  }

  if (!input.roundId) {
    throw new Error('gameRound.fairnessProof or roundId required for verified settlement');
  }

  const round = await loadOpenGameRound({
    roundId: input.roundId,
    wallet: input.wallet,
    chain: input.chain,
  });
  if (round.game !== input.game) {
    throw new Error('Game round type mismatch');
  }
  return serverSeedToBytes(round.serverSeed);
}

function settleRoulette(input: {
  betAmountNative: number;
  gameRound: GameRoundPayload;
  seedBytes: Uint8Array;
}): number {
  const bets = input.gameRound.bets;
  if (!Array.isArray(bets) || bets.length === 0) {
    throw new Error('Roulette bets required in gameRound');
  }

  const normalizedBets = bets.map((bet) => {
    const amount = asNumber((bet as { amount?: unknown }).amount);
    const type = asNumber((bet as { type?: unknown }).type);
    if (amount == null || amount <= 0 || type == null) {
      throw new Error('Invalid roulette bet entry');
    }
    return {
      type,
      value: (bet as { value?: unknown }).value,
      amount,
    };
  });

  const betTotal = normalizedBets.reduce((sum, b) => sum + b.amount, 0);
  assertBetTotalMatches(input.betAmountNative, betTotal);

  const winningNumber = deriveRouletteOutcome(input.seedBytes);

  const { netResult } = calculateRouletteRoundResult(normalizedBets, winningNumber);
  return netResult > 0 ? netResult : 0;
}

function settleMines(input: {
  betAmountNative: number;
  gameRound: GameRoundPayload;
  seedBytes: Uint8Array;
}): number {
  const minesCount = asNumber(input.gameRound.minesCount);
  const gridSize = asNumber(input.gameRound.gridSize) ?? 5;
  const revealedTiles = asNumber(input.gameRound.revealedTiles) ?? 0;
  const hitMine = Boolean(input.gameRound.hitMine);
  const revealedIndices = input.gameRound.revealedIndices;

  if (minesCount == null || minesCount < 1) {
    throw new Error('minesCount required in gameRound');
  }

  const minePositions = deriveMinePositions(input.seedBytes, gridSize, minesCount);
  const mineSet = new Set(minePositions);

  if (Array.isArray(revealedIndices)) {
    const indices = revealedIndices.map((v) => asNumber(v)).filter((v): v is number => v != null);
    if (indices.length !== revealedTiles) {
      throw new Error('revealedIndices length mismatch');
    }
    for (const idx of indices) {
      if (mineSet.has(idx)) {
        throw new Error('Revealed tile hits a mine');
      }
    }
  }

  if (hitMine) return 0;
  if (revealedTiles <= 0) throw new Error('Invalid mines cashout — no tiles revealed');

  const rows = buildMinesMultiplierRows(minesCount, gridSize);
  const row = rows.find((r) => r.tiles === revealedTiles);
  if (!row) throw new Error('Invalid mines reveal count');

  return input.betAmountNative * row.multiplier;
}

function settlePlinko(input: {
  betAmountNative: number;
  gameRound: GameRoundPayload;
  seedBytes: Uint8Array;
}): number {
  const rows = asNumber(input.gameRound.rows);
  const riskLevel = String(input.gameRound.riskLevel ?? 'Medium');
  if (rows == null || rows < 8 || rows > 16) {
    throw new Error('Plinko rows required in gameRound');
  }

  const board = resolvePlinkoBoard(rows, riskLevel);
  const binIndex = pickWeightedPlinkoBin(
    input.seedBytes,
    board.multipliers,
    PLINKO_MAX_LANDING_MULTIPLIER,
  );

  const multiplier = parsePlinkoMultiplierLabel(board.multipliers[binIndex] ?? '0');
  return input.betAmountNative * multiplier;
}

function settleWheel(input: {
  betAmountNative: number;
  gameRound: GameRoundPayload;
  seedBytes: Uint8Array;
}): number {
  const risk = String(input.gameRound.risk ?? 'medium');
  const segments = asNumber(input.gameRound.segments) ?? 10;
  const segmentIndex = resolveWheelSegmentIndex(input.seedBytes, risk, segments);

  return computeWheelPayoutNative(
    input.betAmountNative,
    risk,
    segments,
    segmentIndex,
  ).payoutNative;
}

export async function computeVerifiedPayout(input: {
  wallet: string;
  chain: ChainId;
  game: string;
  betAmountNative: number;
  gameRound: GameRoundPayload;
  roundId?: string;
}): Promise<{ payoutAmountNative: number; outcome: Record<string, unknown> }> {
  if (!input.game || !input.gameRound) {
    throw new Error('game and gameRound required for verified settlement');
  }
  if (!Number.isFinite(input.betAmountNative) || input.betAmountNative <= 0) {
    throw new Error('Invalid bet amount');
  }

  const fairnessProof = input.gameRound.fairnessProof as SolanaFairnessProof | undefined;
  const seedBytes = await resolveSeedBytes({
    wallet: input.wallet,
    chain: input.chain,
    game: input.game,
    fairnessProof,
    roundId: input.roundId,
  });

  let payoutAmountNative = 0;
  const game = input.game.toLowerCase();

  switch (game) {
    case 'roulette':
      payoutAmountNative = settleRoulette({
        betAmountNative: input.betAmountNative,
        gameRound: input.gameRound,
        seedBytes,
      });
      break;
    case 'mines':
      payoutAmountNative = settleMines({
        betAmountNative: input.betAmountNative,
        gameRound: input.gameRound,
        seedBytes,
      });
      break;
    case 'plinko':
      payoutAmountNative = settlePlinko({
        betAmountNative: input.betAmountNative,
        gameRound: input.gameRound,
        seedBytes,
      });
      break;
    case 'wheel':
      payoutAmountNative = settleWheel({
        betAmountNative: input.betAmountNative,
        gameRound: input.gameRound,
        seedBytes,
      });
      break;
    default:
      throw new Error(`Unsupported game for verified settlement: ${input.game}`);
  }

  if (!Number.isFinite(payoutAmountNative) || payoutAmountNative < 0) {
    throw new Error('Computed payout is invalid');
  }

  const maxPayout = input.betAmountNative * maxPayoutMultiplier();
  if (payoutAmountNative > maxPayout + 0.000001) {
    throw new Error('Payout exceeds allowed multiplier for this bet');
  }

  if (input.roundId) {
    await consumeGameRound(input.roundId);
  }

  return {
    payoutAmountNative,
    outcome: { game, verified: true },
  };
}

function maxPayoutMultiplier(): number {
  const raw = process.env.MAX_GAME_PAYOUT_MULTIPLIER?.trim();
  const n = raw ? Number(raw) : 2000;
  if (!Number.isFinite(n) || n < 1) return 2000;
  return Math.floor(n);
}

/**
 * @deprecated Server ignores client payout; kept for optional logging only.
 */
export function assertClientPayoutIgnored(
  clientPayoutNative: number | undefined,
  verifiedPayoutNative: number,
): void {
  if (clientPayoutNative == null || !Number.isFinite(clientPayoutNative)) return;
  if (Math.abs(clientPayoutNative - verifiedPayoutNative) > 0.000001) {
    throw new Error('Client payout rejected — server computed a different amount');
  }
}
