import { applyHouseEdgeToMultiplier } from '@/lib/houseEdge';

export const MINES_GRID_DEFAULT = 5;

/** Mine counts shown as tabs on the Mines payout card (must match valid game range). */
export const MINES_PAYOUT_TAB_MINES = [1, 3, 5, 10] as const;

export type MinesMultiplierRow = { tiles: number; multiplier: number };

/**
 * Same multiplier ladder as `game.jsx` (post–house-edge, 5×5 grid).
 * `tiles` = number of safe gems revealed; multiplier = payout multiple on stake after edge.
 */
export function buildMinesMultiplierRows(mines: number, gridSize = MINES_GRID_DEFAULT): MinesMultiplierRow[] {
  const totalTiles = gridSize * gridSize;
  const safeTiles = totalTiles - mines;
  const table: MinesMultiplierRow[] = [];
  const adjust = (m: number) => parseFloat(applyHouseEdgeToMultiplier(m, 'mines').toFixed(2));

  if (safeTiles <= 1) {
    if (safeTiles === 1) {
      const denominator = totalTiles - mines - 1;
      if (denominator > 0) {
        table.push({ tiles: 1, multiplier: adjust(totalTiles / denominator) });
      } else {
        table.push({ tiles: 1, multiplier: adjust(25.0) });
      }
    } else {
      table.push({ tiles: 1, multiplier: 1.0 });
    }
    return table;
  }

  const maxTiles = mines >= 20 ? safeTiles : Math.min(15, safeTiles);

  for (let i = 1; i <= maxTiles; i++) {
    const denominator = totalTiles - mines - i;
    if (denominator <= 0) break;
    table.push({ tiles: i, multiplier: adjust(totalTiles / denominator) });
  }

  return table;
}

/** Pretty multiplier for UI: "1.04x", "1,000x" */
export function formatMinesMultiplierLabel(multiplier: number): string {
  if (!Number.isFinite(multiplier) || multiplier <= 0) return '0x';
  if (multiplier >= 1000) return `${multiplier.toLocaleString('en-US', { maximumFractionDigits: 0 })}x`;
  const s = multiplier.toFixed(2).replace(/\.?0+$/, '');
  return `${s}x`;
}
