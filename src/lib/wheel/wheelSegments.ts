import { applyHouseEdgeToMultiplier } from '@/lib/houseEdge';
import { deriveWheelOutcome } from '@/lib/provablyFair/solanaFairness';

export type WheelSegment = { multiplier: number; probability: number; color: string };

export function getHighRiskMultiplier(noOfSegments: number): number {
  if (noOfSegments <= 10) return 9.9;
  if (noOfSegments <= 20) return 19.8;
  if (noOfSegments <= 30) return 29.7;
  if (noOfSegments <= 40) return 39.6;
  return 49.5;
}

export function getHighRiskProbability(noOfSegments: number): number {
  if (noOfSegments <= 10) return 0.2;
  if (noOfSegments <= 20) return 0.15;
  if (noOfSegments <= 30) return 0.1;
  if (noOfSegments <= 40) return 0.07;
  return 0.05;
}

export const wheelDataByRisk = {
  low: [
    { multiplier: 0.0, color: '#333947', probability: 0.7 },
    { multiplier: 1.2, color: '#D9D9D9', probability: 0.2 },
    { multiplier: 1.5, color: '#00E403', probability: 0.1 },
  ],
  medium: [
    { multiplier: 0.0, color: '#333947', probability: 0.35 },
    { multiplier: 1.5, color: '#00E403', probability: 0.2 },
    { multiplier: 1.7, color: '#D9D9D9', probability: 0.15 },
    { multiplier: 2.0, color: '#FDE905', probability: 0.15 },
    { multiplier: 3.0, color: '#7F46FD', probability: 0.1 },
    { multiplier: 4.0, color: '#FCA32F', probability: 0.05 },
  ],
  high: (noOfSegments: number): WheelSegment[] => {
    const highProb = getHighRiskProbability(noOfSegments);
    return [
      { multiplier: 0.0, color: '#333947', probability: 1 - highProb },
      {
        multiplier: getHighRiskMultiplier(noOfSegments),
        color: '#D72E60',
        probability: highProb,
      },
    ];
  },
};

export function buildExpandedWheelSegments(risk: string, noOfSegments: number): WheelSegment[] {
  const segments = Math.max(2, Math.min(50, Math.floor(noOfSegments) || 10));
  const riskKey = risk === 'high' || risk === 'low' ? risk : 'medium';

  if (riskKey === 'high') {
    const highData = wheelDataByRisk.high(segments);
    let total = 0;
    const counts = highData.map((seg, idx) => {
      if (idx === highData.length - 1) return segments - total;
      const count = Math.round(seg.probability * segments);
      total += count;
      return count;
    });
    const sum = counts.reduce((a, b) => a + b, 0);
    if (sum !== segments) counts[counts.length - 1] += segments - sum;

    const arr: WheelSegment[] = [];
    highData.forEach((seg, idx) => {
      for (let i = 0; i < counts[idx]; i++) arr.push({ ...seg });
    });
    const prob = 1 / segments;
    return arr.map((seg) => ({ ...seg, probability: prob }));
  }

  if (riskKey === 'medium') {
    const zeroSegment = wheelDataByRisk.medium.find((d) => d.multiplier === 0.0)!;
    const nonZeroSegments = wheelDataByRisk.medium.filter((d) => d.multiplier !== 0.0);
    const arr: WheelSegment[] = [];
    let nonZeroIdx = 0;
    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) arr.push({ ...zeroSegment });
      else {
        arr.push({ ...nonZeroSegments[nonZeroIdx % nonZeroSegments.length] });
        nonZeroIdx += 1;
      }
    }
    const prob = 1 / segments;
    return arr.map((seg) => ({ ...seg, probability: prob }));
  }

  const onePointTwoSegment = wheelDataByRisk.low.find((d) => d.multiplier === 1.2)!;
  const otherSegments = wheelDataByRisk.low.filter((d) => d.multiplier !== 1.2);
  const arr: WheelSegment[] = [];
  let otherIdx = 0;
  for (let i = 0; i < segments; i++) {
    if (i % 2 === 0) arr.push({ ...onePointTwoSegment });
    else {
      arr.push({ ...otherSegments[otherIdx % otherSegments.length] });
      otherIdx += 1;
    }
  }
  const prob = 1 / segments;
  return arr.map((seg) => ({ ...seg, probability: prob }));
}

