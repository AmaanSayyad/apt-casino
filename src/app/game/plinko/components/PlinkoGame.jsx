"use client";
import { useState, forwardRef, useImperativeHandle, useCallback, useEffect, useRef, useMemo } from "react";
import Matter from 'matter-js';
import { useSelector } from 'react-redux';
import { useGameLogger } from '@/hooks/useGameLogger';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { usePlayBalance } from '@/hooks/usePlayBalance';
import { useProvableFairness } from '@/hooks/useProvableFairness';
import {
  binCenterX,
  derivePlinkoBinPlayable,
  PLINKO_MAX_LANDING_MULTIPLIER,
  pickWeightedPlinkoBin,
  randomPlinkoOutcomeSeed,
} from '@/lib/plinko/playableBins';
import {
  PLINKO_CANVAS_HEIGHT,
  PLINKO_CANVAS_WIDTH,
  PLINKO_PADDING_BOTTOM,
  PLINKO_PADDING_TOP,
  getBallFrictions,
  getPinDistanceX,
  getPinRadius,
  resolvePlinkoBoard,
} from '@/lib/plinko/plinkoConfig';

/** Last peg row Y in canvas coords (bins sit just below). */
function plinkoLastPinRowY(rows) {
  if (rows <= 1) return PLINKO_PADDING_TOP;
  return PLINKO_CANVAS_HEIGHT - PLINKO_PADDING_BOTTOM;
}

import { DEFAULT_PLAY_CHAIN, formatNativeAmount } from '@/lib/chains/registry';
import {
  loadPlinkoSessionStats,
  recordPlinkoSessionRound,
} from '@/lib/client/plinkoSessionStats';

