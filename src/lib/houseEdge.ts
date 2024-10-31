/**
 * Platform-wide house edge configuration.
 *
 * The platform applies a configurable house edge to every payout. The edge is
 * expressed in basis points (bps), where 100 bps = 1.00%. Each game can override
 * its default at deploy time via NEXT_PUBLIC_HOUSE_EDGE_BPS_<GAME>.
 *
 * Conceptual model (Method A — multiply the *total* payout):
 *
 *   adjustedPayout = bet × multiplier × (1 - edgeBps / 10000)
 *
 * Examples:
 *   bet=1 APT, multiplier=2.0x, edge=3% (300 bps) → payout = 1.94 APT
 *   bet=1 APT, multiplier=10x,  edge=1% (100 bps) → payout = 9.90 APT
 *
 * For per-bet checks, prefer `applyHouseEdgeToMultiplier(rawMultiplier, game)`
 * over hand-rolling the math at the call site.
 *
 * Roulette: the default is 0 bps because the European single-zero layout used by
 * the game already carries the standard ~2.70% natural edge from the zero pocket.
 * If you want an additional commission on top of that, set the env var > 0.
 */

export type HouseGame = 'plinko' | 'mines' | 'roulette' | 'wheel';

const DEFAULTS: Record<HouseGame, number> = {
  plinko: 300,   // 3.0%  (on top of weighted bin curve — see pickWeightedPlinkoBin)
  mines: 300,    // 3.0%  (Mines: classic Stake-style edge)
  roulette: 0,   // 0%    (European wheel: 0 already gives ~2.70% natural edge)
  wheel: 400,    // 4.0%  (Wheel of Fortune: 4% edge across risk tiers)
};

function parseBps(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  // Hard cap so a misconfiguration can never zero out player payouts.
  return Math.min(9000, Math.floor(n));
}

export const HOUSE_EDGE_BPS: Record<HouseGame, number> = {
  plinko: parseBps(process.env.NEXT_PUBLIC_HOUSE_EDGE_BPS_PLINKO, DEFAULTS.plinko),
  mines: parseBps(process.env.NEXT_PUBLIC_HOUSE_EDGE_BPS_MINES, DEFAULTS.mines),
  roulette: parseBps(process.env.NEXT_PUBLIC_HOUSE_EDGE_BPS_ROULETTE, DEFAULTS.roulette),
  wheel: parseBps(process.env.NEXT_PUBLIC_HOUSE_EDGE_BPS_WHEEL, DEFAULTS.wheel),
};

/**
 * Multiply a "fair" multiplier by (1 - houseEdge). Returns the multiplier the
 * player actually receives. Always >= 0.
 */
export function applyHouseEdgeToMultiplier(multiplier: number, game: HouseGame): number {
  if (!Number.isFinite(multiplier) || multiplier <= 0) return 0;
  const bps = HOUSE_EDGE_BPS[game] ?? 0;
  if (bps <= 0) return multiplier;
  const factor = (10000 - bps) / 10000;
  return multiplier * factor;
}

/**
 * Apply the edge to a total payout amount.
 */
export function applyHouseEdgeToPayout(payout: number, game: HouseGame): number {
  if (!Number.isFinite(payout) || payout <= 0) return 0;
  return applyHouseEdgeToMultiplier(payout, game);
}

/** Display-friendly percentage (e.g. 3.0 for 3% edge). */
export function houseEdgePercent(game: HouseGame): number {
  return (HOUSE_EDGE_BPS[game] ?? 0) / 100;
}

/** RTP as a percentage (e.g. 97.0 for a 3% edge). */
export function rtpPercent(game: HouseGame): number {
  return 100 - houseEdgePercent(game);
}
