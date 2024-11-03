/** Games that log payout as gross return (bet × multiplier), including sub-1× losses. */
export const GROSS_RETURN_GAMES = new Set(['plinko', 'mines', 'wheel']);

/**
 * Normalize logged payout to gross return (stake + profit) for house P&L.
 * Older roulette clients logged profit-only on wins.
 */
export function grossPayoutNative(
  bet: number,
  payout: number,
  gameSlug: string | null | undefined,
): number {
  const game = String(gameSlug || '').toLowerCase();
  if (GROSS_RETURN_GAMES.has(game)) return payout;
  if (payout > 0 && payout < bet) return payout + bet;
  return payout;
}

export function grossPayoutRaw(
  betRaw: bigint,
  payoutRaw: bigint,
  gameSlug: string | null | undefined,
): bigint {
  const game = String(gameSlug || '').toLowerCase();
  if (GROSS_RETURN_GAMES.has(game)) return payoutRaw;
  if (payoutRaw > 0n && payoutRaw < betRaw) return payoutRaw + betRaw;
  return payoutRaw;
}
