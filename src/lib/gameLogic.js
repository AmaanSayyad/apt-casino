import { wheelDataByRisk } from "../components/wheel/GameWheel"; // Make sure this is exported
import { deriveWheelOutcome } from "./provablyFair/solanaFairness";

function pickSegmentIndex(wheelData, seedBytes = null) {
  if (seedBytes) {
    const probs = wheelData.map((d) => d.probability);
    return deriveWheelOutcome(seedBytes, probs);
  }
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < wheelData.length; i++) {
    cumulative += wheelData[i].probability;
    if (rand <= cumulative) return i;
  }
  return wheelData.length - 1;
}

export const calculateResult = (risk, noOfSegments, seedBytes = null) => {
  const wheelData = risk === "high" ? wheelDataByRisk.high(noOfSegments) : wheelDataByRisk[risk];

  const selectedIndex = pickSegmentIndex(wheelData, seedBytes);
  const multiplier = wheelData[selectedIndex].multiplier;

  const matchingSegments = [];
  for (let i = 0; i < noOfSegments; i++) {
    if (wheelData[i % wheelData.length].multiplier === multiplier) {
      matchingSegments.push(i);
    }
  }

  const chosenSegment =
    seedBytes != null
      ? selectedIndex % noOfSegments
      : matchingSegments[Math.floor(Math.random() * matchingSegments.length)];

  const totalSpins = 5;
  const segmentAngle = (Math.PI * 2) / noOfSegments;
  const position = chosenSegment * segmentAngle + Math.PI * 2 * totalSpins;

  return {
    multiplier,
    position,
    segmentIndex: chosenSegment,
  };
};
/**
 * Validate bet amount
 */
export const validateBet = (amount, balance) => {
  return amount > 0 && amount <= balance;
};

/**
 * Format currency for display
 */
export const formatCurrency = (value) => {
  return value.toFixed(10);
};