export function wheelTemplateProbabilities(risk: string, noOfSegments: number): number[] {
  const riskKey = risk === 'high' || risk === 'low' ? risk : 'medium';
  if (riskKey === 'high') {
    return wheelDataByRisk.high(noOfSegments).map((d) => d.probability);
  }
  return wheelDataByRisk[riskKey].map((d) => d.probability);
}

export function wheelPanelMultipliers(risk: string, noOfSegments: number): number[] {
  const riskKey = risk === 'high' || risk === 'low' ? risk : 'medium';
  const original =
    riskKey === 'high' ? wheelDataByRisk.high(noOfSegments) : wheelDataByRisk[riskKey];
  return Array.from(new Set(original.map((d) => d.multiplier)));
}

export function wheelPanelColorMap(risk: string, noOfSegments: number): Record<number, string> {
  const riskKey = risk === 'high' || risk === 'low' ? risk : 'medium';
  const original =
    riskKey === 'high' ? wheelDataByRisk.high(noOfSegments) : wheelDataByRisk[riskKey];
  return Object.fromEntries(original.map((d) => [d.multiplier, d.color]));
}

export function getWheelSegmentAt(
  risk: string,
  noOfSegments: number,
  segmentIndex: number,
): WheelSegment {
  const wheel = buildExpandedWheelSegments(risk, noOfSegments);
  const idx = ((segmentIndex % wheel.length) + wheel.length) % wheel.length;
  return wheel[idx] ?? { multiplier: 0, probability: 0, color: '#333947' };
}

/** Segment index on the expanded wheel (matches GameWheel forcedSegmentIndex). */
export function resolveWheelSegmentIndex(
  seedBytes: Uint8Array,
  risk: string,
  noOfSegments: number,
): number {
  const segments = Math.max(2, Math.min(50, Math.floor(noOfSegments) || 10));
  const wheel = buildExpandedWheelSegments(risk, segments);
  const probs = wheel.map((s) => s.probability);
  return deriveWheelOutcome(seedBytes, probs);
}

export function computeWheelPayoutNative(
  betAmountNative: number,
  risk: string,
  noOfSegments: number,
  segmentIndex: number,
): { rawMultiplier: number; adjustedMultiplier: number; payoutNative: number; segment: WheelSegment } {
  const segment = getWheelSegmentAt(risk, noOfSegments, segmentIndex);
  const adjustedMultiplier = applyHouseEdgeToMultiplier(segment.multiplier, 'wheel');
  return {
    rawMultiplier: segment.multiplier,
    adjustedMultiplier,
    payoutNative: betAmountNative * adjustedMultiplier,
    segment,
  };
}

/** Which segment index sits under the top pointer for a given wheel rotation. */
export function segmentIndexUnderPointer(
  wheelPosition: number,
  segmentCount: number,
): number {
  const segments = Math.max(1, segmentCount);
  const segmentAngle = (Math.PI * 2) / segments;
  const normalized = ((wheelPosition % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const wheelAngle = (normalized - Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(wheelAngle / segmentAngle) % segments;
}

/** Wheel rotation (radians) that places `segmentIndex` center under the top pointer. */
export function wheelRotationForSegmentIndex(
  segmentIndex: number,
  segmentCount: number,
): number {
  const segments = Math.max(1, segmentCount);
  const segmentAngle = (Math.PI * 2) / segments;
  const idx = ((segmentIndex % segments) + segments) % segments;
  const center = idx * segmentAngle + segmentAngle / 2;
  return center + Math.PI / 2;
}
