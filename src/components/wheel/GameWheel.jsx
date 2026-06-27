"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils.jsx";
import arrow from "../../../public/arrow.svg";
import {
  buildExpandedWheelSegments,
  segmentIndexUnderPointer,
  wheelPanelColorMap,
  wheelPanelMultipliers,
  wheelRotationForSegmentIndex,
} from "@/lib/wheel/wheelSegments";

export { wheelDataByRisk } from "@/lib/wheel/wheelSegments";

function selectSegmentIndexByProbability(wheelData) {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < wheelData.length; i++) {
    cumulative += wheelData[i].probability;
    if (rand <= cumulative) return i;
  }
  return wheelData.length - 1;
}

function drawWheelSegments(ctx, centerX, centerY, radius, segments, wheelData) {
  const segmentAngle = (Math.PI * 2) / segments;
  for (let i = 0; i < segments; i++) {
    const startAngle = i * segmentAngle;
    const endAngle = (i + 1) * segmentAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
    ctx.arc(centerX, centerY, radius * 0.93, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = wheelData[i].color;
    ctx.fill();
  }
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
  onSegmentLanded,
  forcedSegmentIndex = null,
  landedSegmentIndex = null,
}) => {
  const canvasRef = useRef(null);
  const spinSoundRef = useRef(null);
  const ctxRef = useRef(null);
  const staticWheelRef = useRef(null);
  const layoutRef = useRef({ size: 0, centerX: 0, centerY: 0, radius: 0 });
  const wheelPositionRef = useRef(wheelPosition);
  const handleSelectMultiplierRef = useRef(handleSelectMultiplier);
  const onColorDetectedRef = useRef(onColorDetected);
  const onSegmentLandedRef = useRef(onSegmentLanded);
  const setWheelPositionRef = useRef(setWheelPosition);
  const forcedSegmentIndexRef = useRef(forcedSegmentIndex);

  const wheelData = useMemo(
    () => buildExpandedWheelSegments(risk, noOfSegments),
    [risk, noOfSegments],
  );
  const segments = wheelData.length;
  const panelMultipliers = useMemo(
    () => wheelPanelMultipliers(risk, noOfSegments),
    [risk, noOfSegments],
  );
  const panelColorMap = useMemo(
    () => wheelPanelColorMap(risk, noOfSegments),
    [risk, noOfSegments],
  );

  wheelPositionRef.current = wheelPosition;
  handleSelectMultiplierRef.current = handleSelectMultiplier;
  onColorDetectedRef.current = onColorDetected;
  onSegmentLandedRef.current = onSegmentLanded;
  setWheelPositionRef.current = setWheelPosition;
  forcedSegmentIndexRef.current = forcedSegmentIndex;

  const pointerIndex =
    !isSpinning && segments > 0
      ? segmentIndexUnderPointer(wheelPosition, segments)
      : null;

  const activeIndex = isSpinning ? null : pointerIndex;

  const currentSegment =
    activeIndex != null ? wheelData[activeIndex] : wheelData[pointerIndex ?? 0];

  const playSpinSound = () => {
    const audio = spinSoundRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const measureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return 0;

    const size = Math.min(
      canvas.parentElement.clientWidth,
      canvas.parentElement.clientHeight,
    ) - 40;

    if (size <= 0) return 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelSize = Math.round(size * dpr);

    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctxRef.current = canvas.getContext("2d", { alpha: false });
    }

    const centerX = pixelSize / 2;
    const centerY = pixelSize / 2;
    const radius = pixelSize / 2 - 10 * dpr;
    layoutRef.current = { size: pixelSize, centerX, centerY, radius, dpr };
    return pixelSize;
  }, []);

  const rebuildStaticWheel = useCallback(() => {
    const pixelSize = measureCanvas();
    if (!pixelSize) return;

    const { centerX, centerY, radius } = layoutRef.current;
    const offscreen = document.createElement("canvas");
    offscreen.width = pixelSize;
    offscreen.height = pixelSize;
    const offCtx = offscreen.getContext("2d", { alpha: false });
    if (!offCtx) return;

    offCtx.fillStyle = "#0A0009";
    offCtx.fillRect(0, 0, pixelSize, pixelSize);
    drawWheelSegments(offCtx, centerX, centerY, radius, segments, wheelData);
    staticWheelRef.current = offscreen;
  }, [measureCanvas, segments, wheelData]);

  const drawWheel = useCallback((position) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const staticWheel = staticWheelRef.current;
    if (!canvas || !ctx || !staticWheel) return;

    const { size, centerX, centerY, radius } = layoutRef.current;
    if (!size) return;

    ctx.fillStyle = "#0A0009";
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-position);
    ctx.drawImage(staticWheel, -centerX, -centerY);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#0A0009";
    ctx.fill();
    ctx.strokeStyle = "#333947";
    ctx.lineWidth = Math.max(1, layoutRef.current.dpr || 1);
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (spinSoundRef.current) spinSoundRef.current.volume = 0.75;
  }, []);

  useEffect(() => {
    rebuildStaticWheel();
    drawWheel(wheelPositionRef.current);
  }, [rebuildStaticWheel, drawWheel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;

    const observer = new ResizeObserver(() => {
      rebuildStaticWheel();
      drawWheel(wheelPositionRef.current);
    });
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [rebuildStaticWheel, drawWheel]);

  useEffect(() => {
    if (isSpinning) return;
    drawWheel(wheelPosition);
  }, [drawWheel, isSpinning, wheelPosition]);

  useEffect(() => {
    if (!isSpinning) return;

    let cancelled = false;
    let rafId;

    const startAnimation = () => {
      if (cancelled || !canvasRef.current) return false;

      playSpinSound();

      const forced = forcedSegmentIndexRef.current;
      const selectedIndex =
        forced != null && forced >= 0
          ? forced % segments
          : selectSegmentIndexByProbability(wheelData);
      const totalSpins = 5;
      const targetPosition = wheelRotationForSegmentIndex(selectedIndex, segments);
      const startRotation =
        ((wheelPositionRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      let delta = targetPosition - startRotation;
      if (delta < 0) delta += Math.PI * 2;
      const finalRotation = Math.PI * 2 * totalSpins + delta;

      let startTime = null;
      const duration = 3000;

      const animate = (timestamp) => {
        if (cancelled) return;

        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const newPosition = startRotation + finalRotation * easeOut;

        drawWheel(newPosition);

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
          return;
        }

        const finalPosition = startRotation + finalRotation;
        wheelPositionRef.current = finalPosition;
        setWheelPositionRef.current(finalPosition);

        const landedIndex =
          forced != null && forced >= 0
            ? forced % segments
            : segmentIndexUnderPointer(finalPosition, segments);
        const landed = wheelData[landedIndex];
        handleSelectMultiplierRef.current?.(landed.multiplier);

        const payload = {
          segmentIndex: landedIndex,
          multiplier: landed.multiplier,
          color: landed.color,
          probability: landed.probability,
        };

        onColorDetectedRef.current?.(payload);
        onSegmentLandedRef.current?.(payload);

        if (window.wheelBetCallback) {
          window.wheelBetCallback(payload);
        }
      };

      rafId = requestAnimationFrame(animate);
      return true;
    };

    if (!startAnimation()) {
      rafId = requestAnimationFrame(() => {
        if (!cancelled) startAnimation();
      });
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [drawWheel, isSpinning, segments, wheelData, forcedSegmentIndex]);

  return (
    <div className="flex flex-col justify-between items-center h-full w-full">
      <audio ref={spinSoundRef} src="/sounds/wheel-spin.mp3" preload="auto" />
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
          className="max-w-[85vw] max-h-[85vh] rounded-full pt-4 p-2 bg-[#0A0009]"
        />

        {!isSpinning && hasSpun && activeIndex != null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-4xl font-bold text-white animate-bounce mb-2">
              {currentSegment.multiplier.toFixed(2)}x
            </div>
            {currentSegment.multiplier > 0 && (
              <div className="text-lg text-green-400 bg-black/50 px-3 py-1 rounded-lg">
                Winnings: {currentSegment.multiplier.toFixed(2)} × bet
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-md mx-auto mb-4">
        <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333947]">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Current Position</div>
            <div className="flex items-center justify-center gap-4">
              <div
                className="w-8 h-8 rounded-full border-2 border-white"
                style={{ backgroundColor: currentSegment.color }}
              />
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

            {activeIndex != null && (
              <div className="text-xs text-gray-500 mt-2">
                Segment {activeIndex + 1} of {segments}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full gap-3 p-2">
        {panelMultipliers.map((multiplier) => {
          const isSelected =
            hasSpun && activeIndex != null && currentSegment.multiplier === multiplier;
          const bgColor = panelColorMap[multiplier] || "#333947";
          return (
            <div
              key={multiplier}
              className="flex flex-col justify-end items-center h-[60px] w-full rounded-md text-sm font-medium border bg-[#0A0009] border-[#333947] transition-all"
              style={isSelected ? { backgroundColor: bgColor } : {}}
            >
              <span className="text-white pb-2">{multiplier.toFixed(2)}x</span>
              <div className="w-full h-3 rounded-b-md" style={{ backgroundColor: bgColor }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameWheel;
