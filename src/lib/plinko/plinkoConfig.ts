import { applyHouseEdgeToMultiplier } from '@/lib/houseEdge';

export const PLINKO_CANVAS_WIDTH = 800;
export const PLINKO_CANVAS_HEIGHT = 600;
export const PLINKO_PADDING_X = 52;
export const PLINKO_PADDING_TOP = 36;
export const PLINKO_PADDING_BOTTOM = 28;

function adjustPlinkoMultiplierLabel(label) {
  const raw = typeof label === 'string' ? parseFloat(label.replace(/x/i, '')) : Number(label);
  if (!Number.isFinite(raw) || raw <= 0) return label;
  const adjusted = applyHouseEdgeToMultiplier(raw, 'plinko');
  const fixed = adjusted.toFixed(2).replace(/\.?0+$/, '');
  return `${fixed}x`;
}

export function adjustPlinkoMultipliersArray(arr) {
  return Array.isArray(arr) ? arr.map(adjustPlinkoMultiplierLabel) : arr;
}

function normalizeRiskLevel(riskLevel) {
  const key = String(riskLevel || 'Medium').trim();
  const normalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  return normalized === 'Low' || normalized === 'High' ? normalized : 'Medium';
}

export function getRowConfig(rows, riskLevel) {
    const configs = {
      Low: {
        8: {
          binCount: 9,
          multipliers: ["5.6x", "2.1x", "1.1x", "1x", "0.5x", "1x", "1.1x", "2.1x", "5.6x"]
        },
        9: {
          binCount: 10,
          multipliers: ["5.6x", "2x", "1.6x", "1x", "0.7x", "0.7x", "1x", "1.6x", "2x", "5.6x"]
        },
        10: {
          binCount: 11,
          multipliers: ["8.9x", "3x", "1.4x", "1.1x", "1x", "0.5x", "1x", "1.1x", "1.4x", "3x", "8.9x"]
        },
        11: {
          binCount: 12,
          multipliers: ["8.4x", "3x", "1.9x", "1.3x", "1x", "0.7x", "0.7x", "1x", "1.3x", "1.9x", "3x", "8.4x"]
        },
        12: {
          binCount: 13,
          multipliers: ["10x", "3x", "1.6x", "1.4x", "1.1x", "1x", "0.5x", "1x", "1.1x", "1.4x", "1.6x", "3x", "10x"]
        },
        13: {
          binCount: 14,
          multipliers: ["8.1x", "4x", "3x", "1.9x", "1.2x", "0.9x", "0.7x", "0.7x", "0.9x", "1.2x", "1.9x", "3x", "4x", "8.1x"]
        },
        14: {
          binCount: 15,
          multipliers: ["7.1x", "4x", "1.9x", "1.4x", "1.3x", "1.1x", "1x", "0.5x", "1x", "1.1x", "1.3x", "1.4x", "1.9x", "4x", "7.1x"]
        },
        15: {
          binCount: 16,
          multipliers: ["15x", "8x", "3x", "2x", "1.5x", "1.1x", "1x", "0.7x", "0.7x", "1x", "1.1x", "1.5x", "2x", "3x", "8x", "15x"]
        },
        16: {
          binCount: 17,
          multipliers: ["16x", "9x", "2x", "1.4x", "1.4x", "1.2x", "1.1x", "1x", "0.5x", "1x", "1.1x", "1.2x", "1.4x", "1.4x", "2x", "9x", "16x"]
        }
      },
      Medium: {
        8: {
          binCount: 9,
          multipliers: ["13x", "3x", "1.3x", "0.7x", "0.4x", "0.7x", "1.3x", "3x", "13x"]
        },
        9: {
          binCount: 10,
          multipliers: ["18x", "4x", "1.7x", "0.9x", "0.5x", "0.5x", "0.9x", "1.7x", "4x", "18x"]
        },
        10: {
          binCount: 11,
          multipliers: ["22x", "5x", "2x", "1.4x", "0.6x", "0.4x", "0.6x", "1.4x", "2x", "5x", "22x"]
        },
        11: {
          binCount: 12,
          multipliers: ["24x", "6x", "3x", "1.8x", "0.7x", "0.5x", "0.5x", "0.7x", "1.8x", "3x", "6x", "24x"]
        },
        12: {
          binCount: 13,
          multipliers: ["33x", "11x", "4x", "2x", "1.1x", "0.6x", "0.3x", "0.6x", "1.1x", "2x", "4x", "11x", "33x"]
        },
        13: {
          binCount: 14,
          multipliers: ["43x", "13x", "6x", "1.3x", "0.7x", "0.4x", "0.4x", "0.4x", "0.7x", "1.3x", "3x", "6x", "13x", "43x"]
        },
        14: {
          binCount: 15,
          multipliers: ["58x", "15x", "7x", "4x", "1.9x", "1x", "0.5x", "0.2x", "0.5x", "1x", "1.9x", "4x", "7x", "15x", "58x"]
        },
        15: {
          binCount: 16,
          multipliers: ["88x", "18x", "11x", "5x", "3x", "1.3x", "0.5x", "0.3x", "0.3x", "0.5x", "1.3x", "3x", "5x", "11x", "18x", "88x"]
        },
        16: {
          binCount: 17,
          multipliers: ["110x", "41x", "10x", "5x", "3x", "1.5x", "1x", "0.5x", "0.3x", "0.5x", "1x", "1.5x", "3x", "5x", "10x", "41x", "110x"]
        }
      },
      High: {
        8: {
          binCount: 9,
          multipliers: ["29x", "4x", "1.5x", "0.3x", "0.2x", "0.3x", "1.5x", "4x", "29x"]
        },
        9: {
          binCount: 10,
          multipliers: ["43x", "7x", "2x", "0.6x", "0.2x", "0.2x", "0.6x", "2x", "7x", "43x"]
        },
        10: {
          binCount: 11,
          multipliers: ["76x", "10x", "3x", "0.9x", "0.3x", "0.2x", "0.3x", "0.9x", "3x", "10x", "76x"]
        },
        11: {
          binCount: 12,
          multipliers: ["120x", "14x", "5.2x", "1.4x", "0.4x", "0.2x", "0.2x", "0.4x", "1.4x", "5.2x", "14x", "120x"]
        },
        12: {
          binCount: 13,
          multipliers: ["170x", "24x", "8.1x", "2x", "0.7x", "0.2x", "0.2x", "0.2x", "0.7x", "2x", "8.1x", "24x", "170x"]
        },
        13: {
          binCount: 14,
          multipliers: ["260x", "37x", "11x", "4x", "1x", "0.2x", "0.2x", "0.2x", "0.2x", "1x", "4x", "11x", "37x", "260x"]
        },
        14: {
          binCount: 15,
          multipliers: ["420x", "56x", "18x", "5x", "1.9x", "0.3x", "0.2x", "0.2x", "0.2x", "0.3x", "1.9x", "5x", "18x", "56x", "420x"]
        },
        15: {
          binCount: 16,
          multipliers: ["620x", "83x", "27x", "8x", "3x", "0.5x", "0.2x", "0.2x", "0.2x", "0.2x", "0.5x", "3x", "8x", "27x", "83x", "620x"]
        },
        16: {
          binCount: 17,
          multipliers: ["1000x", "130x", "26x", "9x", "4x", "2x", "0.2x", "0.2x", "0.2x", "0.2x", "0.2x", "2x", "4x", "9x", "26x", "130x", "1000x"]
        }
      }
    };

    // Get the risk level config, default to Medium if invalid
    const risk = normalizeRiskLevel(riskLevel);
    const riskConfig = configs[risk] || configs.Medium;
    // Get the row config, default to 16 rows if invalid
    return riskConfig[rows] || riskConfig[16];
}

