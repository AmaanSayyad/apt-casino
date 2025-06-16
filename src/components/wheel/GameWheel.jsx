"use client";

import Image from "next/image";
import { useEffect, useRef, useMemo, useState } from "react";
import { cn } from "@/lib/utils.jsx";
import arrow from "../../../public/arrow.svg";
import ColorDetector from "./ColorDetector";


function selectSegmentIndexByProbability(wheelData) {
  const rand = Math.random();
  let cumulative = 0;

  for (let i = 0; i < wheelData.length; i++) {
    cumulative += wheelData[i].probability;
    if (rand <= cumulative) return i;
  }

  return wheelData.length - 1; // fallback
}


export const wheelDataByRisk = {
  low: [
    { multiplier: 0.0, color: "#333947", probability: 0.7 },
    { multiplier: 1.2, color: "#D9D9D9", probability: 0.2 },
    { multiplier: 1.5, color: "#00E403", probability: 0.1 },
  ],
  medium: [
    { multiplier: 0.0, color: "#333947", probability: 0.35 },
    { multiplier: 1.5, color: "#00E403", probability: 0.2 },
    { multiplier: 1.7, color: "#D9D9D9", probability: 0.15 },
    { multiplier: 2.0, color: "#FDE905", probability: 0.15 },
    { multiplier: 3.0, color: "#7F46FD", probability: 0.1 },
    { multiplier: 4.0, color: "#FCA32F", probability: 0.05 },
  ],
  high: (noOfSegments) => {
    const highProb = getHighRiskProbability(noOfSegments);
    return [
      { multiplier: 0.0, color: "#333947", probability: 1 - highProb },
      { multiplier: getHighRiskMultiplier(noOfSegments), color: "#D72E60", probability: highProb },
    ];
  },
};


export function getHighRiskMultiplier(noOfSegments) {
  if (noOfSegments <= 10) return 9.90;
  if (noOfSegments <= 20) return 19.80;
  if (noOfSegments <= 30) return 29.70;
  if (noOfSegments <= 40) return 39.60;
  return 49.50;
}

export function getHighRiskProbability(noOfSegments) {
  if (noOfSegments <= 10) return 0.2;
  if (noOfSegments <= 20) return 0.15;
  if (noOfSegments <= 30) return 0.1;
  if (noOfSegments <= 40) return 0.07;
  return 0.05;
}


