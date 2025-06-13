"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils.jsx";

const ColorDetector = ({ wheelPosition, wheelData, segments, onColorDetected }) => {
  const [currentColor, setCurrentColor] = useState(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(null);
  const canvasRef = useRef(null);
  
  // Helper function to get the current segment under the pointer
  const getCurrentSegmentUnderPointer = () => {
    const normalizedPosition = wheelPosition % (Math.PI * 2);
    const segmentAngle = (Math.PI * 2) / segments;
    
    // Calculate the segment index by taking into account the wheel rotation
    // The pointer is at the top (12 o'clock), so we need to adjust the calculation
    const offsetPosition = (normalizedPosition + Math.PI/2 + Math.PI) % (Math.PI * 2);
    const segmentIndex = Math.floor(offsetPosition / segmentAngle) % segments;
    
    return wheelData[segmentIndex];
  };

  // Update the current color and multiplier whenever the wheel position changes
  useEffect(() => {
    if (!wheelData || wheelData.length === 0) return;
    
    const currentSegment = getCurrentSegmentUnderPointer();
    if (currentSegment) {
      setCurrentColor(currentSegment.color);
      setCurrentMultiplier(currentSegment.multiplier);
    }
  }, [wheelPosition, wheelData, segments]);

  // Only call onColorDetected when explicitly requested (not on every position change)
  const triggerColorDetection = () => {
    // Always get fresh segment data
    const currentSegment = getCurrentSegmentUnderPointer();
    
    if (currentSegment && currentSegment.color && currentSegment.multiplier !== null) {
      const detectionResult = {
        color: currentSegment.color,
        multiplier: currentSegment.multiplier,
        probability: currentSegment.probability || 0
      };
      
      // Update local state
      setCurrentColor(currentSegment.color);
      setCurrentMultiplier(currentSegment.multiplier);
      
      // Call parent callback
      if (onColorDetected) {
        onColorDetected(detectionResult);
      }
      
      // Call global callback if exists
      if (window.onWheelColorDetected) {
        window.onWheelColorDetected(currentSegment.color, currentSegment.multiplier);
      }
      
      console.log('🎯 Color detection result:', detectionResult);
      return detectionResult;
    }
    
    console.log('⚠️ Color detection failed - no valid segment data');
    return null;
  };

  // Expose triggerColorDetection function to parent
  useEffect(() => {
    if (window) {
      window.triggerWheelColorDetection = triggerColorDetection;
    }
  }, [currentColor, currentMultiplier, onColorDetected]);

  // Render a detailed preview of the detected color and multiplier
  return (
    <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333947] shadow-lg">
      <div className="text-center mb-2">
        <div className="text-sm text-gray-300 font-medium uppercase tracking-wider mb-1">Color Detector</div>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-full border-2 border-white/30 shadow-inner"
            style={{ backgroundColor: currentColor || "#333947" }}
          ></div>
          <div className="flex flex-col">
            <div className="text-xs text-gray-400">Detected Color</div>
            <div className="text-sm text-gray-200">{currentColor || "None"}</div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-400">Multiplier</div>
          <div className="text-2xl font-bold text-white">
            {currentMultiplier !== null ? `${currentMultiplier.toFixed(2)}x` : "N/A"}
          </div>
        </div>
      </div>
      
      {currentMultiplier > 0 && (
        <div className="mt-2 p-2 bg-green-900/20 border border-green-700/30 rounded-md">
          <div className="text-xs text-center text-green-300">
            Your bet amount is multiplied by <span className="font-bold">{currentMultiplier.toFixed(2)}x</span> to calculate winnings
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          The spinner is currently over a {currentColor ? 
            <span className="font-medium" style={{ color: currentColor }}>
              {currentColor}
            </span> : "unknown"} segment
        </div>
      </div>
    </div>
  );
};

export default ColorDetector;