export function getBallFrictions(rows) {
  return {
    friction: 0.5,
    frictionAir: 0.0364 + (16 - rows) * 0.002,
  };
}

export function getPinDistanceX(rows, binCount) {
  const availableWidth = PLINKO_CANVAS_WIDTH - PLINKO_PADDING_X * 2;
  return rows === 16
    ? (availableWidth / (binCount - 1)) * 1.05
    : availableWidth / (binCount - 1);
}

export function getPinRadius(rows) {
  return Math.max(2, (24 - rows) / 2);
}

export function generatePins(rows, riskLevel) {
  const { binCount } = getRowConfig(rows, riskLevel);
  const pins = [];
  const pinsLastRowXCoords = [];
  let pegId = 0;
  const pinDistanceX = getPinDistanceX(rows, binCount);

  for (let row = 0; row < rows; row++) {
    const rowY =
      PLINKO_PADDING_TOP +
      ((PLINKO_CANVAS_HEIGHT - PLINKO_PADDING_TOP - PLINKO_PADDING_BOTTOM) / (rows - 1)) * row;

    const pinsInRow = row === rows - 1 ? binCount + 1 : 3 + row;
    const rowPaddingX =
      PLINKO_PADDING_X +
      ((PLINKO_CANVAS_WIDTH - PLINKO_PADDING_X * 2 - pinDistanceX * (pinsInRow - 1)) / 2);

    for (let col = 0; col < pinsInRow; col++) {
      const colX = rowPaddingX + pinDistanceX * col;
      pins.push({ id: pegId++, row, col, x: colX, y: rowY });
      if (row === rows - 1) pinsLastRowXCoords.push(colX);
    }
  }

  return { pins, pinsLastRowXCoords, binCount };
}

export function resolvePlinkoBoard(rows, riskLevel) {
  const config = getRowConfig(rows, riskLevel);
  const multipliers = adjustPlinkoMultipliersArray(config.multipliers);
  const { pins, pinsLastRowXCoords, binCount } = generatePins(rows, riskLevel);
  return { multipliers, binCount, pins, pinsLastRowXCoords };
}