const GameWheel = ({
  isSpinning,
  noOfSegments,
  handleSelectMultiplier,
  wheelPosition,
  setWheelPosition,
  risk = "medium",
  hasSpun = false,
  onColorDetected,
  forcedSegmentIndex = null,
}) => {
  const [detectedSegment, setDetectedSegment] = useState(null);
  const canvasRef = useRef(null);
  // Dynamically generate segments based on noOfSegments and risk
  const baseWheelData = useMemo(() => {

    if (risk === "high") {
      const highData = wheelDataByRisk.high(noOfSegments);
      // Distribute segments according to probability
      let arr = [];
      let total = 0;
      // Calculate segment counts for each entry
      const counts = highData.map((seg, idx) => {
        if (idx === highData.length - 1) {
          // Last segment: fill remaining
          return noOfSegments - total;
        }
        const count = Math.round(seg.probability * noOfSegments);
        total += count;
        return count;
      });
      // If rounding error, adjust last
      const sum = counts.reduce((a, b) => a + b, 0);
      if (sum !== noOfSegments) {
        counts[counts.length - 1] += noOfSegments - sum;
      }
      // Build array
      highData.forEach((seg, idx) => {
        for (let i = 0; i < counts[idx]; i++) {
          arr.push({ ...seg });
        }
      });
      // Recalculate probability evenly
      const prob = 1 / noOfSegments;
      arr = arr.map(seg => ({ ...seg, probability: prob }));
      return arr;
    }

    if (risk === "medium") {
      // Separate 0.0 and non-0.0 segments
      const zeroSegment = wheelDataByRisk.medium.find(d => d.multiplier === 0.0);
      const nonZeroSegments = wheelDataByRisk.medium.filter(d => d.multiplier !== 0.0);
      // We'll ignore original probabilities and distribute evenly
      let arr = [];
      let nonZeroIdx = 0;
      for (let i = 0; i < noOfSegments; i++) {
        if (i % 2 === 0) {
          arr.push({ ...zeroSegment });
        } else {
          arr.push({ ...nonZeroSegments[nonZeroIdx % nonZeroSegments.length] });
          nonZeroIdx++;
        }
      }
      // Recalculate probability evenly
      const prob = 1 / noOfSegments;
      arr = arr.map(seg => ({ ...seg, probability: prob }));
      return arr;
    }

    if (risk === "low") {
      // Separate 1.2 and non-1.2 segments
      const onePointTwoSegment = wheelDataByRisk.low.find(d => d.multiplier === 1.2);
      const otherSegments = wheelDataByRisk.low.filter(d => d.multiplier !== 1.2);
      let arr = [];
      let otherIdx = 0;
      for (let i = 0; i < noOfSegments; i++) {
        if (i % 2 === 0) {
          arr.push({ ...onePointTwoSegment });
        } else {
          arr.push({ ...otherSegments[otherIdx % otherSegments.length] });
          otherIdx++;
        }
      }
      // Recalculate probability evenly
      const prob = 1 / noOfSegments;
      arr = arr.map(seg => ({ ...seg, probability: prob }));
      return arr;
    }
    return wheelDataByRisk[risk];
  }, [risk, noOfSegments]);

  const wheelData = useMemo(() => {
    // For medium risk, baseWheelData is already expanded
    if (risk === "medium") return baseWheelData;
    if (risk === "high") {
      // Distribute segments according to probability
      let arr = [];
      let total = 0;
      // Calculate segment counts for each entry
      const counts = baseWheelData.map((seg, idx) => {
        if (idx === baseWheelData.length - 1) {
          // Last segment: fill remaining
          return noOfSegments - total;
        }
        const count = Math.round(seg.probability * noOfSegments);
        total += count;
        return count;
      });
      // If rounding error, adjust last
      const sum = counts.reduce((a, b) => a + b, 0);
      if (sum !== noOfSegments) {
        counts[counts.length - 1] += noOfSegments - sum;
      }
      // Build array
      baseWheelData.forEach((seg, idx) => {
        for (let i = 0; i < counts[idx]; i++) {
          arr.push({ ...seg });
        }
      });
      // Recalculate probability evenly
      const prob = 1 / noOfSegments;
      arr = arr.map(seg => ({ ...seg, probability: prob }));
      return arr;
    }
    let arr = [];
    for (let i = 0; i < noOfSegments; i++) {
      arr.push(baseWheelData[i % baseWheelData.length]);
    }
    return arr;
  }, [baseWheelData, noOfSegments, risk]);

  const segments = wheelData.length;

  // For the bottom panel, always use unique multipliers from the original wheelDataByRisk
  const panelMultipliers = useMemo(() => {
    let original = [];
    if (risk === "high") {
      original = wheelDataByRisk.high(noOfSegments);
    } else {
      original = wheelDataByRisk[risk] || [];
    }
    return Array.from(new Set(original.map(d => d.multiplier)));
  }, [risk, noOfSegments]);
  
  const panelColorMap = useMemo(() => {
    let original = [];
    if (risk === "high") {
      original = wheelDataByRisk.high(noOfSegments);
    } else {
      original = wheelDataByRisk[risk] || [];
    }
    return Object.fromEntries(original.map(d => [d.multiplier, d.color]));
  }, [risk, noOfSegments]);


  // Canvas drawing function
  const drawWheel = (position = wheelPosition) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight) - 40;
    canvas.width = size;
    canvas.height = size;
    
    // Draw wheel
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save the current context state
    ctx.save();
    
    // Move to center and rotate the entire wheel
    ctx.translate(centerX, centerY);
    ctx.rotate(-position); // Negative for clockwise rotation
    ctx.translate(-centerX, -centerY);
    
    // Draw segments - now each segment corresponds to wheelData[i]
    const segmentAngle = (Math.PI * 2) / segments;
    
    for (let i = 0; i < segments; i++) {
      const startAngle = i * segmentAngle;
      const endAngle = (i + 1) * segmentAngle;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
      ctx.arc(centerX, centerY, radius * 0.93, endAngle, startAngle, true);
      ctx.closePath();

      // Use the color from wheelData[i], not from a generic array
      ctx.fillStyle = wheelData[i].color;
      ctx.fill();
      
    }
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#0A0009";
    ctx.fill();
    ctx.strokeStyle = "#333947";
    ctx.stroke();

    // Restore the context to draw the pointer without rotation
    ctx.restore();
  };

  // Initial canvas draw
  useEffect(() => {
    drawWheel();
  }, [wheelData, segments]); // Only redraw when wheel data changes

  // Render wheel rotation animation
  useEffect(() => {
    if (!isSpinning || !canvasRef.current) return;
    
    // Prevent multiple animations from starting
    let animationStarted = false;

    const selectedIndex =
      forcedSegmentIndex != null && forcedSegmentIndex >= 0
        ? forcedSegmentIndex % segments
        : selectSegmentIndexByProbability(wheelData);
    const segmentAngle = (Math.PI * 2) / segments;
    const totalSpins = 5;
    
    // Calculate target rotation to land on the selected segment
    // The pointer is at the top (12 o'clock), so we need to account for that
    const targetSegmentCenter = selectedIndex * segmentAngle + segmentAngle / 2;
    
    // Capture the current wheel position at the start of animation to avoid dependency issues
    const currentPosition = wheelPosition;
    const startRotation = currentPosition % (Math.PI * 2);
    
    // We want the selected segment to be at the top (under the pointer)
    // So we rotate until that segment's center is at 0 radians (top)
    const finalRotation = (Math.PI * 2 * totalSpins) + (Math.PI * 2 - targetSegmentCenter);

    let startTime = null;
    let rafId;

    const duration = 3000;

    const animate = (timestamp) => {
      if (!animationStarted) return; // Safety check
      
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // cubic easing out

      const newPosition = startRotation + finalRotation * easeOut;
      
      // Only draw canvas during animation, don't update state
      drawWheel(newPosition);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        // Animation complete - NOW update state
        animationStarted = false; // Mark animation as finished
        setWheelPosition(newPosition); // Update state only at the end
        
        // When animation completes, set the multiplier to the selected segment
        const landedMultiplier = wheelData[selectedIndex].multiplier;
        handleSelectMultiplier(landedMultiplier);
        
        // Also call the bet callback if it exists
        if (window.wheelBetCallback) {
          window.wheelBetCallback(landedMultiplier);
        }
      }
    };

    // Start animation only once
    animationStarted = true;
    rafId = requestAnimationFrame(animate);

    return () => {
      animationStarted = false;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [handleSelectMultiplier, isSpinning, segments, wheelData, forcedSegmentIndex]);

  // Helper function to get the current segment under the pointer
  const getCurrentSegmentUnderPointer = () => {
    const normalizedPosition = wheelPosition % (Math.PI * 2);
    const segmentAngle = (Math.PI * 2) / segments;
    
    const offsetPosition = (normalizedPosition + Math.PI/2 + Math.PI) % (Math.PI * 2);
    const segmentIndex = Math.floor(offsetPosition / segmentAngle) % segments;
    
    return wheelData[segmentIndex];
  };

  const currentSegment = getCurrentSegmentUnderPointer();
  
  // Handle color detection callback
  const handleColorDetected = (segmentData) => {
    setDetectedSegment(segmentData);
    
    // If we're not spinning and have spun before, update the multiplier
    if (!isSpinning && hasSpun && segmentData) {
      handleSelectMultiplier(segmentData.multiplier);
    }
  };

  return (
    <div className="flex flex-col justify-between items-center h-full w-full">
      <div className="relative flex h-[435px] w-[600px] sm:h-[525px] sm:w-[500px] lg:h-[625px] lg:w-[600px] items-center justify-center p-4">

        <Image
          src={arrow}
          width={50}
          height={50}
          alt="Pointer Arrow"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
        />           
        <canvas 
          ref={canvasRef} 
          className={cn(
            "max-w-[85vw] max-h-[85vh] rounded-full pt-4 p-2 bg-[#0A0009] transition-transform",
            isSpinning && "animate-pulse"
          )}
        />
        
        {!isSpinning && hasSpun && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-white animate-bounce mb-2">
              {currentSegment.multiplier.toFixed(2)}x
            </div>
            {currentSegment.multiplier > 0 && (
              <div className="text-lg text-green-400 bg-black/50 px-3 py-1 rounded-lg">
                Winnings: {(currentSegment.multiplier).toFixed(2)} × bet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden ColorDetector for background processing */}
      <div className="hidden">
        <ColorDetector 
          wheelPosition={wheelPosition}
          wheelData={wheelData}
          segments={segments}
          onColorDetected={(segmentData) => {
            handleColorDetected(segmentData);
            // Also call parent callback if provided
            if (onColorDetected) {
              onColorDetected(segmentData);
            }
          }}
        />
      </div>
      
      {/* Current Segment Display */}
      <div className="w-full max-w-md mx-auto mb-4">
        <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333947]">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Current Position</div>
            <div className="flex items-center justify-center gap-4">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white"
                style={{ backgroundColor: currentSegment.color }}
              ></div>
              <div className="text-2xl font-bold text-white">
                {currentSegment.multiplier.toFixed(2)}x
              </div>
              <div className="text-sm text-gray-400">
                ({(currentSegment.probability * 100).toFixed(1)}% chance)
              </div>
            </div>
            
            {currentSegment.multiplier > 0 && hasSpun && !isSpinning && (
              <div className="mt-2 p-2 bg-green-900/20 border border-green-700/30 rounded-md">
                <div className="text-sm text-green-300">
                  Bet × {currentSegment.multiplier.toFixed(2)} = Winnings
                </div>
              </div>
            )}
            
            {/* Debug info */}
            <div className="text-xs text-gray-500 mt-2">
              Position: {(wheelPosition % (Math.PI * 2)).toFixed(3)} | 
              Segment: {Math.floor(((wheelPosition % (Math.PI * 2)) + Math.PI/2 + Math.PI) / ((Math.PI * 2) / segments)) % segments} | 
              Total: {segments}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex w-full gap-3 p-2">
        {panelMultipliers.map((multiplier) => {
          // Only highlight if hasSpun is true
          const isSelected = hasSpun && currentSegment && currentSegment.multiplier === multiplier;
          const bgColor = panelColorMap[multiplier] || "#333947";
          return (
            <div
              key={multiplier}
              className="flex flex-col justify-end items-center h-[60px] w-full rounded-md text-sm font-medium border bg-[#0A0009] border-[#333947] transition-all"
              style={isSelected ? { backgroundColor: bgColor } : {}}
            >
              <span className="text-white pb-2">
                {multiplier.toFixed(2)}x
              </span>
              <div
                className="w-full h-3 rounded-b-md"
                style={{ backgroundColor: bgColor }}
              ></div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default GameWheel;