const PlinkoGame = forwardRef(({ rowCount = 16, riskLevel = "High", onRowChange, betAmount = 0, onBetHistoryChange }, ref) => {
  const activeChain =
    useSelector((state) => state.balance.activeChain) || DEFAULT_PLAY_CHAIN;
  const { logGame } = useGameLogger();
  const { address: playAddress } = usePlayWallet();
  const { balanceNative, debitNative, creditNative, releaseStake, symbol } = usePlayBalance();
  const fairness = useProvableFairness('plinko', playAddress);

  const [ballPosition, setBallPosition] = useState(null);
  // Peg hit "flash" is purely visual; keep it out of React state to avoid rerendering many SVG circles.
  const hitPegsRef = useRef(new Set());
  const pegElByIdRef = useRef(new Map());
  const ballHighlightTimeoutRef = useRef(null);
  const [currentRows, setCurrentRows] = useState(rowCount);
  const [currentRiskLevel, setCurrentRiskLevel] = useState(riskLevel);
  const [betHistory, setBetHistory] = useState([]);

  // Physics engine refs — rAF loop only while balls are active (no idle Engine.run)
  const engineRef = useRef(null);
  const ballsLayerRef = useRef(null);
  const activeBallsRef = useRef(new Set());
  const rafRef = useRef(null);
  const pendingReserveRef = useRef(0);
  const multipliersRef = useRef([]);
  const balanceNativeRef = useRef(balanceNative);
  const debitNativeRef = useRef(debitNative);
  const playAddressRef = useRef(playAddress);
  const creditNativeRef = useRef(creditNative);
  const releaseStakeRef = useRef(releaseStake);
  const fairnessRef = useRef(fairness);
  const onBetHistoryChangeRef = useRef(onBetHistoryChange);
  const activeChainRef = useRef(activeChain);

  // Audio refs (drop and bin land only)
  const ballDropAudioRef = useRef(null);
  const binLandAudioRef = useRef(null);

  const playAudio = (ref) => {
    try {
      const audio = ref.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => { });
      }
    } catch { }
  };

  useEffect(() => {
    if (ballDropAudioRef.current) ballDropAudioRef.current.volume = 0.6;
    if (binLandAudioRef.current) binLandAudioRef.current.volume = 0.7;
  }, []);

  playAddressRef.current = playAddress;
  creditNativeRef.current = creditNative;
  releaseStakeRef.current = releaseStake;
  fairnessRef.current = fairness;
  onBetHistoryChangeRef.current = onBetHistoryChange;
  balanceNativeRef.current = balanceNative;
  debitNativeRef.current = debitNative;
  activeChainRef.current = activeChain;

  useEffect(() => {
    setCurrentRows(rowCount);
    setCurrentRiskLevel(riskLevel);
    setBallPosition(null);
    hitPegsRef.current.clear();
    // Reset peg visuals for the newly selected board.
    for (const el of pegElByIdRef.current.values()) {
      el.setAttribute('fill', 'white');
      el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
    }
  }, [rowCount, riskLevel]);

  // Keep the latest bet amount in a ref for use in async handlers
  const betAmountRef = useRef(0);
  useEffect(() => {
    betAmountRef.current = parseFloat(betAmount) || 0;
  }, [betAmount]);

  const board = useMemo(
    () => resolvePlinkoBoard(currentRows, currentRiskLevel),
    [currentRows, currentRiskLevel],
  );
  const { multipliers, pins, binCount, pinsLastRowXCoords } = board;
  multipliersRef.current = board.multipliers;

  const pinDistanceX = useMemo(
    () => getPinDistanceX(currentRows, binCount),
    [currentRows, binCount],
  );

  const multiplierSlotLayout = useMemo(() => {
    const lastPinY = plinkoLastPinRowY(currentRows);
    const pinR = getPinRadius(currentRows);
    const slotTopPct = ((lastPinY + pinR * 2 + 6) / PLINKO_CANVAS_HEIGHT) * 100;
    const slotWidthPct = (pinDistanceX / PLINKO_CANVAS_WIDTH) * 100 * 0.92;
    return multipliers.map((_, index) => ({
      leftPct: (binCenterX(index, pinsLastRowXCoords) / PLINKO_CANVAS_WIDTH) * 100,
      widthPct: slotWidthPct,
      topPct: slotTopPct,
    }));
  }, [multipliers, pinsLastRowXCoords, pinDistanceX, currentRows]);

  const PIN_CATEGORY = 0x0001;
  const BALL_CATEGORY = 0x0002;

  const stopPhysicsLoop = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const createBallDot = (x, y, radius) => {
    const layer = ballsLayerRef.current;
    if (!layer) return null;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(x));
    dot.setAttribute('cy', String(y));
    dot.setAttribute('r', String(radius));
    dot.setAttribute('fill', '#ff6b6b');
    dot.setAttribute('style', 'filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.9))');
    layer.appendChild(dot);
    return dot;
  };

  const removeBallFromWorld = (ball) => {
    const engine = engineRef.current;
    if (engine && ball) {
      Matter.Composite.remove(engine.world, ball);
    }
    if (ball?.plinkoDot?.parentNode) {
      ball.plinkoDot.parentNode.removeChild(ball.plinkoDot);
    }
    activeBallsRef.current.delete(ball);
    if (activeBallsRef.current.size === 0) {
      stopPhysicsLoop();
    }
  };

  const releaseReserve = (amount) => {
    pendingReserveRef.current = Math.max(0, pendingReserveRef.current - amount);
  };

  const stepPhysics = () => {
    const engine = engineRef.current;
    if (!engine) return;
    Matter.Engine.update(engine, 1000 / 60);
    for (const ball of activeBallsRef.current) {
      if (ball.plinkoDot) {
        ball.plinkoDot.setAttribute('cx', String(ball.position.x));
        ball.plinkoDot.setAttribute('cy', String(ball.position.y));
      }
    }
    if (activeBallsRef.current.size > 0) {
      rafRef.current = requestAnimationFrame(stepPhysics);
    } else {
      rafRef.current = null;
    }
  };

  const startPhysicsLoop = () => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(stepPhysics);
    }
  };

  // Initialize physics engine (no Matter.Render — SVG overlay only; no idle Engine.run)
  const initializePhysics = useCallback((rows, riskLevel) => {
    if (typeof window === 'undefined') return;

    const Engine = Matter.Engine;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Events = Matter.Events;
    const Composite = Matter.Composite;

    stopPhysicsLoop();
    for (const ball of activeBallsRef.current) {
      if (ball.plinkoDot?.parentNode) {
        ball.plinkoDot.parentNode.removeChild(ball.plinkoDot);
      }
    }
    activeBallsRef.current.clear();

    if (engineRef.current) {
      Engine.clear(engineRef.current);
    }

    const engine = Engine.create({
      timing: { timeScale: 1 },
    });
    engineRef.current = engine;

    const boardState = resolvePlinkoBoard(rows, riskLevel);
    multipliersRef.current = boardState.multipliers;
    const { pins, pinsLastRowXCoords, binCount: boardBinCount } = boardState;

    // Create pins as static circles
    const pegBodies = [];
    pins.forEach(pin => {
      const pegBody = Bodies.circle(pin.x, pin.y, getPinRadius(rows), {
        isStatic: true,
        render: {
          visible: false,
        },
        collisionFilter: {
          category: PIN_CATEGORY,
          mask: BALL_CATEGORY,
        },
      });
      pegBody.pegId = pin.id;
      pegBody.pinData = pin;
      pegBodies.push(pegBody);
    });

    // Create walls (slanted guard rails like in reference repo)
    const firstPinX = pins[0].x;
    const lastRowFirstPinX = pinsLastRowXCoords[0];
    const lastRowLastPinX = pinsLastRowXCoords[pinsLastRowXCoords.length - 1];

    // Calculate wall angles based on the first and last row pin positions
    const leftWallAngle = Math.atan2(
      firstPinX - lastRowFirstPinX,
      PLINKO_CANVAS_HEIGHT - PLINKO_PADDING_TOP - PLINKO_PADDING_BOTTOM,
    );
    const rightWallAngle = Math.atan2(
      lastRowLastPinX - firstPinX,
      PLINKO_CANVAS_HEIGHT - PLINKO_PADDING_TOP - PLINKO_PADDING_BOTTOM,
    );

    const leftWallX = lastRowFirstPinX - getPinDistanceX(rows, boardBinCount) * 0.5;
    const rightWallX = lastRowLastPinX + getPinDistanceX(rows, boardBinCount) * 0.5;

    const leftWall = Bodies.rectangle(
      leftWallX,
      PLINKO_CANVAS_HEIGHT / 2,
      10,
      PLINKO_CANVAS_HEIGHT,
      {
        isStatic: true,
        angle: leftWallAngle,
        render: { visible: false },
      },
    );

    const rightWall = Bodies.rectangle(
      rightWallX,
      PLINKO_CANVAS_HEIGHT / 2,
      10,
      PLINKO_CANVAS_HEIGHT,
      {
        isStatic: true,
        angle: -rightWallAngle,
        render: { visible: false },
      },
    );

    // Create sensor at bottom for bin detection
    const sensor = Bodies.rectangle(
      PLINKO_CANVAS_WIDTH / 2,
      PLINKO_CANVAS_HEIGHT,
      PLINKO_CANVAS_WIDTH,
      10,
      {
        isSensor: true,
        isStatic: true,
        render: { visible: false },
      },
    );

    // Add all bodies to world
    World.add(engine.world, [...pegBodies, leftWall, rightWall, sensor]);

    let lastPegFlash = 0;

    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        if (bodyA.pegId !== undefined || bodyB.pegId !== undefined) {
          const now = performance.now();
          if (now - lastPegFlash > 120) {
            lastPegFlash = now;
          const pegBody = bodyA.pegId !== undefined ? bodyA : bodyB;
            const pegId = pegBody.pegId;
            if (!hitPegsRef.current.has(pegId)) {
              hitPegsRef.current.add(pegId);
              const el = pegElByIdRef.current.get(pegId);
              if (el) {
                el.setAttribute('fill', '#ffd700');
                el.style.filter = 'drop-shadow(0 0 15px #ffd700) brightness(1.5)';
              }
            }
          }
        }

        if (bodyA === sensor || bodyB === sensor) {
          const ball = bodyA === sensor ? bodyB : bodyA;
          handleBallEnterBin(ball, pinsLastRowXCoords);
        }
      });
    });

    const settleBallLanding = async (ball, pinsLastRowXCoords, resolvedBinIndex) => {
      const meta = ball.plinkoMeta;
      if (!meta) return;

      for (let i = 0; i < 50 && !meta.debited; i++) {
        await new Promise((r) => setTimeout(r, 40));
      }

      const mults = meta.multipliers || multipliersRef.current;
      const binIndex = resolvedBinIndex;

      if (
        !meta.debited ||
        binIndex == null ||
        binIndex < 0 ||
        binIndex >= mults.length
      ) {
        return;
      }

      const multiplier = mults[binIndex];
      const multiplierValue = parseFloat(multiplier.replace('x', ''));
      const betForRound = meta.betAmount;
      const reward = betForRound * multiplierValue;
      const netPnl = reward - betForRound;

        setBallPosition(binIndex);
      if (ballHighlightTimeoutRef.current) clearTimeout(ballHighlightTimeoutRef.current);
      ballHighlightTimeoutRef.current = setTimeout(() => {
        setBallPosition(null);
        ballHighlightTimeoutRef.current = null;
      }, 400);

      let settledFairnessProof = null;
      if (betForRound > 0) {
        const fair = fairnessRef.current;
        if (fair.enabled && meta.fairRound) {
          settledFairnessProof = await fair.reveal(
            { binIndex, multiplier: multiplierValue, rows: meta.rows, riskLevel: meta.riskLevel },
            meta.fairRound,
          );
          fair.reset();
        }
        const credit = await creditNativeRef.current(
          reward,
          playAddressRef.current,
          'plinko',
          {
            rows: meta.rows,
            riskLevel: meta.riskLevel,
            fairnessProof: settledFairnessProof || undefined,
          },
          meta.roundId,
        );
        if (!credit.ok) {
          console.error('Plinko credit failed:', credit.error);
        }
      }

        playAudio(binLandAudioRef);

      const chain = activeChainRef.current;
      const stats = recordPlinkoSessionRound(chain, {
        betAmount: betForRound,
        multiplier: multiplierValue,
        netPnl,
      });
      setGamesPlayed(stats.gamesPlayed);
      setBestMultiplier(stats.bestMultiplier);
      setTotalWon(stats.totalNetPnl);

        const newBetResult = {
        id: meta.id,
        game: 'Plinko',
          title: new Date().toLocaleTimeString(),
        betAmount: formatNativeAmount(betForRound, chain),
        multiplier: mults[binIndex],
        payout: formatNativeAmount(reward, chain),
        netPnl,
          timestamp: Date.now(),
          txHash: null,
        explorerUrl: null,
      };
      setBetHistory((prev) => [newBetResult, ...prev.slice(0, 99)]);
      onBetHistoryChangeRef.current?.(newBetResult);

      const addr = playAddressRef.current;
      if (!addr || betForRound <= 0) return;

      const gameResult = `${meta.rows}rows_${meta.riskLevel}_bin${binIndex}_${multiplier}`;

          logGame({
            gameType: 'plinko',
        playerAddress: addr,
        betAmount: betForRound,
            result: gameResult,
            payout: reward,
        fairnessProof: settledFairnessProof || undefined,
      })
        .then((res) => {
          if (!res?.success) return;
          setBetHistory((prev) =>
            prev.map((item) =>
                item.id === newBetResult.id
                  ? { ...item, txHash: res.transactionHash || null, explorerUrl: res.explorerUrl || null }
                : item,
            ),
          );
          onBetHistoryChangeRef.current?.({
            ...newBetResult,
            txHash: res.transactionHash || null,
            explorerUrl: res.explorerUrl || null,
          });
        })
        .catch(() => {});
    };

    const handleBallEnterBin = (ball, sensorPinsLastRow) => {
      if (ball._plinkoSettled) return;
      ball._plinkoSettled = true;

      const meta = ball.plinkoMeta;
      const pinsLastRowXCoords = meta.pinsLastRowXCoords || sensorPinsLastRow;
      const mults = meta.multipliers || multipliersRef.current;

      let binIndex = meta.outcomeBin ?? meta.fairBin;
      if (binIndex == null) {
        binIndex = pickWeightedPlinkoBin(randomPlinkoOutcomeSeed(), mults, PLINKO_MAX_LANDING_MULTIPLIER);
      }
      const centerX = binCenterX(binIndex, pinsLastRowXCoords);

      Matter.Body.setPosition(ball, { x: centerX, y: ball.position.y });
      if (ball.plinkoDot) {
        ball.plinkoDot.setAttribute('cx', String(centerX));
        ball.plinkoDot.setAttribute('cy', String(ball.position.y));
      }

      removeBallFromWorld(ball);
      void settleBallLanding(ball, pinsLastRowXCoords, binIndex);
    };

    return { pins, pinsLastRowXCoords };
  }, []);

  useEffect(() => {
    initializePhysics(currentRows, currentRiskLevel);

    return () => {
      stopPhysicsLoop();
      if (ballHighlightTimeoutRef.current) {
        clearTimeout(ballHighlightTimeoutRef.current);
        ballHighlightTimeoutRef.current = null;
      }
      for (const ball of activeBallsRef.current) {
        if (ball.plinkoDot?.parentNode) {
          ball.plinkoDot.parentNode.removeChild(ball.plinkoDot);
        }
      }
      activeBallsRef.current.clear();
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
      }
    };
  }, [currentRows, currentRiskLevel, initializePhysics]);

  const MAX_ACTIVE_BALLS = 20;

  const spawnBall = useCallback((meta) => {
    const Bodies = Matter.Bodies;
    const World = Matter.World;
    const rows = meta.rows;
    const binCountForRound = meta.binCount;
    const ballOffsetRangeX = getPinDistanceX(rows, binCountForRound) * 0.8;
    const ballRadius = getPinRadius(rows) * 2;
    const { pins: currentPins } = resolvePlinkoBoard(rows, meta.riskLevel);
    const firstRowPins = currentPins.filter((pin) => pin.row === 0);
    if (firstRowPins.length === 0) {
      throw new Error('Board not ready — try again.');
    }
    const firstRowCenterX =
      (firstRowPins[0].x + firstRowPins[firstRowPins.length - 1].x) / 2;
    const startX = firstRowCenterX + (Math.random() - 0.5) * ballOffsetRangeX;
    const frictions = getBallFrictions(rows);
    const ball = Bodies.circle(startX, 0, ballRadius, {
      restitution: 0.8,
      friction: frictions.friction,
      frictionAir: frictions.frictionAir,
      collisionFilter: { category: BALL_CATEGORY, mask: PIN_CATEGORY },
      render: { visible: false },
    });
    ball.plinkoMeta = meta;
    ball.plinkoDot = createBallDot(startX, 0, ballRadius);
    activeBallsRef.current.add(ball);
    World.add(engineRef.current.world, ball);
    startPhysicsLoop();
    playAudio(ballDropAudioRef);
    return ball;
  }, []);

  const dropBall = useCallback((amountOverride) => {
    if (!engineRef.current) {
      alert('Game is still loading — please wait a second and try again.');
      return;
    }
    if (activeBallsRef.current.size >= MAX_ACTIVE_BALLS) {
      return;
    }

    const latestBetAmount =
      typeof amountOverride === 'number' && Number.isFinite(amountOverride) && amountOverride > 0
        ? amountOverride
        : betAmountRef.current;
    betAmountRef.current = latestBetAmount;

    if (latestBetAmount <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    const available =
      balanceNativeRef.current - pendingReserveRef.current;
    if (latestBetAmount > available) {
      alert(
        `Insufficient balance! You have ${balanceNativeRef.current.toFixed(3)} ${symbol} but need ${latestBetAmount} ${symbol}`,
      );
      return;
    }

    pendingReserveRef.current += latestBetAmount;

    const roundBoard = resolvePlinkoBoard(currentRows, currentRiskLevel);
    const outcomeSeed = randomPlinkoOutcomeSeed();
    const roundMeta = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      betAmount: latestBetAmount,
      debited: false,
      fairBin: null,
      fairRound: null,
      outcomeBin: pickWeightedPlinkoBin(outcomeSeed, roundBoard.multipliers, PLINKO_MAX_LANDING_MULTIPLIER),
      outcomeSeed,
      rows: currentRows,
      riskLevel: currentRiskLevel,
      binCount: roundBoard.binCount,
      multipliers: roundBoard.multipliers,
      pinsLastRowXCoords: roundBoard.pinsLastRowXCoords,
    };

    let ball;
    try {
      ball = spawnBall(roundMeta);
    } catch (err) {
      releaseReserve(latestBetAmount);
      alert(err instanceof Error ? err.message : 'Could not start the round. Please try again.');
      return;
    }

    void (async () => {
      try {
        const debit = await debitNativeRef.current(latestBetAmount, playAddressRef.current, 'plinko', {
          rows: currentRows,
          riskLevel: currentRiskLevel,
        });
        releaseReserve(latestBetAmount);
        if (!debit.ok) {
          removeBallFromWorld(ball);
          alert(debit.error || 'Could not place bet. Connect your wallet if you have not already.');
          return;
        }
        roundMeta.debited = true;
        roundMeta.roundId = debit.roundId ?? null;

        const fair = fairnessRef.current;
        const addr = playAddressRef.current;
        if (fair.enabled && addr) {
          const round = await fair.begin();
          if (round) {
            roundMeta.fairRound = round;
            roundMeta.fairBin = derivePlinkoBinPlayable(round.seedBytes, roundMeta.multipliers);
            roundMeta.outcomeBin = roundMeta.fairBin;
          }
        }
      } catch (err) {
        releaseReserve(latestBetAmount);
        removeBallFromWorld(ball);
        if (roundMeta.debited && latestBetAmount > 0) {
          await releaseStakeRef.current(playAddressRef.current, 'plinko').catch(() => {});
          roundMeta.debited = false;
        }
        alert(err instanceof Error ? err.message : 'Could not place bet. Please try again.');
      }
    })();
  }, [currentRows, currentRiskLevel, symbol, spawnBall]);

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    dropBall
  }), [dropBall]);

  // Generate gradient colors for multiplier slots
  const getSlotColor = (index) => {
    const totalSlots = multipliers.length;
    const centerIndex = Math.floor(totalSlots / 2);
    const distanceFromCenter = Math.abs(index - centerIndex);
    const maxDistance = centerIndex;

    if (index === 0 || index === totalSlots - 1) {
      return "from-pink-500 to-red-500";
    } else if (index === centerIndex) {
      return "from-blue-500 to-purple-500";
    } else {
      const ratio = distanceFromCenter / maxDistance;
      if (ratio > 0.7) {
        return "from-pink-500 to-purple-500";
      } else if (ratio > 0.4) {
        return "from-purple-500 to-blue-500";
      } else {
        return "from-blue-500 to-purple-500";
      }
    }
  };

  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [bestMultiplier, setBestMultiplier] = useState(0);
  const [totalWon, setTotalWon] = useState(0);

  useEffect(() => {
    const saved = loadPlinkoSessionStats(activeChain);
    setGamesPlayed(saved.gamesPlayed);
    setBestMultiplier(saved.bestMultiplier);
    setTotalWon(saved.totalNetPnl);
  }, [activeChain]);

  const recentBetSlots = useMemo(() => {
    const filled = betHistory.slice(0, 5);
    const emptyCount = Math.max(0, 5 - filled.length);
    return { filled, emptyCount };
  }, [betHistory]);

  return (
    <>
    <div className="bg-[#1A0015] rounded-xl border border-[#333947] p-3 sm:p-6 overflow-hidden">


      {/* Plinko Board Container */}
      <div className="relative bg-[#2A0025] rounded-lg p-3 sm:p-6 min-h-0 flex flex-col items-center">
        <p className="mb-3 w-full max-w-[800px] rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-center text-[10px] leading-snug text-amber-100/90 sm:text-xs">
          Max landing multiplier: <strong>{PLINKO_MAX_LANDING_MULTIPLIER}×</strong>. Payouts are verified server-side.
        </p>
        {/* Audio elements */}
        <audio ref={ballDropAudioRef} src="/sounds/chip-put.mp3" preload="auto" />
        <audio ref={binLandAudioRef} src="/sounds/win-chips.mp3" preload="auto" />
        <div className="relative w-full max-w-[800px] min-w-0">
          {/* Shared 4:3 frame so pegs and multiplier slots use the same coordinate scale */}
          <div className="relative w-full aspect-[4/3]">
            <svg
              className="absolute inset-0 h-full w-full z-10"
              viewBox={`0 0 ${PLINKO_CANVAS_WIDTH} ${PLINKO_CANVAS_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
            >
            {pins.map((pin) => (
              <circle
                key={pin.id}
                  ref={(el) => {
                    if (!el) return;
                    pegElByIdRef.current.set(pin.id, el);
                  }}
                cx={pin.x}
                cy={pin.y}
                r="6"
                  fill="white"
                className="drop-shadow-sm"
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
              />
            ))}
              <g ref={ballsLayerRef} />
          </svg>

            <div className="pointer-events-none absolute inset-0 z-20">
              {multipliers.map((multiplier, index) => {
                const layout = multiplierSlotLayout[index];
                return (
                  <div
                    key={index}
                    className={`absolute flex flex-col items-center text-center transition-all duration-300 ${
                      ballPosition === index ? 'font-bold text-yellow-400' : 'text-white'
                    }`}
                    style={{
                      left: `${layout.leftPct}%`,
                      top: `${layout.topPct}%`,
                      width: `${layout.widthPct}%`,
                      transform:
                        ballPosition === index
                          ? 'translateX(-50%) scale(1.1)'
                          : 'translateX(-50%)',
                    }}
                  >
                    <div
                      className={`flex w-full aspect-[10/7] max-h-8 items-center justify-center rounded bg-gradient-to-r ${getSlotColor(index)} shadow-lg sm:max-h-9 ${
                        ballPosition === index ? 'ring-2 ring-yellow-400' : ''
                      }`}
                    >
                      <span className="max-w-full truncate px-0.5 text-[7px] font-bold leading-none text-white sm:text-[9px] md:text-[10px]">
                        {multiplier}
                      </span>
                    </div>
                    <div
                      className={`mt-0.5 h-0.5 w-full rounded-full sm:mt-1 sm:h-1 ${
                        ballPosition === index
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : 'bg-[#333947]'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bet History - desktop sidebar */}
          <div className="hidden md:block absolute right-2 lg:right-4 top-4 z-30">
            <div className="space-y-2">
              {recentBetSlots.filled.map((bet, index) => (
                <div key={index} className="w-16 h-16 bg-[#2A0025] border border-[#333947] rounded-lg flex flex-col items-center justify-center p-1">
                  <span className="w-full text-center leading-tight text-xs font-bold text-white">{bet.multiplier}</span>
                  <span
                    className={`w-full text-center leading-tight text-[10px] ${
                      (bet.netPnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {(bet.netPnl ?? 0) >= 0 ? '+' : ''}
                    {formatNativeAmount(bet.netPnl ?? 0, activeChain)} {symbol}
                  </span>
                </div>
              ))}
              {Array.from({ length: recentBetSlots.emptyCount }).map((_, index) => (
                <div key={`empty-${index}`} className="w-16 h-16 bg-[#2A0025] border border-[#333947] rounded-lg flex items-center justify-center opacity-30">
                  <span className="text-xs text-gray-500">-</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile recent drops */}
          <div className="mt-2 flex w-full gap-1.5 overflow-x-auto pb-2 scrollbar-thin md:hidden">
            {recentBetSlots.filled.map((bet, index) => (
              <div
                key={`m-${index}`}
                className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-[#333947] bg-[#2A0025] p-1"
              >
                <span className="text-[10px] font-bold text-white">{bet.multiplier}</span>
                <span
                  className={`text-[9px] ${
                    (bet.netPnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {(bet.netPnl ?? 0) >= 0 ? '+' : ''}
                  {formatNativeAmount(bet.netPnl ?? 0, activeChain)}
                </span>
                  </div>
            ))}
            {Array.from({ length: recentBetSlots.emptyCount }).map((_, index) => (
              <div
                key={`m-empty-${index}`}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#333947] bg-[#2A0025] opacity-30"
              >
                <span className="text-xs text-gray-500">-</span>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* Game Stats */}
      <div className="mt-4 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-6 pb-2 md:pb-0">
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-white">{gamesPlayed}</div>
          <div className="text-[10px] sm:text-xs text-gray-400">Games Played</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-white">
            {bestMultiplier > 0
              ? `${formatNativeAmount(bestMultiplier, activeChain)}x`
              : '—'}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400">Best Multiplier</div>
        </div>
        <div className="text-center">
          <div
            className={`text-lg sm:text-2xl font-bold ${
              totalWon > 0 ? 'text-green-400' : totalWon < 0 ? 'text-red-400' : 'text-white'
            }`}
          >
            {totalWon > 0 ? '+' : ''}
            {formatNativeAmount(totalWon, activeChain)} {symbol}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400">Net P&amp;L (session)</div>
        </div>
      </div>
    </div>
    </>
  );
});

PlinkoGame.displayName = 'PlinkoGame';

export default PlinkoGame;