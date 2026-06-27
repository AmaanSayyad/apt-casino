import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineVolumeUp, HiOutlineVolumeOff, HiOutlineInformationCircle } from "react-icons/hi";
import { FaRegGem, FaBomb, FaDiamond, FaCoins, FaBullseye, FaClipboardCheck, FaDice, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { GiCrystalGrowth } from "react-icons/gi";
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { setBalance } from '@/store/balanceSlice';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { usePlayBalance } from '@/hooks/usePlayBalance';
import { houseEdgePercent } from '@/lib/houseEdge';
import { buildMinesMultiplierRows } from '@/lib/minesPayTable';
import MinesHowToModal, { shouldShowMinesHowToHint } from './components/MinesHowToModal';

const GRID_SIZES = {
  5: 5, // 5x5 grid - classic mode
};

const MINE_SPRITES = [
  "/images/bomb.png",
];

const GEM_SPRITES = [
  "/images/diamond.png",
];

// Sound effects URLs
const SOUNDS = {
  click: "/sounds/click.mp3",
  reveal: "/sounds/reveal.mp3",
  gem: "/sounds/gem.mp3",
  explosion: "/sounds/explosion.mp3",
  win: "/sounds/win.mp3",
  cashout: "/sounds/cashout.mp3",
  hover: "/sounds/hover.mp3",
  bet: "/sounds/bet.mp3",
};

const Game = ({
  betSettings = {},
  onGameStatusChange,
  onGameComplete,
  onAutoRoundFailed,
  fairnessEnabled = false,
  fairnessRoundRef,
  fairnessReveal,
}) => {
  // Redux integration
  const dispatch = useDispatch();
  const { userBalance } = useSelector((state) => state.balance);

  // Wallet integration
  const { address: playAddress, connected: playConnected, chainLabel } = usePlayWallet();
  const { balanceNative, settleNative, symbol } = usePlayBalance();

  // Game Settings
  const defaultSettings = {
    betAmount: 1,
    mines: 5,
    isAutoBetting: false,
    tilesToReveal: 5,
  };

  const settings = { ...defaultSettings, ...betSettings };
  const betSettingsRef = useRef(betSettings);
  betSettingsRef.current = betSettings;
  const processedSettingsRef = useRef(null); // Track if current settings have been processed
  const isCashoutCompleteRef = useRef(false); // Track if user just cashed out
  const gridRef = useRef([]);
  const isPlayingRef = useRef(false);
  const revealedCountRef = useRef(0);
  const multiplierRef = useRef(1);
  const gameOverRef = useRef(false);
  const gameWonRef = useRef(false);
  const autoRevealTimersRef = useRef([]);
  const autoRevealRunIdRef = useRef(0);
  const startAutoRevealRef = useRef(() => {});
  const cashoutInProgressRef = useRef(false);
  const revealedIndicesRef = useRef([]);

  const settleMinesRound = async ({
    betAmount,
    payoutAmount,
    hitMine,
    revealedTiles,
    revealedIndices,
  }) => {
    if (!playAddress) return { ok: false, error: 'Wallet required' };

    let fairnessProof = null;
    if (fairnessEnabled && fairnessRoundRef?.current && fairnessReveal) {
      fairnessProof = await fairnessReveal(
        {
          mines: minesCount,
          revealedTiles,
          hitMine,
          multiplier: hitMine ? 0 : multiplierRef.current,
        },
        fairnessRoundRef.current,
      );
    }

    return settleNative(
      betAmount,
      payoutAmount,
      playAddress,
      'mines',
      {
        minesCount,
        gridSize,
        revealedTiles,
        hitMine,
        revealedIndices: revealedIndices ?? revealedIndicesRef.current,
        fairnessProof: fairnessProof || undefined,
      },
    );
  };

  // Game State
  const [grid, setGrid] = useState([]);
  const [gridSize, setGridSize] = useState(GRID_SIZES[5]); // Default 5x5 grid
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [minesCount, setMinesCount] = useState(settings.mines);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [profit, setProfit] = useState(0);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [isAutoBetting, setIsAutoBetting] = useState(settings.isAutoBetting);
  const [isGameInfoVisible, setIsGameInfoVisible] = useState(false);
  const [showIdleHint, setShowIdleHint] = useState(false);
  const [betAmount, setBetAmount] = useState(settings.betAmount);
  const [autoRevealInProgress, setAutoRevealInProgress] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Audio refs
  const audioRefs = {
    click: useRef(null),
    reveal: useRef(null),
    gem: useRef(null),
    explosion: useRef(null),
    win: useRef(null),
    cashout: useRef(null),
    hover: useRef(null),
    bet: useRef(null),
  };

  // Window size for Confetti
  const { width, height } = useWindowSize();

  // Calculate safe tiles
  const totalTiles = gridSize * gridSize;
  const safeTiles = totalTiles - minesCount;

  // Calculate next multiplier after one more safe reveal (must match `buildMinesMultiplierRows`).
  const calculateNextMultiplier = (revealed) => {
    const rows = buildMinesMultiplierRows(minesCount, gridSize);
    const row = rows.find((r) => r.tiles === revealed + 1);
    if (!row) return multiplier;
    return row.multiplier;
  };

  // Calculate chance of hitting a mine
  const calculateMineChance = () => {
    // Edge cases
    if (revealedCount >= totalTiles) return 0; // All tiles revealed
    if (revealedCount >= safeTiles) return 100; // All safe tiles revealed, only mines left
    if (safeTiles <= 0) return 100; // No safe tiles
    if (minesCount <= 0) return 0; // No mines

    // Regular case: mines / unrevealed tiles
    const unrevealedTiles = totalTiles - revealedCount;
    if (unrevealedTiles <= 0) return 0;

    const chance = Math.round((minesCount / unrevealedTiles) * 100);
    return isNaN(chance) ? 0 : chance; // Guard against NaN
  };

  // Calculate current payout
  const calculatePayout = () => {
    // Use the bet amount from settings (form) instead of local state
    const currentBetAmount = settings.betAmount || 0.1;
    return currentBetAmount * multiplier;
  };

  // Multiplier ladder (shared with Mines payout card — post–house-edge).
  const multiplierTable = useMemo(
    () => buildMinesMultiplierRows(minesCount, gridSize),
    [minesCount, gridSize],
  );

  // House edge for display (e.g. "House edge: 3.0%")
  const minesHouseEdgePct = useMemo(() => houseEdgePercent('mines'), []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    revealedCountRef.current = revealedCount;
  }, [revealedCount]);

  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    gameWonRef.current = gameWon;
  }, [gameWon]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => () => {
    autoRevealTimersRef.current.forEach((id) => clearTimeout(id));
    autoRevealTimersRef.current = [];
  }, []);

  // Play sound helper function
  const playSound = (sound) => {
    if (isMuted || !audioRefs[sound]?.current) return;

    try {
      const audio = audioRefs[sound].current;
      audio.currentTime = 0; // Reset to start
      audio.volume = 0.3; // Set volume to 30%
      audio.play().catch(error => {
        console.warn(`Could not play sound ${sound}:`, error);
      });
    } catch (error) {
      console.warn(`Error playing sound ${sound}:`, error);
    }
  };

  // Initialize the grid
  const initializeGrid = (mines = minesCount, forcedPositions = null) => {
    const mineTotal = Number(mines) || Number(minesCount) || 5;
    const validMines = Math.min(Math.max(1, mineTotal), totalTiles - 1);

    let newGrid = Array(gridSize)
      .fill()
      .map(() =>
        Array(gridSize)
          .fill()
          .map(() => ({
            isDiamond: false,
            isBomb: false,
            isRevealed: false,
            isHovered: false,
            spriteIndex: 0,
          }))
      );

    let bombsPlaced = 0;
    if (forcedPositions?.length) {
      forcedPositions.forEach((pos) => {
        const row = Math.floor(pos / gridSize);
        const col = pos % gridSize;
        if (!newGrid[row][col].isBomb) {
          newGrid[row][col].isBomb = true;
          bombsPlaced++;
        }
      });
    }
    while (bombsPlaced < validMines) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      if (!newGrid[row][col].isBomb) {
        newGrid[row][col].isBomb = true;
        bombsPlaced++;
      }
    }

    // All non-bomb cells are diamonds (gems)
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!newGrid[i][j].isBomb) {
          newGrid[i][j].isDiamond = true;
        }
      }
    }

    return newGrid;
  };

  // Initialize the game on component mount
  useEffect(() => {
    const size = GRID_SIZES[5];
    setGridSize(size);
    setGrid(initializeGrid());
    setShowIdleHint(shouldShowMinesHowToHint());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent about game status changes
  useEffect(() => {
    if (onGameStatusChange) {
      // Use a small delay to ensure state updates are complete
      onGameStatusChange({ isPlaying, hasPlacedBet });
    }
  }, [isPlaying, hasPlacedBet, onGameStatusChange]);

  // Reset the game state when gridSize or minesCount changes
  useEffect(() => {
    if (isPlaying) return; // Don't reset while playing

    setGrid(initializeGrid(minesCount));
    setMultiplier(1.0);
    setProfit(0);
    setRevealedCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minesCount]); // Only depend on minesCount since gridSize is fixed at 5

  // Update state when bet settings change
  useEffect(() => {
  // Unique key per launched round so auto sessions can continue reliably
    const settingsKey =
      betSettings.roundId != null
        ? `round-${betSettings.roundId}`
        : JSON.stringify({
            betAmount: settings.betAmount,
            mines: settings.mines,
            tilesToReveal: settings.tilesToReveal,
            isAutoBetting: settings.isAutoBetting,
          });

    // Skip if we've already processed these exact settings
    if (processedSettingsRef.current === settingsKey) {
      return;
    }

    isCashoutCompleteRef.current = false;

    // Check if we actually have settings to process
    // Only process if betSettings is not empty (form has been submitted)
    if (Object.keys(betSettings).length > 0) {
      // Save current settings as processed
      processedSettingsRef.current = settingsKey;

      const mineCount = Number(settings.mines) || 5;
      const newGrid = initializeGrid(mineCount, settings.minePositions);
      gridRef.current = newGrid;

      // Reset the game first without affecting hasPlacedBet
      // We'll update these manually to avoid infinite loops
      setGameOver(false);
      setGameWon(false);
      setGrid(newGrid);
      setMultiplier(1.0);
      setProfit(0);
      setRevealedCount(0);
      setAutoRevealInProgress(false);
      setShowConfetti(false);

      // Set state with new settings
      setMinesCount(mineCount);
      setBetAmount(Number(settings.betAmount) || 0.1);
      setIsAutoBetting(settings.isAutoBetting);
      revealedCountRef.current = 0;
      multiplierRef.current = 1;
      gameOverRef.current = false;
      gameWonRef.current = false;
      cashoutInProgressRef.current = false;
      setIsCashingOut(false);

      const tilesToAutoReveal = Number(settings.tilesToReveal) || 5;
      const shouldAutoReveal = Boolean(settings.isAutoBetting);

      // Place bet — enable grid immediately, debit + auto reveal in background
      const startGameWithBet = () => {
        if (!playConnected || !playAddress) {
          toast.error(`Please connect your ${chainLabel} wallet first`);
          return;
        }

        const currentBalance = balanceNative;
        const stake = Number(settings.betAmount) || 0;

        if (stake <= 0) {
          toast.error('Enter a valid bet amount');
          return;
        }

        if (currentBalance < stake) {
          toast.error(`Insufficient balance. You have ${currentBalance.toFixed(8)} ${symbol} but need ${stake} ${symbol}`);
          return;
        }

        setShowIdleHint(false);
        isPlayingRef.current = true;
        setIsPlaying(true);
        setHasPlacedBet(true);
        playSound('bet');
        revealedIndicesRef.current = [];

        if (shouldAutoReveal) {
          startAutoRevealRef.current(tilesToAutoReveal);
        }
      };

      startGameWithBet();
    }
  }, [settings, userBalance, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle cell hover (for desktop)
  const handleCellHover = (row, col, isHovering) => {
    if (gameOver || gameWon || !isPlaying || grid[row][col].isRevealed) return;

    if (isHovering) playSound('hover');

    const newGrid = [...grid];
    newGrid[row][col].isHovered = isHovering;
    setGrid(newGrid);
  };

  // Reveal a specific cell
  const revealCell = (row, col) => {
    if (gameOver || gameWon || !isPlaying || grid[row][col].isRevealed) return;

    playSound('click');

    const newGrid = [...grid];
    newGrid[row][col].isRevealed = true;

    setTimeout(() => {
      if (grid[row][col].isBomb) {
        playSound('explosion');
        toast.error('Game Over! You hit a mine!');

        // Immediately reset critical states
        setIsPlaying(false);
        setHasPlacedBet(false);

        const stakeAmount = settings.betAmount || betAmount || 0.1;
        void settleMinesRound({
          betAmount: stakeAmount,
          payoutAmount: 0,
          hitMine: true,
          revealedTiles: revealedIndicesRef.current.length,
        }).catch(() => {});

        // Reset game state for mine hit
        const resetAfterMine = () => {
          setGameOver(true);
          setMultiplier(1.0);
          setProfit(0);
          revealAll();

          // Mark game as completed to prevent auto-restart
          isCashoutCompleteRef.current = true;

          // Force parent component to update immediately
          if (onGameStatusChange) {
            onGameStatusChange({ isPlaying: false, hasPlacedBet: false });
          }

          // Notify parent about game completion
          if (onGameComplete) {
            onGameComplete({
              mines: minesCount,
              betAmount: betAmount,
              won: false,
              payout: 0,
              multiplier: 0
            });
          }
        };

        // Use setTimeout to ensure state updates happen properly
        setTimeout(resetAfterMine, 50);
      } else if (grid[row][col].isDiamond) {
        playSound('gem');
        const tileIndex = row * gridSize + col;
        if (!revealedIndicesRef.current.includes(tileIndex)) {
          revealedIndicesRef.current = [...revealedIndicesRef.current, tileIndex];
        }

        setRevealedCount(prev => {
          const newCount = prev + 1;

          // Allow higher multipliers for high mine counts
          const maxTiles = minesCount >= 20 ? safeTiles : 15;
          if (newCount <= maxTiles) {
            const newMultiplier = calculateNextMultiplier(prev);
            setMultiplier(newMultiplier);
            setProfit(Math.round(betAmount * (newMultiplier - 1)));
          }

          // Check if all safe tiles are revealed
          if (newCount === safeTiles) {
            playSound('win');
            setShowConfetti(true);
            toast.success('Congratulations! You revealed all safe tiles!');
            setTimeout(() => setShowConfetti(false), 5000);

            // Immediately reset critical states
            setIsPlaying(false);
            setHasPlacedBet(false);

            // Reset game state for win
            const resetAfterWin = () => {
              setGameWon(true);
              setMultiplier(1.0);
              setProfit(0);
              revealAll();

              // Mark game as completed to prevent auto-restart
              isCashoutCompleteRef.current = true;

              // Force parent component to update immediately
              if (onGameStatusChange) {
                onGameStatusChange({ isPlaying: false, hasPlacedBet: false });
              }

              // Notify parent about game completion
              if (onGameComplete) {
                onGameComplete({
                  mines: minesCount,
                  betAmount: betAmount,
                  won: true,
                  payout: calculatePayout(),
                  multiplier: multiplier
                });
              }
            };

            // Use setTimeout to ensure state updates happen properly
            setTimeout(resetAfterWin, 50);
          }

          return newCount;
        });
      }
    }, 200);

    setGrid(newGrid);
  };

  // Cashout function
  const cashout = async () => {
    if (cashoutInProgressRef.current) return;

    const activeRevealed = revealedCountRef.current || revealedCount;
    const playing = isPlayingRef.current || isPlaying;
    const activeMultiplier = multiplierRef.current || multiplier;

    if (!playing || gameOverRef.current || gameWonRef.current || activeRevealed === 0) return;

    const currentBetAmount = settings.betAmount || betAmount || 0.1;
    const payout = currentBetAmount * activeMultiplier;

    // Lock immediately — before any async work or React re-render
    cashoutInProgressRef.current = true;
    isPlayingRef.current = false;
    setIsCashingOut(true);
    setIsPlaying(false);
    setHasPlacedBet(false);

    if (onGameStatusChange) {
      onGameStatusChange({ isPlaying: false, hasPlacedBet: false });
    }

    try {
      playSound('cashout');

      const settled = await settleMinesRound({
        betAmount: currentBetAmount,
        payoutAmount: payout,
        hitMine: false,
        revealedTiles: activeRevealed,
      });

      if (!settled.ok) {
        toast.error(settled.error || 'Could not credit winnings');
      } else {
        const credited = settled.payoutAmountNative ?? payout;
        toast.success(`Cashed out: ${Number(credited).toFixed(4)} ${symbol} (${activeMultiplier.toFixed(2)}x)`);
      }

      if (activeMultiplier > 1.5) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      const resetGameState = () => {
        setGameWon(false);
        setGameOver(false);
        revealedCountRef.current = 0;
        setRevealedCount(0);
        multiplierRef.current = 1;
        setMultiplier(1.0);
        setProfit(0);
        setAutoRevealInProgress(false);
        setIsStartingGame(false);
        setIsCashingOut(false);
        isCashoutCompleteRef.current = true;

        const resetGrid = initializeGrid(minesCount);
        gridRef.current = resetGrid;
        setGrid(resetGrid);

        if (onGameComplete) {
          onGameComplete({
            mines: minesCount,
            betAmount: currentBetAmount,
            won: true,
            payout,
            multiplier: activeMultiplier,
          });
        }
      };

      setTimeout(resetGameState, 50);
    } catch (error) {
      console.error('Error cashing out:', error);
      toast.error(`Cashout failed: ${error.message}`);
      cashoutInProgressRef.current = false;
      isPlayingRef.current = true;
      setIsCashingOut(false);
      setIsPlaying(true);
      setHasPlacedBet(true);
      if (onGameStatusChange) {
        onGameStatusChange({ isPlaying: true, hasPlacedBet: true });
      }
    }
  };

  const clearAutoRevealTimers = () => {
    autoRevealTimersRef.current.forEach((id) => clearTimeout(id));
    autoRevealTimersRef.current = [];
  };

  const scheduleAutoReveal = (fn, ms) => {
    const id = setTimeout(fn, ms);
    autoRevealTimersRef.current.push(id);
    return id;
  };

  startAutoRevealRef.current = (tileCount) => {
    clearAutoRevealTimers();
    const runId = ++autoRevealRunIdRef.current;
    setAutoRevealInProgress(true);

    const bs = { ...defaultSettings, ...betSettingsRef.current };
    const activeMines = Number(bs.mines) || 5;
    const activeSafeTiles = gridSize * gridSize - activeMines;
    const requestedTiles = Number(tileCount) || Number(bs.tilesToReveal) || 5;
    const maxTiles = Math.min(
      requestedTiles,
      activeMines >= 20 ? activeSafeTiles : Math.min(15, activeSafeTiles),
    );

    if (maxTiles <= 0 || !gridRef.current.length) {
      setAutoRevealInProgress(false);
      return;
    }

    const tileDelay = bs.aiAssist ? 160 + Math.random() * 90 : 85;
    let revealed = 0;
    const stakeAmount = Number(bs.betAmount) || Number(betAmount) || 0.1;

    const pickRandomCell = () => {
      const unrevealed = [];
      gridRef.current.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (!cell.isRevealed) {
            unrevealed.push([rowIndex, colIndex]);
          }
        });
      });
      if (!unrevealed.length) return null;
      return unrevealed[Math.floor(Math.random() * unrevealed.length)];
    };

    const revealOneSync = (row, col) => {
      const cell = gridRef.current[row]?.[col];
      if (!cell || cell.isRevealed) return { ok: false };

      const newGrid = gridRef.current.map((r) => r.map((c) => ({ ...c })));
      newGrid[row][col].isRevealed = true;
      gridRef.current = newGrid;
      setGrid(newGrid);
      playSound('click');

      if (cell.isBomb) {
        playSound('explosion');
        return { ok: true, hitMine: true };
      }

      playSound('gem');
      const newCount = revealedCountRef.current + 1;
      revealedCountRef.current = newCount;
      setRevealedCount(newCount);

      const ladder = buildMinesMultiplierRows(activeMines, gridSize);
      const ladderRow = ladder.find((r) => r.tiles === newCount);
      if (ladderRow) {
        multiplierRef.current = ladderRow.multiplier;
        setMultiplier(ladderRow.multiplier);
        setProfit(Math.round(stakeAmount * (ladderRow.multiplier - 1)));
      }

      return { ok: true, hitMine: false, allSafe: newCount >= activeSafeTiles };
    };

    const finishMineHit = () => {
      setAutoRevealInProgress(false);
      clearAutoRevealTimers();
      toast.error('Game Over! You hit a mine!');

      isPlayingRef.current = false;
      setIsPlaying(false);
      setHasPlacedBet(false);
      gameOverRef.current = true;
      setGameOver(true);
      multiplierRef.current = 1;
      setMultiplier(1.0);
      setProfit(0);

      void settleMinesRound({
        betAmount: stakeAmount,
        payoutAmount: 0,
        hitMine: true,
        revealedTiles: revealedCountRef.current,
      }).catch(() => {});

      const allRevealed = gridRef.current.map((row) =>
        row.map((cell) => ({ ...cell, isRevealed: true })),
      );
      gridRef.current = allRevealed;
      setGrid(allRevealed);
      isCashoutCompleteRef.current = true;

      if (onGameStatusChange) {
        onGameStatusChange({ isPlaying: false, hasPlacedBet: false });
      }
      if (onGameComplete) {
        onGameComplete({
          mines: activeMines,
          betAmount: stakeAmount,
          won: false,
          payout: 0,
          multiplier: 0,
        });
      }
    };

    const step = () => {
      if (runId !== autoRevealRunIdRef.current) return;
      if (!isPlayingRef.current || gameOverRef.current || gameWonRef.current) {
        setAutoRevealInProgress(false);
        return;
      }

      const pick = pickRandomCell();
      if (!pick) {
        setAutoRevealInProgress(false);
        return;
      }

      const [row, col] = pick;
      const result = revealOneSync(row, col);
      if (!result.ok) {
        scheduleAutoReveal(step, tileDelay);
        return;
      }

      if (result.hitMine) {
        finishMineHit();
        return;
      }

      revealed += 1;

      if (result.allSafe || revealed >= maxTiles) {
        setAutoRevealInProgress(false);
        scheduleAutoReveal(() => cashout(), 80);
        return;
      }

      scheduleAutoReveal(step, tileDelay);
    };

    scheduleAutoReveal(step, 50);
  };

  // Reveal all cells (game over)
  const revealAll = () => {
    const newGrid = grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isRevealed: true,
      }))
    );
    setGrid(newGrid);
  };

  // Reset the game
  const resetGame = () => {
    playSound('click');

    // Update the processed settings ref when manually resetting
    processedSettingsRef.current = null;

    setIsPlaying(false);
    setGameOver(false);
    setGameWon(false);
    setGrid(initializeGrid(minesCount));
    setMultiplier(1.0);
    setProfit(0);
    setRevealedCount(0);
    setAutoRevealInProgress(false);
    setShowConfetti(false);
    setIsStartingGame(false);
    cashoutInProgressRef.current = false;
    setIsCashingOut(false);

    // Reset hasPlacedBet to allow user to go back to the form
    setHasPlacedBet(false);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Toggle game info
  const toggleGameInfo = () => {
    setIsGameInfoVisible(!isGameInfoVisible);
  };

  const adjustMinesCount = (delta) => {
    if (isPlaying || hasPlacedBet) return;

    // For 5x5 grid, allow up to 24 mines (with 1 safe tile)
    const newCount = Math.max(1, Math.min(minesCount + delta, 24));
    setMinesCount(newCount);
  };

  // Cell content renderer
  const getCellContent = (cell, canPlay) => {
    if (!cell.isRevealed) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          {canPlay ? (
            <div className="h-2 w-2 rounded-full bg-purple-400/50 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          ) : (
            <FaRegGem className="text-white/10 text-lg md:text-xl" aria-hidden />
          )}
        </div>
      );
    }

    if (cell.isBomb) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src={MINE_SPRITES[cell.spriteIndex % MINE_SPRITES.length]}
            alt="Mine"
            width={64}
            height={64}
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
        </div>
      );
    }

    if (cell.isDiamond) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src={GEM_SPRITES[cell.spriteIndex % GEM_SPRITES.length]}
            alt="Gem"
            width={64}
            height={64}
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Audio elements */}
      {Object.entries(SOUNDS).map(([key, src]) => (
        <audio key={key} ref={audioRefs[key]} src={src} preload="auto" />
      ))}

      {/* Confetti animation for wins */}
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}

      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover theme="dark" />

      <MinesHowToModal
        open={isGameInfoVisible}
        onClose={() => setIsGameInfoVisible(false)}
        totalTiles={totalTiles}
        minesHouseEdgePct={minesHouseEdgePct}
      />

      {/* Game Header */}
      <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center space-x-3">
          <button
            className="p-2 rounded-full bg-purple-900/20 hover:bg-purple-900/40 transition-colors"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ?
              <HiOutlineVolumeOff className="text-white/70 text-xl" /> :
              <HiOutlineVolumeUp className="text-white/70 text-xl" />
            }
          </button>

          <button
            className="p-2 rounded-full bg-blue-900/20 hover:bg-blue-900/40 transition-colors"
            onClick={toggleGameInfo}
            title="Game Info"
          >
            <HiOutlineInformationCircle className="text-white/70 text-xl" />
          </button>
        </div>

        <div className="flex items-center">
          <div className="text-sm text-white/70 mr-2">Mines:</div>
          <div className="flex items-center bg-gray-900/50 rounded overflow-hidden">
            <button
              className="px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-white disabled:opacity-50"
              onClick={() => adjustMinesCount(-1)}
              disabled={isPlaying || hasPlacedBet || minesCount <= 1}
            >
              -
            </button>
            <div className="px-3 py-1 font-medium text-white">
              {minesCount}
            </div>
            <button
              className="px-2 py-1 bg-green-900/30 hover:bg-green-900/50 text-white disabled:opacity-50"
              onClick={() => adjustMinesCount(1)}
              disabled={isPlaying || hasPlacedBet || minesCount >= 24}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="w-full grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-900/50 rounded p-2 text-center">
          <div className="text-xs text-white/50 mb-1">Chance of Mine</div>
          <div className={`text-lg font-bold ${calculateMineChance() > 50 ? 'text-red-400' : 'text-white'}`}>
            {calculateMineChance()}%
          </div>
        </div>

        <div className="bg-gray-900/50 rounded p-2 text-center">
          <div className="text-xs text-white/50 mb-1">
            Multiplier
            {minesHouseEdgePct > 0 && (
              <span className="ml-1 text-[10px] text-white/35" title={`House edge ${minesHouseEdgePct.toFixed(1)}%`}>
                · edge {minesHouseEdgePct.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-lg font-bold text-yellow-400">
            {multiplier.toFixed(2)}x
          </div>
        </div>

        <div className="bg-gray-900/50 rounded p-2 text-center">
          <div className="text-xs text-white/50 mb-1">Profit</div>
          <div className={`text-lg font-bold ${profit > 0 ? 'text-green-400' : 'text-white'}`}>
            {profit > 0 ? '+' : ''}{profit}
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="relative w-full mb-3 mx-auto max-w-md">
        {!isPlaying && !hasPlacedBet && showIdleHint && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-purple-500/25 bg-purple-950/40 px-3 py-2.5 text-sm"
          >
            <span className="text-white/75">
              Set bet &amp; mines in the panel, then <span className="text-purple-300 font-medium">Start Game</span>
            </span>
            <button
              type="button"
              onClick={() => setShowIdleHint(false)}
              className="shrink-0 text-white/40 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-white/10"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        <div
          className={`grid gap-1.5 w-full ${!isPlaying && !hasPlacedBet ? 'opacity-95' : ''}`}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const canPlay = isPlaying && !cell.isRevealed && !gameOver && !gameWon;
              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    aspect-square flex items-center justify-center rounded-xl
                    ${cell.isRevealed
                      ? cell.isBomb
                        ? 'bg-gradient-to-br from-red-900/80 to-red-950/90 border-red-500/40'
                        : 'bg-gradient-to-br from-cyan-900/40 to-blue-900/50 border-cyan-500/30'
                      : cell.isHovered && canPlay
                        ? 'bg-purple-800/40 border-purple-400/50'
                        : canPlay
                          ? 'bg-gradient-to-br from-[#1a1028] to-[#12081c] border-purple-500/35 hover:border-purple-400/60'
                          : 'bg-gradient-to-br from-[#141018] to-[#0c080f] border-white/8'
                    }
                    ${canPlay ? 'cursor-pointer' : 'cursor-default'}
                    transition-colors duration-150 border shadow-md
                  `}
                  onClick={() => canPlay && revealCell(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellHover(rowIndex, colIndex, true)}
                  onMouseLeave={() => handleCellHover(rowIndex, colIndex, false)}
                  disabled={!canPlay}
                  whileHover={{ scale: canPlay ? 1.04 : 1 }}
                  whileTap={{ scale: canPlay ? 0.96 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {getCellContent(cell, canPlay)}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Game Controls */}
      <div className="w-full space-y-2">
        {/* Remove the Start Game button from here - it should only be in the left panel */}

        {/* Cashout button - only show when game is actively being played */}
        {hasPlacedBet && isPlaying && !gameOver && !gameWon && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={cashout}
              disabled={revealedCount === 0 || isCashingOut}
              className={`w-full py-3 ${revealedCount > 0 && !isCashingOut
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                : 'bg-gray-700 cursor-not-allowed opacity-70'
                } rounded-lg text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2`}
            >
              <FaCoins className="text-yellow-300" />
              <span>{isCashingOut ? 'CASHING OUT…' : `CASH OUT (${calculatePayout()} ${symbol})`}</span>
            </button>
          </div>
        )}

        {/* Win message - shown when game is won */}
        {gameWon && (
          <div className="text-center py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white font-bold">
            <span>🎉 CONGRATULATIONS! YOU WON! 🎉</span>
            <div className="mt-2 text-sm opacity-90">
              Winnings: {calculatePayout()} {symbol} ({multiplier.toFixed(2)}x)
            </div>
          </div>
        )}

        {/* Game result message */}
        {(gameOver || gameWon) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-1.5 rounded-lg ${gameWon ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              } font-bold`}
          >
            {gameWon ? 'Congratulations! You won!' : 'Game Over! You hit a mine!'}
          </motion.div>
        )}
      </div>

      {/* Multiplier ladder */}
      <div className="w-full mt-2">
        <h3 className="text-white/90 text-sm font-medium mb-2 flex items-center justify-between">
          <span className="flex items-center">
            <GiCrystalGrowth className="mr-2 text-blue-400" />
            Multiplier ladder
          </span>
          <span className="text-[10px] text-white/40 font-normal">{minesCount} mines</span>
        </h3>
        <div className="relative">
          <div className="bg-black/40 p-3 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a060c] to-transparent z-10 pointer-events-none rounded-l-xl" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a060c] to-transparent z-10 pointer-events-none rounded-r-xl" />

            <div className="overflow-x-auto pb-1 scrollbar-thin">
              <div className="flex gap-3 min-w-max">
                {multiplierTable.map((item, index) => (
                  <div
                    key={index}
                    className={`min-w-[95px] p-2.5 text-center rounded-lg ${item.tiles === revealedCount
                      ? 'bg-gradient-to-br from-purple-700 to-purple-600 text-white font-bold shadow-lg shadow-purple-700/50 border-2 border-purple-500/80'
                      : 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-white/90 hover:bg-gray-700/90 transition-colors shadow-md border border-gray-700/50'
                      }`}
                  >
                    <div className="text-xs font-medium mb-1">{item.tiles} Tiles</div>
                    <div className="text-xl font-semibold">{item.multiplier.toFixed(2)}x</div>
                  </div>
                ))}
              </div>
            </div>

            {safeTiles === 1 ? (
              <div className="text-xs text-center text-yellow-400 font-medium mt-3">
                Only 1 safe tile — up to{' '}
                {buildMinesMultiplierRows(minesCount, gridSize)[0]?.multiplier?.toFixed(2) ?? '25.00'}× multiplier!
              </div>
            ) : multiplierTable.length > 6 && (
              <div className="text-xs text-center text-white/80 mt-3 flex items-center justify-center gap-2">
                <FaArrowLeft className="text-purple-400" />
                <span>Swipe to see more multipliers</span>
                <FaArrowRight className="text-purple-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
