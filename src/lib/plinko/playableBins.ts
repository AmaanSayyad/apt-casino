/** Bins above this multiplier are shown in the UI but never receive a ball. */
export const PLINKO_MAX_LANDING_MULTIPLIER = 10;

/** Target share of drops that land on a losing slot (multiplier &lt; 1×). */
export const PLINKO_TARGET_LOSS_RATE = (() => {
  const raw = process.env.NEXT_PUBLIC_PLINKO_TARGET_LOSS_RATE;
  const n = raw != null ? Number(raw) : 0.7;
  if (!Number.isFinite(n)) return 0.7;
  return Math.min(0.95, Math.max(0.5, n));
})();

export function parsePlinkoMultiplierLabel(label: string | number): number {
  const raw =
    typeof label === 'string' ? parseFloat(label.replace(/x/i, '')) : Number(label);
  return Number.isFinite(raw) ? raw : 0;
}

export function isLosingPlinkoMultiplier(label: string | number): boolean {
  return parsePlinkoMultiplierLabel(label) < 1;
}

export function getPlayableBinIndices(
  multiplierLabels: string[],
  maxMultiplier = PLINKO_MAX_LANDING_MULTIPLIER,
): number[] {
  const indices: number[] = [];
  multiplierLabels.forEach((label, i) => {
    if (parsePlinkoMultiplierLabel(label) <= maxMultiplier) indices.push(i);
  });
  return indices.length > 0 ? indices : [0];
}

function seedToUnit(seed: Uint8Array, offset = 0): number {
  let v = 0n;
  for (let i = 0; i < 8; i += 1) {
    v = (v << 8n) | BigInt(seed[(offset + i) % seed.length] ?? 0);
  }
  return Number(v % 1_000_000n) / 1_000_000;
}

/** Lower multipliers get higher weight — makes edge slots rare even in the win pool. */
function weightForMultiplier(multiplier: number): number {
  const m = Math.max(multiplier, 0.05);
  return 1 / (m * m);
}

function pickFromPool(
  pool: number[],
  multiplierLabels: string[],
  seed: Uint8Array,
  offset: number,
): number {
  if (pool.length === 0) return 0;
  if (pool.length === 1) return pool[0];

  const weights = pool.map((i) => weightForMultiplier(parsePlinkoMultiplierLabel(multiplierLabels[i])));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = seedToUnit(seed, offset) * total;

  for (let j = 0; j < pool.length; j += 1) {
    roll -= weights[j];
    if (roll <= 0) return pool[j];
  }
  return pool[pool.length - 1];
}

function partitionPlayableBins(
  allowed: number[],
  multiplierLabels: string[],
): { losing: number[]; winning: number[] } {
  let losing = allowed.filter((i) => isLosingPlinkoMultiplier(multiplierLabels[i]));
  const winning = allowed.filter((i) => !isLosingPlinkoMultiplier(multiplierLabels[i]));

  if (losing.length === 0) {
    const byMult = [...allowed].sort(
      (a, b) =>
        parsePlinkoMultiplierLabel(multiplierLabels[a]) -
        parsePlinkoMultiplierLabel(multiplierLabels[b]),
    );
    const split = Math.max(1, Math.ceil(allowed.length * PLINKO_TARGET_LOSS_RATE));
    losing = byMult.slice(0, split);
    return {
      losing,
      winning: allowed.filter((i) => !losing.includes(i)),
    };
  }

  return { losing, winning: winning.length > 0 ? winning : allowed };
}

/**
 * House-weighted bin: ~70% losing slots, rare high multipliers within each pool.
 * Physics / uniform fair rolls are not used for payout.
 */
export function pickWeightedPlinkoBin(
  seed: Uint8Array,
  multiplierLabels: string[],
  maxMultiplier = PLINKO_MAX_LANDING_MULTIPLIER,
  targetLossRate = PLINKO_TARGET_LOSS_RATE,
): number {
  const allowed = getPlayableBinIndices(multiplierLabels, maxMultiplier);
  const { losing, winning } = partitionPlayableBins(allowed, multiplierLabels);

  const wantLoss = seedToUnit(seed, 0) < targetLossRate;
  const pool = wantLoss ? losing : winning.length > 0 ? winning : allowed;

  return pickFromPool(pool, multiplierLabels, seed, 8);
}

/** Map a raw bin to nearest playable (display-only); payout should use pickWeightedPlinkoBin. */
export function remapBinToPlayable(
  rawIndex: number,
  multiplierLabels: string[],
  maxMultiplier = PLINKO_MAX_LANDING_MULTIPLIER,
): number {
  const allowed = getPlayableBinIndices(multiplierLabels, maxMultiplier);
  const clamped = Math.max(0, Math.min(multiplierLabels.length - 1, rawIndex));
  if (allowed.includes(clamped)) return clamped;

  let best = allowed[0];
  let bestDist = Math.abs(clamped - best);
  for (const idx of allowed) {
    const dist = Math.abs(clamped - idx);
    if (dist < bestDist) {
      bestDist = dist;
      best = idx;
    }
  }
  return best;
}

/** Provably-fair / committed outcome bin (weighted, playable only). */
export function derivePlinkoBinPlayable(
  seed: Uint8Array,
  multiplierLabels: string[],
  maxMultiplier = PLINKO_MAX_LANDING_MULTIPLIER,
): number {
  return pickWeightedPlinkoBin(seed, multiplierLabels, maxMultiplier);
}

export function randomPlinkoOutcomeSeed(): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(16));
  }
  const buf = new Uint8Array(16);
  for (let i = 0; i < buf.length; i += 1) {
    buf[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

export function resolvePlinkoOutcomeBin(
  seed: Uint8Array,
  multiplierLabels: string[],
  maxMultiplier = PLINKO_MAX_LANDING_MULTIPLIER,
): number {
  return pickWeightedPlinkoBin(seed, multiplierLabels, maxMultiplier);
}

export function binCenterX(
  binIndex: number,
  pinsLastRowXCoords: number[],
): number {
  return (pinsLastRowXCoords[binIndex] + pinsLastRowXCoords[binIndex + 1]) / 2;
}
