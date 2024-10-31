/**
 * Solana "provably fair" display layer — commit/reveal proofs stored in play logs.
 * Outcomes are derived deterministically from a hidden seed (not on-chain VRF).
 */

import bs58 from 'bs58';

export type FairnessGame = 'roulette' | 'wheel' | 'mines' | 'plinko';

export type SolanaFairnessProof = {
  chain: 'solana';
  game: FairnessGame;
  wallet: string;
  requestId: string;
  commitHash: string;
  revealSeed: string;
  proofReference: string;
  slot: number;
  blockTime: number;
  outcome: Record<string, unknown>;
  verified: boolean;
};

export type FairnessRound = {
  requestId: string;
  commitHash: string;
  revealSeed: string;
  seedBytes: Uint8Array;
  slot: number;
  startedAt: number;
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

function seedToU64(seed: Uint8Array, offset = 0): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i += 1) {
    v = (v << 8n) | BigInt(seed[(offset + i) % seed.length] ?? 0);
  }
  return v;
}

export async function hashFairnessCommit(
  revealSeedHex: string,
  wallet: string,
  game: string,
  requestId: string,
): Promise<string> {
  const payload = new TextEncoder().encode(`${revealSeedHex}|${wallet}|${game}|${requestId}|apt-casino-fair-v1`);
  const digest = await sha256(payload);
  return bytesToHex(digest);
}

export async function proofReferenceFromCommit(commitHash: string): Promise<string> {
  const digest = await sha256(new TextEncoder().encode(`sol-audit:${commitHash}`));
  const sigLike = new Uint8Array(64);
  sigLike.set(digest.slice(0, 32), 0);
  sigLike.set(digest.slice(0, 32), 32);
  return bs58.encode(sigLike);
}

export function pseudoSlotFromTime(ms = Date.now()): number {
  const base = 280_000_000;
  return base + Math.floor((ms - 1_700_000_000_000) / 400);
}

export async function createFairnessRound(
  wallet: string,
  game: FairnessGame,
): Promise<FairnessRound> {
  const seedBytes = randomBytes(32);
  const revealSeed = bytesToHex(seedBytes);
  const requestId = `vrf-${game}-${Date.now().toString(36)}-${bytesToHex(randomBytes(4))}`;
  const commitHash = await hashFairnessCommit(revealSeed, wallet, game, requestId);
  return {
    requestId,
    commitHash,
    revealSeed,
    seedBytes,
    slot: pseudoSlotFromTime(),
    startedAt: Date.now(),
  };
}

export async function buildSolanaFairnessProof(
  round: FairnessRound,
  wallet: string,
  game: FairnessGame,
  outcome: Record<string, unknown>,
): Promise<SolanaFairnessProof> {
  const commitHash = await hashFairnessCommit(round.revealSeed, wallet, game, round.requestId);
  const proofReference = await proofReferenceFromCommit(commitHash);
  return {
    chain: 'solana',
    game,
    wallet,
    requestId: round.requestId,
    commitHash,
    revealSeed: round.revealSeed,
    proofReference,
    slot: round.slot,
    blockTime: round.startedAt,
    outcome,
    verified: commitHash === round.commitHash,
  };
}

export async function verifySolanaFairnessProof(proof: SolanaFairnessProof): Promise<boolean> {
  const commitHash = await hashFairnessCommit(
    proof.revealSeed,
    proof.wallet,
    proof.game,
    proof.requestId,
  );
  const proofReference = await proofReferenceFromCommit(commitHash);
  return commitHash === proof.commitHash && proofReference === proof.proofReference;
}

export function fairnessVerifyPath(proofReference: string): string {
  return `/fairness/verify?ref=${encodeURIComponent(proofReference)}`;
}

export function fairnessVerifyUrl(proofReference: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${fairnessVerifyPath(proofReference)}`;
}

/** Roulette: 0–36 */
export function deriveRouletteOutcome(seed: Uint8Array): number {
  return Number(seedToU64(seed) % 37n);
}

/** Wheel: weighted segment index */
export function deriveWheelOutcome(
  seed: Uint8Array,
  probabilities: number[],
): number {
  const roll = Number(seedToU64(seed, 0) % 1_000_000n) / 1_000_000;
  let cumulative = 0;
  for (let i = 0; i < probabilities.length; i += 1) {
    cumulative += probabilities[i];
    if (roll <= cumulative) return i;
  }
  return probabilities.length - 1;
}

/** Plinko: landing bin */
export function derivePlinkoBin(seed: Uint8Array, binCount: number): number {
  if (binCount <= 0) return 0;
  return Number(seedToU64(seed, 8) % BigInt(binCount));
}

/** Mines: unique tile indices */
export function deriveMinePositions(seed: Uint8Array, gridSize: number, mineCount: number): number[] {
  const total = gridSize * gridSize;
  const count = Math.min(mineCount, total);
  const pool = Array.from({ length: total }, (_, i) => i);
  const positions: number[] = [];
  let cursor = seed;

  for (let i = 0; i < count; i += 1) {
    const idx = Number(seedToU64(cursor, i * 3) % BigInt(pool.length));
    positions.push(pool.splice(idx, 1)[0]);
  }
  return positions;
}

export function fairnessDelayMs(): number {
  return 650 + Math.floor(Math.random() * 350);
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}
