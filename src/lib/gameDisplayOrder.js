/** Live games first on mobile — wheel & mines work best on small screens. */
export const MOBILE_LIVE_GAME_ORDER = ['wheel', 'mines', 'roulette', 'plinko'];

/**
 * @param {Array<Record<string, unknown>>} games
 * @param {string[]} order
 * @param {string} [idKey='id']
 */
export function sortGamesByDisplayOrder(games, order, idKey = 'id') {
  const rank = Object.fromEntries(order.map((id, i) => [id, i]));
  return [...games].sort(
    (a, b) => (rank[a[idKey]] ?? 999) - (rank[b[idKey]] ?? 999),
  );
}
