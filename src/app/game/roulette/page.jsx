"use client";
import React, { useState, useReducer, useMemo, useEffect, useRef, useCallback } from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { ThemeProvider, styled, createTheme } from "@mui/material/styles";
import ClearIcon from "@mui/icons-material/Clear";
import UndoIcon from "@mui/icons-material/Undo";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import TextFieldCurrency from "@/components/TextFieldCurrency";
import Button from "@/components/Button";
import { muiStyles } from "./styles";
import Image from "next/image";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import { useToken } from "@/hooks/useToken";

import useWalletStatus from '@/hooks/useWalletStatus';
import { useGameLogger } from '@/hooks/useGameLogger';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { usePlayBalance } from '@/hooks/usePlayBalance';

import { FaVolumeMute, FaVolumeUp, FaChartLine, FaCoins, FaTrophy, FaDice, FaBalanceScale, FaRandom, FaPercentage, FaPlayCircle } from "react-icons/fa";
import { GiCardRandom, GiDiceTarget, GiRollingDices, GiPokerHand } from "react-icons/gi";
import { motion } from "framer-motion";
import RouletteLeaderboard from './components/RouletteLeaderboard';
import StrategyGuide from './components/StrategyGuide';
import RouletteGameIntro from './components/RouletteGameIntro';
import RoulettePayout from './components/RoulettePayout';
import WinProbabilities from './components/WinProbabilities';
import RouletteHistory from './components/RouletteHistory';
import { RouletteInfoTriggers, RouletteInfoDialog } from './components/RouletteInfoPanel';
import { useSelector, useDispatch } from 'react-redux';
import { setBalance } from '@/store/balanceSlice';
import { aptosClient, CASINO_MODULE_ADDRESS, parseAptAmount, CasinoGames } from '@/lib/aptos';
import { houseEdgePercent } from '@/lib/houseEdge';
import { useGameStats } from '@/hooks/useGameStats';
import { useProvableFairness } from '@/hooks/useProvableFairness';
import { deriveRouletteOutcome } from '@/lib/provablyFair/solanaFairness';
import { formatNativeAmount } from '@/lib/chains/registry';
import { calculateRouletteRoundResult } from '@/lib/client/roulettePayout';
import {
  loadRouletteBetHistory,
  saveRouletteBetHistory,
  fetchRouletteBetHistoryFromServer,
} from '@/lib/client/rouletteBetHistory';
import { buildInsufficientBalanceAlert, isInsufficientBalanceAlert } from '@/lib/client/playFeedback';
import { computeRouletteSessionStats } from '@/lib/client/rouletteStats';
import {
  DEFAULT_GAME_BET,
  getGameBetPreference,
  setGameBetPreference,
} from '@/lib/client/gameBetPreference';
import PlayBalanceAlert from '@/components/play/PlayBalanceAlert';


// Aptos wallet integration will be added here

const enhancedTooltip = {
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(5px)',
    padding: '8px 12px',
    fontSize: '0.85rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
  }
};

const BetType = {
  NUMBER: 0,    // Single number (35:1) - bahsinizi 36'ya katlar
  COLOR: 1,     // Red/Black (1:1) - bahsinizi 2'ye katlar
  ODDEVEN: 2,   // Odd/Even (1:1) - bahsinizi 2'ye katlar
  HIGHLOW: 3,   // 1-18/19-36 (1:1) - bahsinizi 2'ye katlar
  DOZEN: 4,     // 1-12, 13-24, 25-36 (2:1) - bahsinizi 3'e katlar
  COLUMN: 5,    // First, Second, Third column (2:1) - bahsinizi 3'e katlar
  SPLIT: 6,     // Two adjacent numbers (17:1) - bahsinizi 18'e katlar
  STREET: 7,    // Three numbers horizontal (11:1) - bahsinizi 12'ye katlar
  CORNER: 8,    // Four numbers (8:1) - bahsinizi 9'a katlar
  LINE: 9       // Six numbers (5:1) - bahsinizi 6'ya katlar
};

// Bet payout multipliers - Doğru payout mantığı ile
// Payout = bahsinizi kaç katına çıkarır (1:1 = 2x, 2:1 = 3x, 35:1 = 36x)
const BetPayouts = {
  [BetType.NUMBER]: 36,    // 35:1 - bahsinizi 36'ya katlar
  [BetType.COLOR]: 2,      // 1:1 - bahsinizi 2'ye katlar
  [BetType.ODDEVEN]: 2,    // 1:1 - bahsinizi 2'ye katlar
  [BetType.HIGHLOW]: 2,    // 1:1 - bahsinizi 2'ye katlar
  [BetType.DOZEN]: 3,      // 2:1 - bahsinizi 3'e katlar
  [BetType.COLUMN]: 3,     // 2:1 - bahsinizi 3'e katlar
  [BetType.SPLIT]: 18,     // 17:1 - bahsinizi 18'e katlar
  [BetType.STREET]: 12,    // 11:1 - bahsinizi 12'ye katlar
  [BetType.CORNER]: 9,     // 8:1 - bahsinizi 9'a katlar
  [BetType.LINE]: 6        // 5:1 - bahsinizi 6'ya katlar
};


function BetBox({ betValue = 0, betType = "", position = "top-right", ...props }) {
  // Calculate position based on the position prop
  const getPosition = () => {
    switch (position) {
      case "top-right":
        return { top: "25%", left: "75%" };
      case "top-left":
        return { top: "25%", left: "25%" };
      case "bottom-right":
        return { top: "75%", left: "75%" };
      case "bottom-left":
        return { top: "75%", left: "25%" };
      default:
        return { top: "25%", left: "75%" }; // Default to top-right
    }
  };

  return (
    <Tooltip
      title={
        <Typography>
          {betType}: {betValue}
        </Typography>
      }
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: enhancedTooltip.tooltip
        }
      }}
    >
      <Box
        sx={{
          position: "absolute",
          ...getPosition(),
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 215, 0, 0.9)",
          border: "2px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
          "&:hover": {
            transform: "translate(-50%, -50%) scale(1.1)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
          },
        }}
        {...props}
      >
        <Typography
          sx={{
            fontSize: "13px",
            color: "black",
            fontWeight: "bold",
            textShadow: "0 0 2px rgba(255,255,255,0.5)",
          }}
        >
          {betValue}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function GridInside({
  insideNumber = -1, // must define this
  topEdge = false,
  red = false,
  straightup = 0,
  splitleft = 0,
  splitbottom = 0,
  corner = 0,
  placeBet,
  isWinner = false,
  ...props
}) {
  // Get corner bet numbers from predefined map
  const getCornerNumbers = () => {
    // Predefined corner positions for all numbers
    // FIXED: Correct corner values based on actual roulette table layout
    const cornerMap = {
      2: "0,1,2",        // Middle-left corner
      5: "1,2,4,5",      // Middle-left corner
      8: "4,5,7,8",      // Middle-left corner
      11: "7,8,10,11",   // Middle-left corner - FIXED
      14: "10,11,13,14", // Middle-left corner - FIXED
      17: "13,14,16,17", // Middle-left corner - FIXED
      20: "16,17,19,20", // Middle-left corner
      23: "19,20,22,23", // Middle-left corner - FIXED
      26: "22,23,25,26", // Middle-left corner
      29: "25,26,28,29", // Middle-left corner
      32: "28,29,31,32", // Middle-left corner
      35: "31,32,33,35", // Middle-right corner

      3: "2,3,0",        // Top-left corner
      6: "2,3,5,6",      // Top-left corner
      9: "5,6,8,9",      // Top-left corner
      12: "8,9,11,12",   // Top-left corner
      15: "11,12,14,15", // Top-left corner - FIXED
      18: "14,15,17,18", // Top-left corner
      21: "17,18,20,21", // Top-left corner
      24: "20,21,23,24", // Top-left corner
      27: "23,24,26,27", // Top-left corner
      30: "26,27,29,30", // Top-left corner
      33: "29,30,32,33", // Top-left corner
      36: "32,33,35,36"  // Top-right corner
    };

    const cornerNumbers = cornerMap[insideNumber];
    if (cornerNumbers) {
      return `Corner ${cornerNumbers.replace(/,/g, '-')}`;
    }
    return `Corner ${insideNumber}`;
  };

  // Get split bet numbers from predefined map
  const getSplitNumbers = () => {
    // Predefined split positions for all numbers
    const splitMap = {
      // Left splits (n, n-3) - including 1,2,3 with 0
      1: "0,1",      // Bottom-left split with 0
      2: "0,2",      // Middle-left split with 0
      3: "0,3",      // Top-left split with 0

      4: "1,4",      // Bottom-left split
      7: "4,7",      // Bottom-left split
      10: "7,10",    // Bottom-left split
      13: "10,13",   // Bottom-left split
      16: "13,16",   // Bottom-left split
      19: "16,19",   // Bottom-left split
      22: "19,22",   // Bottom-left split
      25: "22,25",   // Bottom-left split
      28: "25,28",   // Bottom-left split
      31: "28,31",   // Bottom-left split
      34: "31,34",   // Bottom-left split

      5: "2,5",      // Middle-left split
      8: "5,8",      // Middle-left split
      11: "8,11",    // Middle-left split
      14: "11,14",   // Middle-left split
      17: "14,17",   // Middle-left split
      20: "17,20",   // Middle-left split
      23: "20,23",   // Middle-left split
      26: "23,26",   // Middle-left split
      29: "26,29",   // Middle-left split
      32: "29,32",   // Middle-left split
      35: "32,35",   // Middle-left split

      6: "3,6",      // Top-left split
      9: "6,9",      // Top-left split
      12: "9,12",    // Top-left split
      15: "12,15",   // Top-left split
      18: "15,18",   // Top-left split
      21: "18,21",   // Top-left split
      24: "21,24",   // Top-left split
      27: "24,27",   // Top-left split
      30: "27,30",   // Top-left split
      33: "30,33",   // Top-left split
      36: "33,36"    // Top-left split
    };

    const splitNumbers = splitMap[insideNumber];
    if (splitNumbers) {
      // Show only the numbers, not the split number
      return `Split ${splitNumbers.replace(',', '-')}`;
    }
    return `Split ${insideNumber}`;
  };

  // Get bottom bet numbers - can be either street bet or bottom split bet
  const getBottomBetNumbers = () => {
    const isBottomRow = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(insideNumber);
    const isMiddleRow = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(insideNumber);
    const isTopRow = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(insideNumber);

    if (isBottomRow) {
      // Bottom row: street bet [n, n+1, n+2]
      const streetNumbers = [insideNumber, insideNumber + 1, insideNumber + 2];
      return `Street ${streetNumbers.join('-')}`;
    } else {
      // Middle/Top row: bottom split bet - use predefined values
      const bottomSplitMap = {
        2: "1,2",      // Split 2: 1,2
        3: "2,3",      // Split 3: 2,3
        5: "4,5",      // Split 5: 4,5
        6: "5,6",      // Split 6: 5,6
        8: "7,8",      // Split 8: 7,8
        9: "8,9",      // Split 9: 8,9
        11: "10,11",   // Split 11: 10,11
        12: "11,12",   // Split 12: 11,12
        14: "13,14",   // Split 14: 13,14
        15: "14,15",   // Split 15: 14,15
        17: "16,17",   // Split 17: 16,17
        18: "17,18",   // Split 18: 17,18
        20: "19,20",   // Split 20: 19,20
        21: "20,21",   // Split 21: 20,21
        23: "22,23",   // Split 23: 22,23
        24: "23,24",   // Split 24: 23,24
        26: "25,26",   // Split 26: 25,26
        27: "26,27",   // Split 27: 26,27
        29: "28,29",   // Split 29: 28,29
        30: "29,30",   // Split 30: 29,30
        32: "31,32",   // Split 32: 31,32
        33: "32,33",   // Split 33: 32,33
        35: "34,35",   // Split 35: 34,35 - Changed from street to split
        36: "35,36"    // Split 36: 35,36 - Changed from street to split
      };

      const splitNumbers = bottomSplitMap[insideNumber];
      if (splitNumbers) {
        return `Split ${splitNumbers.replace(',', '-')}`;
      }

      // Fallback to old calculation if not in map
      const bottomNumber = insideNumber + 3;
      return `Split ${insideNumber}-${bottomNumber}`;
    }
  };

  // Get horizontal split bet numbers from predefined map
  const getHorizontalSplitNumbers = () => {
    // Predefined horizontal split positions for all numbers
    const horizontalSplitMap = {
      // Horizontal splits (n, n+1) - same row - FIXED VALUES
      2: "1,2",      // Split 2: 1,2
      3: "2,3",      // Split 3: 2,3
      5: "4,5",      // Split 5: 4,5
      6: "5,6",      // Split 6: 5,6
      8: "7,8",      // Split 8: 7,8
      9: "8,9",      // Split 9: 8,9
      11: "10,11",   // Split 11: 10,11
      12: "11,12",   // Split 12: 11,12
      14: "13,14",   // Split 14: 13,14
      15: "14,15",   // Split 15: 14,15
      17: "16,17",   // Split 17: 16,17
      18: "17,18",   // Split 18: 17,18
      20: "19,20",   // Split 20: 19,20
      21: "20,21",   // Split 21: 20,21
      23: "22,23",   // Split 23: 22,23
      24: "23,24",   // Split 24: 23,24
      26: "25,26",   // Split 26: 25,26
      27: "26,27",   // Split 27: 26,27
      29: "28,29",   // Split 29: 28,29
      30: "29,30",   // Split 30: 29,30
      32: "31,32",   // Split 32: 31,32
      33: "32,33",   // Split 33: 32,33
      35: "34,35",   // Split 35: 34,35
      36: "35,36"    // Split 36: 35,36
    };

    const horizontalSplitNumbers = horizontalSplitMap[insideNumber];
    if (horizontalSplitNumbers) {
      // Show only the numbers, not the split number
      return `Split ${horizontalSplitNumbers.replace(',', '-')}`;
    }
    return `Split ${insideNumber}`;
  };

  return (
    <ParentSize {...props}>
      {({ width }) => (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "stretch",
            width: width,
            height: topEdge ? width + 10 : width,
            ...(red && { backgroundColor: (theme) => theme.palette.game.red }),
            ...(isWinner && {
              boxShadow: "0 0 15px 5px rgba(255, 215, 0, 0.7)",
              zIndex: 3,
            }),
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
              zIndex: 2
            }
          }}
        >
          <Box
            sx={{ display: "flex", flexDirection: "column", width: "10px" }}
            id="left-edge"
          >
            {topEdge && (
              <Box
                sx={{
                  height: "10px",
                  backgroundColor: (theme) => theme.palette.dark.card,
                }}
              ></Box>
            )}
            <Box
              sx={{
                position: "relative",
                flex: 1,
                backgroundColor: (theme) => theme.palette.dark.card,
                cursor: "pointer",
              }}
              id="left-split-bet"
              onClick={(e) => placeBet(e, "inside", (insideNumber - 1) * 4 + 2)}
            >
              {splitleft > 0 && (
                <BetBox
                  betValue={splitleft}
                  betType={getSplitNumbers()}
                  position="top-right"
                  onClick={(e) =>
                    placeBet(e, "inside", (insideNumber - 1) * 4 + 2)
                  }
                />
              )}
            </Box>
            {(() => {
              // Only show corner bet if this number has a corner definition
              const cornerMap = {
                2: "0,1,2",        // Middle-left corner
                5: "1,2,4,5",      // Middle-left corner
                8: "4,5,7,8",      // Middle-left corner
                11: "7,8,10,11",   // Middle-left corner - FIXED
                14: "10,11,13,14", // Middle-left corner - FIXED
                17: "13,14,16,17", // Middle-left corner - FIXED
                20: "16,17,19,20", // Middle-left corner
                23: "19,20,22,23", // Middle-left corner - FIXED
                26: "22,23,25,26", // Middle-left corner
                29: "25,26,28,29", // Middle-left corner
                32: "28,29,31,32", // Middle-left corner
                35: "31,32,33,35", // Middle-right corner

                3: "2,3,0",        // Top-left corner
                6: "2,3,5,6",      // Top-left corner
                9: "5,6,8,9",      // Top-left corner
                12: "8,9,11,12",   // Top-left corner
                15: "11,12,14,15", // Top-left corner - FIXED
                18: "14,15,17,18", // Top-left corner
                21: "17,18,20,21", // Top-left corner
                24: "20,21,23,24", // Top-left corner
                27: "23,24,26,27", // Top-left corner
                30: "26,27,29,30", // Top-left corner
                33: "29,30,32,33", // Top-left corner
                36: "32,33,35,36"  // Top-right corner
              };

              // Only render corner bet area if this number has a corner definition
              if (cornerMap[insideNumber]) {
                return (
                  <Box
                    sx={{
                      position: "relative",
                      height: "10px",
                      backgroundColor: (theme) => theme.palette.dark.card,
                      cursor: "pointer",
                    }}
                    id="left-corner-bet"
                    onClick={(e) => placeBet(e, "inside", (insideNumber - 1) * 4 + 4)}
                  >
                    {corner > 0 && (
                      <BetBox
                        betValue={corner}
                        betType={getCornerNumbers()}
                        position="bottom-right"
                        onClick={(e) =>
                          placeBet(e, "inside", (insideNumber - 1) * 4 + 4)
                        }
                      />
                    )}
                  </Box>
                );
              }
              return null; // Don't render corner bet area for bottom row numbers
            })()}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {topEdge && (
              <Box
                sx={{
                  height: "10px",
                  backgroundColor: (theme) => theme.palette.dark.card,
                }}
              ></Box>
            )}
            <Box
              sx={{
                position: "relative",
                flex: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
              }}
              id="straight-bet"
              onClick={(e) => placeBet(e, "inside", (insideNumber - 1) * 4 + 1)}
            >
              <Typography
                variant="h5"
                sx={{
                  position: "relative",
                  zIndex: 4,
                  textShadow: "0 0 4px rgba(0,0,0,0.8)",
                  fontWeight: "bold",
                  backgroundColor: "rgba(0,0,0,0.4)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  transform: "translateX(-10%)", // Slight offset to avoid chip overlap
                }}
              >
                {insideNumber}
              </Typography>
              {straightup > 0 && (
                <BetBox
                  betValue={straightup}
                  betType={"Straight up"}
                  position="top-right"
                  onClick={(e) =>
                    placeBet(e, "inside", (insideNumber - 1) * 4 + 1)
                  }
                />
              )}
            </Box>
            <Box
              sx={{
                position: "relative",
                flex: 1,
                backgroundColor: (theme) => theme.palette.dark.card,
                maxHeight: "10px",
                minHeight: "10px",
                cursor: "pointer",
              }}
              id="bottom-split-bet"
              onClick={(e) => placeBet(e, "inside", (insideNumber - 1) * 4 + 3)}
            >
              {splitbottom > 0 && (
                <BetBox
                  betValue={splitbottom}
                  betType={getBottomBetNumbers()}
                  position="bottom-right"
                  onClick={(e) =>
                    placeBet(e, "inside", (insideNumber - 1) * 4 + 3)
                  }
                />
              )}
            </Box>
          </Box>

        </Box>
      )}
    </ParentSize>
  );
}

function GridZero({ inside, placeBet, ...props }) {
  return (
    <ParentSize {...props}>
      {({ width, height }) => (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: width,
            height: height,
            cursor: "pointer",
            clipPath: "polygon(100% 0%, 100% 100%, 40% 100%, 0% 50%, 40% 0%)",
            backgroundColor: (theme) => theme.palette.game.green,
          }}
          onClick={(e) => placeBet(e, "inside", 0)}
        >
          <Typography variant="h5">0</Typography>
          {inside[0] > 0 && (
            <BetBox
              betValue={inside[0]}
              betType={"Straight up"}
              onClick={(e) => placeBet(e, "inside", 0)}
            />
          )}
        </Box>
      )}
    </ParentSize>
  );
}

function GridColumnBet({
  topCard = false,
  bottomCard = false,
  index,
  columns,
  bet,
  placeBet,
  ...props
}) {
  return (
    <ParentSize style={{ height: "100%" }} {...props}>
      {({ width, height }) => (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: width,
            height: height,
            cursor: "pointer",
            backgroundColor: (theme) => theme.palette.dark.button,
            borderTop: (theme) =>
              `${topCard ? 10 : 5}px solid ${theme.palette.dark.card}`,
            borderBottom: (theme) =>
              `${bottomCard ? 10 : 5}px solid ${theme.palette.dark.card}`,
            borderRight: (theme) => "10px solid " + theme.palette.dark.card,
            borderLeft: (theme) => "10px solid " + theme.palette.dark.card,
          }}
          onClick={(e) => placeBet(e, "columns", index)}
        >
          <Typography variant="h5">2 To 1</Typography>
          {columns[index] > 0 && (
            <BetBox
              betValue={columns[index]}
              betType={`2 To 1 (row ${index + 1})`}
              onClick={(e) => placeBet(e, "columns", index)}
            />
          )}
        </Box>
      )}
    </ParentSize>
  );
}

function GridOutsideBet({ rightCard = false, active = false, ...props }) {
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 2,
        cursor: "pointer",
        backgroundColor: (theme) => theme.palette.dark.button,
        borderBottom: (theme) => "10px solid " + theme.palette.dark.card,
        borderLeft: (theme) => "10px solid " + theme.palette.dark.card,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)"
        }
      }}
      {...props}
    >
      {props.children}
    </Box>
  );
}

const firstThird = [
  { val: 3, red: true },
  { val: 6 },
  { val: 9, red: true },
  { val: 12 },
  { val: 2 },
  { val: 5, red: true },
  { val: 8 },
  { val: 11 },
  { val: 1, red: true },
  { val: 4 },
  { val: 7, red: true },
  { val: 10 },
];
const secondThird = [
  { val: 15 },
  { val: 18, red: true },
  { val: 21, red: true },
  { val: 24 },
  { val: 14, red: true },
  { val: 17 },
  { val: 20 },
  { val: 23, red: true },
  { val: 13 },
  { val: 16, red: true },
  { val: 19, red: true },
  { val: 22 },
];
const thirdThird = [
  { val: 27, red: true },
  { val: 30, red: true },
  { val: 33 },
  { val: 36, red: true },
  { val: 26 },
  { val: 29 },
  { val: 32, red: true },
  { val: 35 },
  { val: 25, red: true },
  { val: 28 },
  { val: 31 },
  { val: 34, red: true },
];

const arrayReducer = (state, action) => {
  switch (action.type) {
    case "reset":
      return new Array(state.length).fill(0);
    case "update":
      let updatedArr = [...state];
      updatedArr[action.ind] = action.val;
      return updatedArr;
    default:
      return state;
  }
};

const eventReducer = (state, action) => {
  switch (action.type) {
    case "reset":
      return [];
    case "update":
      return action.payload;
    default:
      return state;
  }
};
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const notificationSteps = {
  PLACING_BET: 0,
  BET_PLACED: 1,
  GENERATING_VRF: 2,
  RESULT_READY: 3
};

// Add betting statistics tracking
const BettingStats = ({ history, chain = 'solana', symbol = 'SOL' }) => {
  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    const session = computeRouletteSessionStats(history);
    const chipSelections = history.reduce((sum, bet) => sum + (bet.totalBets || 1), 0);

    return {
      winRate: session.winRate.toFixed(1),
      mostCommonNumbers: session.mostCommonResults,
      profitLoss: session.netProfit,
      rounds: session.totalBets,
      chipSelections,
      totalWagered: session.totalWagered,
      roundsWon: session.winCount,
    };
  }, [history]);

  if (!stats) return null;

  const plFormatted = formatNativeAmount(stats.profitLoss, chain);
  const plPrefix = stats.profitLoss > 0 ? '+' : stats.profitLoss < 0 ? '' : '';

  return (
    <Box sx={{
      p: 1.5,
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      background: 'rgba(0,0,0,0.3)'
    }}>
      <Typography variant="subtitle1" color="white" sx={{ mb: 1, fontWeight: 700 }}>Session Statistics</Typography>
      <Grid container spacing={1}>
        <Grid xs={6} md={4}>
          <Typography variant="caption" color="text.secondary">Win Rate</Typography>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{stats.winRate}%</Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.roundsWon}/{stats.rounds} rounds
          </Typography>
        </Grid>
        <Grid xs={6} md={4}>
          <Typography variant="caption" color="text.secondary">Rounds</Typography>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{stats.rounds}</Typography>
          {stats.chipSelections !== stats.rounds && (
            <Typography variant="caption" color="text.secondary">
              {stats.chipSelections} selections
            </Typography>
          )}
        </Grid>
        <Grid xs={6} md={4}>
          <Typography variant="caption" color="text.secondary">P/L</Typography>
          <Typography variant="h6" color={stats.profitLoss >= 0 ? 'success.main' : 'error.main'} sx={{ lineHeight: 1.2 }}>
            {plPrefix}{plFormatted} {symbol}
          </Typography>
        </Grid>

        <Grid xs={12}>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>Hot Numbers</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5 }}>
            {stats.mostCommonNumbers.map((item) => (
              <Box
                key={item.number}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: item.number === 0 ? 'game.green' :
                    [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(item.number) ? 'game.red' : 'dark.bg',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Typography variant="caption" fontWeight="bold">{item.number}</Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Roulette Header Component moved inside the main component

export default function GameRoulette() {
  // Add a ref for scrolling past navbar
  const contentRef = useRef(null);

  // Add development mode flag - set to true to bypass network check
  const [devMode, setDevMode] = useState(false);

  // Add smooth scrolling to the entire document
  useEffect(() => {
    // Apply smooth scrolling to the html element
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      // Clean up when component unmounts
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // Scroll past navbar on initial load
  useEffect(() => {
    const scrollPastNavbar = () => {
      if (contentRef.current) {
        // Add a small delay to ensure DOM is fully loaded
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }, 100);
      }
    };

    scrollPastNavbar();
  }, []);

  // Smooth scroll to element function
  const scrollToElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      // Add offset to account for fixed elements and prevent cutoff
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  // Roulette Header Component inside the main component to access scrollToElement
  const RouletteHeader = () => {
    const { display, loading } = useGameStats('roulette');
    const gameStatistics = {
      totalBets: loading ? '…' : display.totalBets,
      totalVolume: loading ? '…' : display.volume,
      maxWin: loading ? '…' : display.maxWin,
    };
    // European roulette: natural ~2.70% edge from the zero pocket, plus any
    // extra commission configured via NEXT_PUBLIC_HOUSE_EDGE_BPS_ROULETTE.
    const rouletteEdgePct = (2.7 + houseEdgePercent('roulette')).toFixed(2);

    return (
      <div className="site-page-top site-page-pad-x relative mb-6 text-white md:mb-8">
        {/* Background Elements */}
        <div className="absolute top-5 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-28 left-1/3 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 left-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            {/* Left Column - Game Info */}
            <div className="md:w-1/2">
              <div className="flex items-center">
                <div className="mr-3 p-3 bg-gradient-to-br from-red-900/40 to-red-700/10 rounded-lg shadow-lg shadow-red-900/10 border border-red-800/20">
                  <GiRollingDices className="text-3xl text-red-300" />
                </div>
                <div>
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-400 font-sans">Games / Roulette</p>
                    <span className="text-xs px-2 py-0.5 bg-red-900/30 rounded-full text-red-300 font-display">Classic</span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 rounded-full text-green-300 font-display">Live</span>
                  </motion.div>
                  <motion.h1
                    className="text-3xl md:text-4xl font-bold font-display bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    European Roulette
                  </motion.h1>
                </div>
              </div>
              <motion.p
                className="text-white/70 mt-2 max-w-xl font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Place your bets and experience the thrill of the spinning wheel. From simple red/black bets to complex number combinations, the choice is yours.
              </motion.p>

              {/* Game highlights */}
              <motion.div
                className="flex flex-wrap gap-4 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <FaPercentage className="mr-1.5 text-amber-400" />
                  <span className="font-sans">{rouletteEdgePct}% house edge</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <GiPokerHand className="mr-1.5 text-blue-400" />
                  <span className="font-sans">Multiple betting options</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <FaBalanceScale className="mr-1.5 text-green-400" />
                  <span className="font-sans">Provably fair gaming</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats and Controls */}
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/5 rounded-xl p-4 border border-red-800/20 shadow-lg shadow-red-900/10">
                {/* Quick stats in top row */}
                <motion.div
                  className="grid grid-cols-3 gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 mb-1">
                      <FaChartLine className="text-blue-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Total Bets</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.totalBets}</div>
                  </div>

                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600/20 mb-1">
                      <FaCoins className="text-yellow-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Volume</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.totalVolume}</div>
                  </div>

                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/20 mb-1">
                      <FaTrophy className="text-yellow-500" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Max Win</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.maxWin}</div>
                  </div>
                </motion.div>

                {/* Quick actions */}
                <motion.div
                  className="flex flex-wrap justify-between gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <button
                    onClick={() => scrollToElement('strategy')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-800/40 to-red-900/20 rounded-lg text-white font-medium text-sm hover:from-red-700/40 hover:to-red-800/20 transition-all duration-300"
                  >
                    <GiCardRandom className="mr-2" />
                    Strategy Guide
                  </button>
                  <button
                    onClick={() => scrollToElement('payouts')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-800/40 to-blue-900/20 rounded-lg text-white font-medium text-sm hover:from-blue-700/40 hover:to-blue-800/20 transition-all duration-300"
                  >
                    <FaCoins className="mr-2" />
                    Payout Tables
                  </button>
                  <button
                    onClick={() => scrollToElement('history')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-800/40 to-purple-900/20 rounded-lg text-white font-medium text-sm hover:from-purple-700/40 hover:to-purple-800/20 transition-all duration-300"
                  >
                    <FaChartLine className="mr-2" />
                    Game History
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="w-full h-0.5 bg-gradient-to-r from-red-600 via-blue-500/30 to-transparent mt-6"></div>
        </div>
      </div>
    );
  };

  const [events, dispatchEvents] = useReducer(eventReducer, []);
  const [bet, setBet] = useState(DEFAULT_GAME_BET);
  const [inside, dispatchInside] = useReducer(arrayReducer, new Array(148).fill(0));
  const [red, setRed] = useState(0);
  const [black, setBlack] = useState(0);
  const [odd, setOdd] = useState(0);
  const [even, setEven] = useState(0);
  const [over, setOver] = useState(0);
  const [under, setUnder] = useState(0);
  const [dozens, dispatchDozens] = useReducer(arrayReducer, [0, 0, 0]);
  const [columns, dispatchColumns] = useReducer(arrayReducer, [0, 0, 0]);
  const [correctNetwork, setCorrectNetwork] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [winnings, setWinnings] = useState(-1);
  const [rollResult, setRollResult] = useState(-1);
  const [notificationIndex, setNotificationIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationSeverity, setNotificationSeverity] = useState("success");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarPayload, setSnackbarPayload] = useState(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const showSnackbar = useCallback((messageOrPayload, severity = "info") => {
    setSnackbarPayload(
      isInsufficientBalanceAlert(messageOrPayload)
        ? messageOrPayload
        : { kind: 'text', message: String(messageOrPayload ?? '') },
    );
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const closeSnackbar = useCallback(() => setSnackbarOpen(false), []);
  const [helpPanel, setHelpPanel] = useState(null);
  const [recentResults, setRecentResults] = useState([]);

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [bettingHistory, setBettingHistory] = useState([]);
  const [error, setError] = useState(null);
  /** Completed round summary — shown when the next round starts (Place Bet). */
  const lastRoundSummaryRef = useRef(null);

  // Aptos wallet
  const { account, connected, signAndSubmitTransaction, wallet } = useWallet();
  const address = account?.address;
  const isConnected = !!connected;
  const isWalletReady = isConnected && account && signAndSubmitTransaction && wallet;
  const [realBalance, setRealBalance] = useState('0');
  const { balance } = useToken(address); // Keep for compatibility
  const { logGame } = useGameLogger();
  const HOUSE_ADDR = CASINO_MODULE_ADDRESS;

  // Function to fetch real APT balance
  const fetchRealBalance = useCallback(async () => {
    if (!account?.address) return;

    try {
      const resources = await aptosClient.getAccountResources({ accountAddress: account.address });
      const aptCoinResource = resources.find(r => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");

      if (aptCoinResource) {
        const balanceValue = aptCoinResource.data.coin.value;
        const formattedBalance = (parseInt(balanceValue) / 100000000).toFixed(8);
        setRealBalance(formattedBalance);
        console.log("Real balance updated:", formattedBalance);
      }
    } catch (error) {
      console.error("Error fetching real balance:", error);
    }
  }, [account?.address]);

  // Fetch balance when wallet connects
  useEffect(() => {
    if (account?.address) {
      fetchRealBalance();
    }
  }, [account?.address, fetchRealBalance]);

  // Sound refs
  const spinSoundRef = useRef(null);
  const winSoundRef = useRef(null);
  const chipSelectRef = useRef(null);
  const chipPlaceRef = useRef(null);
  const menuClickRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  const ambientSoundsRef = useRef(null);

  // Sound utility function
  const playSound = useCallback((ref) => {
    if (!ref?.current || ref.current.muted) return;
    ref.current.currentTime = 0;
    ref.current.play().catch(error => console.error("Sound play failed:", error));
  }, []);

  // Start background sounds as soon as component mounts
  useEffect(() => {
    let backgroundMusicAttempted = false;
    let ambientSoundsAttempted = false;

    const startBackgroundSounds = async () => {
      console.log("Attempting to start background sounds...");

      // Function to handle user interaction and start sounds
      const startSound = async (ref, volume, name) => {
        if (!ref.current) {
          console.log(`${name} ref not available`);
          return;
        }

        try {
          ref.current.volume = volume;
          // Load the audio
          await ref.current.load();
          console.log(`${name} loaded successfully`);

          // Try to play
          const playPromise = ref.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log(`${name} playing successfully`);
              })
              .catch((error) => {
                console.log(`${name} autoplay failed:`, error);
                // Add click event listener if not already attempted
                if (!backgroundMusicAttempted && name === "Background Music") {
                  backgroundMusicAttempted = true;
                  document.addEventListener('click', async () => {
                    try {
                      await ref.current.play();
                      console.log(`${name} started after user interaction`);
                    } catch (err) {
                      console.log(`${name} failed after user interaction:`, err);
                    }
                  }, { once: true });
                }
                if (!ambientSoundsAttempted && name === "Ambient Sounds") {
                  ambientSoundsAttempted = true;
                  document.addEventListener('click', async () => {
                    try {
                      await ref.current.play();
                      console.log(`${name} started after user interaction`);
                    } catch (err) {
                      console.log(`${name} failed after user interaction:`, err);
                    }
                  }, { once: true });
                }
              });
          }
        } catch (err) {
          console.log(`${name} error:`, err);
        }
      };

      await startSound(backgroundMusicRef, 0.3, "Background Music");
      await startSound(ambientSoundsRef, 0.2, "Ambient Sounds");
    };

    startBackgroundSounds();

    // Cleanup function
    return () => {
      console.log("Cleaning up sound effects...");
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
      }
      if (ambientSoundsRef.current) {
        ambientSoundsRef.current.pause();
        ambientSoundsRef.current.currentTime = 0;
      }
    };
  }, []);

  // Handle muting of all sounds
  useEffect(() => {
    console.log("Mute status changed:", isMuted);
    const audioRefs = [
      spinSoundRef,
      winSoundRef,
      chipSelectRef,
      chipPlaceRef,
      menuClickRef,
      backgroundMusicRef,
      ambientSoundsRef
    ];

    audioRefs.forEach(ref => {
      if (ref?.current) {
        ref.current.muted = isMuted;
        console.log(`Set muted=${isMuted} for audio element`);
      }
    });
  }, [isMuted]);

  useEffect(() => {
    // Remove the dev mode setting
    console.log('Environment:', process.env.NODE_ENV);
  }, []);

  // Mobile layout: width < md (768px) — table uses fixed width + horizontal scroll
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);

  // Track recent results
  useEffect(() => {
    if (rollResult >= 0) {
      setRecentResults(prev => [rollResult, ...prev].slice(0, 10));
    }
  }, [rollResult]);

  const toggleSound = () => {
    setIsMuted(!isMuted);
  };

  // Create theme using muiStyles
  const theme = createTheme(muiStyles["dark"]);

  // Redux state management
  const dispatch = useDispatch();
  const { userBalance, isLoading: isLoadingBalance } = useSelector((state) => state.balance);
  const { address: playAddress, connected: playConnected, chainLabel } = usePlayWallet();
  const { balanceNative, settleNative, symbol, chain: playChain } = usePlayBalance();
  const fairness = useProvableFairness('roulette', playAddress);
  const [lastFairnessProof, setLastFairnessProof] = useState(null);
  const historyReadyRef = useRef(false);

  useEffect(() => {
    historyReadyRef.current = false;
    if (!playAddress) {
      setBettingHistory([]);
      historyReadyRef.current = true;
      return;
    }

    let cancelled = false;
    (async () => {
      const cached = loadRouletteBetHistory(playChain, playAddress);
      if (cached.length > 0) {
        if (!cancelled) setBettingHistory(cached);
      } else {
        const fromServer = await fetchRouletteBetHistoryFromServer(playChain, playAddress);
        if (!cancelled && fromServer.length > 0) {
          setBettingHistory(fromServer);
          saveRouletteBetHistory(playChain, playAddress, fromServer);
        }
      }
      if (!cancelled) historyReadyRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [playAddress, playChain]);

  useEffect(() => {
    if (!playAddress || !historyReadyRef.current) return;
    saveRouletteBetHistory(playChain, playAddress, bettingHistory);
  }, [bettingHistory, playAddress, playChain]);

  useEffect(() => {
    setBet(getGameBetPreference('roulette', playChain));
  }, [playChain]);

  const persistChipBet = useCallback(
    (value) => {
      const n = typeof value === 'number' ? value : parseFloat(value);
      if (!Number.isFinite(n) || n <= 0) return;
      setBet(n);
      setGameBetPreference('roulette', playChain, n);
    },
    [playChain],
  );

  // insert into events
  const insertEvent = (type, oldVal, newVal, ind = 0) => {
    let newArr = [...events];
    newArr.push({ type: type, oldVal: oldVal, newVal: newVal, ind: ind });
    dispatchEvents({ type: "update", payload: newArr });
  };

  // Update the revertEvent function
  const revertEvent = useCallback((e) => {
    if (events.length > 0) {
      playSound(menuClickRef);
      const lastEvent = events[events.length - 1];

      switch (lastEvent.type) {
        case "red":
          setRed(lastEvent.oldVal);
          break;
        case "black":
          setBlack(lastEvent.oldVal);
          break;
        case "odd":
          setOdd(lastEvent.oldVal);
          break;
        case "even":
          setEven(lastEvent.oldVal);
          break;
        case "over":
          setOver(lastEvent.oldVal);
          break;
        case "under":
          setUnder(lastEvent.oldVal);
          break;
        case "dozens":
          dispatchDozens({ type: "update", ind: lastEvent.ind, val: lastEvent.oldVal });
          break;
        case "columns":
          dispatchColumns({ type: "update", ind: lastEvent.ind, val: lastEvent.oldVal });
          break;
        case "inside":
          dispatchInside({ type: "update", ind: lastEvent.ind, val: lastEvent.oldVal });
          break;
      }

      // Remove the last event from history
      dispatchEvents({ type: "update", payload: events.slice(0, -1) });
    }
  }, [events, playSound, menuClickRef]);

  // Update the placeBet function to accumulate bets
  const placeBet = useCallback((e, type, ind = 0, newVal = bet, revert = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isNaN(newVal)) {
      return;
    }

    // Play chip sound when placing a bet
    if (!revert && newVal > 0) {
      playSound(chipPlaceRef);
    }

    let oldVal = 0;
    switch (type) {
      case "red":
        oldVal = red;
        const updatedRed = revert ? newVal : red + newVal;
        if (red !== updatedRed) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedRed, ind }] });
          }
          setRed(updatedRed);
        }
        break;
      case "black":
        oldVal = black;
        const updatedBlack = revert ? newVal : black + newVal;
        if (black !== updatedBlack) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedBlack, ind }] });
          }
          setBlack(updatedBlack);
        }
        break;
      case "odd":
        oldVal = odd;
        const updatedOdd = revert ? newVal : odd + newVal;
        if (odd !== updatedOdd) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedOdd, ind }] });
          }
          setOdd(updatedOdd);
        }
        break;
      case "even":
        oldVal = even;
        const updatedEven = revert ? newVal : even + newVal;
        if (even !== updatedEven) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedEven, ind }] });
          }
          setEven(updatedEven);
        }
        break;
      case "over":
        oldVal = over;
        const updatedOver = revert ? newVal : over + newVal;
        if (over !== updatedOver) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedOver, ind }] });
          }
          setOver(updatedOver);
        }
        break;
      case "under":
        oldVal = under;
        const updatedUnder = revert ? newVal : under + newVal;
        if (under !== updatedUnder) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedUnder, ind }] });
          }
          setUnder(updatedUnder);
        }
        break;
      case "dozens":
        oldVal = dozens[ind];
        const updatedDozen = revert ? newVal : dozens[ind] + newVal;
        if (dozens[ind] !== updatedDozen) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedDozen, ind }] });
          }
          dispatchDozens({ type: "update", ind, val: updatedDozen });
        }
        break;
      case "columns":
        oldVal = columns[ind];
        const updatedColumn = revert ? newVal : columns[ind] + newVal;
        if (columns[ind] !== updatedColumn) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedColumn, ind }] });
          }
          dispatchColumns({ type: "update", ind, val: updatedColumn });
        }
        break;
      case "inside":
        oldVal = inside[ind];
        const updatedInside = revert ? newVal : inside[ind] + newVal;
        if (inside[ind] !== updatedInside) {
          if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedInside, ind }] });
          }
          dispatchInside({ type: "update", ind, val: updatedInside });
        }
        break;
    }
  }, [bet, events, red, black, odd, even, over, under, dozens, columns, inside, playSound, chipPlaceRef]);

  // reset all the bets
  const reset = useCallback((e) => {
    if (e) e.preventDefault();
    playSound(menuClickRef);
    setRed(0);
    setBlack(0);
    setOdd(0);
    setEven(0);
    setOver(0);
    setUnder(0);
    dispatchDozens({ type: "reset" });
    dispatchColumns({ type: "reset" });
    dispatchInside({ type: "reset" });
    dispatchEvents({ type: "reset" });
    setRollResult(-1);
    setWinnings(-1); // Reset to -1 to indicate no result yet
  }, [playSound, menuClickRef]);

  // updating the bet size
  const handleBetChange = useCallback(
    (e) => {
      persistChipBet(parseFloat(e.target.value));
      playSound(chipSelectRef);
    },
    [playSound, chipSelectRef, persistChipBet],
  );

  // Function to close the notification
  const handleCloseNotification = () => {
    setShowNotification(false);
    setNotificationIndex(0);
  };

  const lockBet = async () => {
    if (total <= 0) {
      showSnackbar("Add chips on the table before placing a bet.", "warning");
      return;
    }

    // Check Redux balance instead of wallet
    const currentBalance = balanceNative;
    const totalBetAmount = total;

    if (!playConnected || !playAddress) {
      showSnackbar(`Connect your ${chainLabel} wallet to play.`, "warning");
      return;
    }

    if (currentBalance < totalBetAmount) {
      showSnackbar(
        buildInsufficientBalanceAlert({
          balance: currentBalance,
          required: totalBetAmount,
          symbol,
          chainId: playChain,
        }),
        'warning',
      );
      return;
    }

    setSubmitDisabled(true);
    setNotificationIndex(notificationSteps.PLACING_BET);
    setShowNotification(true);
    playSound(spinSoundRef);
    setGameBetPreference('roulette', playChain, bet);

    const prevRound = lastRoundSummaryRef.current;
    if (prevRound) {
      const profit =
        prevRound.netResult > 0 ? prevRound.netResult - prevRound.totalBetAmount : 0;
      const prevMsg =
        prevRound.netResult > 0
          ? `Previous round: ${prevRound.winningNumber} — you won ${formatNativeAmount(profit, playChain)} ${symbol}!`
          : `Previous round: ${prevRound.winningNumber} — you lost ${formatNativeAmount(prevRound.totalBetAmount, playChain)} ${symbol}.`;
      setNotificationMessage(prevMsg);
      setNotificationSeverity(prevRound.netResult > 0 ? 'success' : 'info');
      setNotificationIndex(notificationSteps.RESULT_READY);
      setShowNotification(true);
      showSnackbar(prevMsg, prevRound.netResult > 0 ? 'success' : 'info');
      lastRoundSummaryRef.current = null;
    }

    try {
      setError(null);
      console.log('Placing bet with Redux balance:', {
        currentBalance: currentBalance,
        betAmount: totalBetAmount,
        remainingBalance: currentBalance - totalBetAmount
      });

      // Balance is debited after the spin via settleNative (single atomic server call).
      const allBets = [];

      // Add outside bets
      if (red > 0) {
        allBets.push({ type: BetType.COLOR, value: 0, amount: red, name: "Red" }); // Red = 0
      }
      if (black > 0) {
        allBets.push({ type: BetType.COLOR, value: 1, amount: black, name: "Black" }); // Black = 1
      }
      if (odd > 0) {
        allBets.push({ type: BetType.ODDEVEN, value: 1, amount: odd, name: "Odd" }); // Odd
      }
      if (even > 0) {
        allBets.push({ type: BetType.ODDEVEN, value: 0, amount: even, name: "Even" }); // Even
      }
      if (over > 0) {
        allBets.push({ type: BetType.HIGHLOW, value: 1, amount: over, name: "High (19-36)" }); // High
      }
      if (under > 0) {
        allBets.push({ type: BetType.HIGHLOW, value: 0, amount: under, name: "Low (1-18)" }); // Low
      }

      // Add dozen bets
      dozens.forEach((amount, index) => {
        if (amount > 0) {
          const dozenNames = ["1st Dozen (1-12)", "2nd Dozen (13-24)", "3rd Dozen (25-36)"];
          allBets.push({ type: BetType.DOZEN, value: index, amount, name: dozenNames[index] });
        }
      });

      // Add column bets
      columns.forEach((amount, index) => {
        if (amount > 0) {
          const columnNames = ["1st Column", "2nd Column", "3rd Column"];
          allBets.push({ type: BetType.COLUMN, value: index, amount, name: columnNames[index] });
        }
      });

      // Add inside bets
      inside.forEach((amount, index) => {
        if (amount > 0) {
          // inside array structure: 
          // Index 0: Number 0 (straight bet only)
          // Index 1-4: Number 1 (straight=1, split-left=2, split-bottom=3, corner=4)
          // Index 5-8: Number 2 (straight=5, split-left=6, split-bottom=7, corner=8)
          // Formula: (number-1)*4 + betType for numbers 1-36

          let actualNumber, betPosition;

          if (index === 0) {
            // Special case for number 0 - only straight bet
            actualNumber = 0;
            betPosition = 1; // straight bet
          } else {
            // For numbers 1-36
            betPosition = ((index - 1) % 4) + 1; // 1=straight, 2=split-left, 3=split-bottom, 4=corner
            actualNumber = Math.floor((index - 1) / 4) + 1; // Numbers 1-36
          }

          // Debug: Check the actual structure
          console.log(`Inside bet structure - index: ${index}, betPosition: ${betPosition}, actualNumber: ${actualNumber}`);

          // Debug: Check if this is a straight bet on a number
          if (betPosition === 1) {
            console.log(`Straight bet detected - index: ${index}, actualNumber: ${actualNumber}, amount: ${amount}`);
          }

          console.log(`Inside bet - index: ${index}, amount: ${amount}, betPosition: ${betPosition}, actualNumber: ${actualNumber}`);

          // FIXED: Use actualNumber instead of numberBase for better accuracy
          if (betPosition === 1) {
            // Straight up bet - actualNumber is the actual number (0-36)
            allBets.push({ type: BetType.NUMBER, value: actualNumber, amount, name: `Number ${actualNumber}` });
          } else if (betPosition === 2) {
            // Left split bet - predefined split positions
            const splitMap = {
              // Left splits (n, n-3) - including 1,2,3 with 0
              1: "0,1",      // Bottom-left split with 0
              2: "0,2",      // Middle-left split with 0
              3: "0,3",      // Top-left split with 0

              4: "1,4",      // Bottom-left split
              7: "4,7",      // Bottom-left split
              10: "7,10",    // Bottom-left split
              13: "10,13",   // Bottom-left split
              16: "13,16",   // Bottom-left split
              19: "16,19",   // Bottom-left split
              22: "19,22",   // Bottom-left split
              25: "22,25",   // Bottom-left split
              28: "25,28",   // Bottom-left split
              31: "28,31",   // Bottom-left split
              34: "31,34",   // Bottom-left split

              5: "2,5",      // Middle-left split
              8: "5,8",      // Middle-left split
              11: "8,11",    // Middle-left split
              14: "11,14",   // Middle-left split
              17: "14,17",   // Middle-left split
              20: "17,20",   // Middle-left split
              23: "20,23",   // Middle-left split
              26: "23,26",   // Middle-left split
              29: "26,29",   // Middle-left split
              32: "29,32",   // Middle-left split
              35: "32,35",   // Middle-left split

              6: "3,6",      // Top-left split
              9: "6,9",      // Top-left split
              12: "9,12",    // Top-left split
              15: "12,15",   // Top-left split
              18: "15,18",   // Top-left split
              21: "18,21",   // Top-left split
              24: "21,24",   // Top-left split
              27: "24,27",   // Top-left split
              30: "27,30",   // Top-left split
              33: "30,33",   // Top-left split
              36: "33,36"    // Top-left split
            };

            const splitNumbers = splitMap[actualNumber];
            if (splitNumbers) {
              // Use the actualNumber (where bet was placed) to get split definition
              allBets.push({ type: BetType.SPLIT, value: splitNumbers, amount, name: `Split ${actualNumber} (${splitNumbers})` });
            }
          } else if (betPosition === 3) {
            // Bottom bet - can be either street bet or bottom split bet
            const isBottomRow = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(actualNumber);

            if (isBottomRow) {
              // Bottom row: street bet [n, n+1, n+2]
              const streetNumbers = [actualNumber, actualNumber + 1, actualNumber + 2];
              console.log(`🎯 STREET BET DETECTED: ${actualNumber} → [${streetNumbers.join(',')}] - Amount: ${amount}`);
              allBets.push({ type: BetType.STREET, value: streetNumbers.join(','), amount, name: `Street ${streetNumbers.join('-')}` });
            } else {
              // Middle/Top row: bottom split bet - use predefined values
              const bottomSplitMap = {
                2: "1,2",      // Split 2: 1,2
                3: "2,3",      // Split 3: 2,3
                5: "4,5",      // Split 5: 4,5
                6: "5,6",      // Split 6: 5,6
                8: "7,8",      // Split 8: 7,8
                9: "8,9",      // Split 9: 8,9
                11: "10,11",   // Split 11: 10,11
                12: "11,12",   // Split 12: 11,12
                14: "13,14",   // Split 14: 13,14
                15: "14,15",   // Split 15: 14,15
                17: "16,17",   // Split 17: 16,17
                18: "17,18",   // Split 18: 17,18
                20: "19,20",   // Split 20: 19,20
                21: "20,21",   // Split 21: 20,21
                23: "22,23",   // Split 23: 22,23
                24: "23,24",   // Split 24: 23,24
                26: "25,26",   // Split 26: 25,26
                27: "26,27",   // Split 27: 26,27
                29: "28,29",   // Split 29: 28,29
                30: "29,30",   // Split 30: 29,30
                32: "31,32",   // Split 32: 31,32
                33: "32,33",   // Split 33: 32,33
                35: "34,35",   // Split 35: 34,35 - Changed from street to split
                36: "35,36"    // Split 36: 35,36 - Changed from street to split
              };

              const splitNumbers = bottomSplitMap[actualNumber];
              if (splitNumbers) {
                allBets.push({ type: BetType.SPLIT, value: splitNumbers, amount, name: `Split ${actualNumber} (${splitNumbers.replace(',', '-')})` });
              } else {
                // Fallback to old calculation if not in map
                const bottomNumber = actualNumber + 3;
                allBets.push({ type: BetType.SPLIT, value: `${actualNumber},${bottomNumber}`, amount, name: `Split ${actualNumber}/${bottomNumber}` });
              }
            }
          } else if (betPosition === 5) {
            // Horizontal split bet - predefined split positions (same row, adjacent numbers)
            const horizontalSplitMap = {
              // Horizontal splits (n, n+1) - same row - FIXED VALUES
              2: "1,2",      // Split 2: 1,2
              3: "2,3",      // Split 3: 2,3
              5: "4,5",      // Split 5: 4,5
              6: "5,6",      // Split 6: 5,6
              8: "7,8",      // Split 8: 7,8
              9: "8,9",      // Split 9: 8,9
              11: "10,11",   // Split 11: 10,11
              12: "11,12",   // Split 12: 11,12
              14: "13,14",   // Split 14: 13,14
              15: "14,15",   // Split 15: 14,15
              17: "16,17",   // Split 17: 16,17
              18: "17,18",   // Split 18: 17,18
              20: "19,20",   // Split 20: 19,20
              21: "20,21",   // Split 21: 20,21
              23: "22,23",   // Split 23: 22,23
              24: "23,24",   // Split 24: 23,24
              26: "25,26",   // Split 26: 25,26
              27: "26,27",   // Split 27: 26,27
              29: "28,29",   // Split 29: 28,29
              30: "29,30",   // Split 30: 29,30
              32: "31,32",   // Split 32: 31,32
              33: "32,33",   // Split 33: 32,33
              35: "34,35",   // Split 35: 34,35
              36: "35,36"    // Split 36: 35,36
            };

            const horizontalSplitNumbers = horizontalSplitMap[actualNumber];
            if (horizontalSplitNumbers) {
              // Use the actualNumber (where bet was placed) to get split definition
              allBets.push({ type: BetType.SPLIT, value: horizontalSplitNumbers, amount, name: `Split ${actualNumber} (${horizontalSplitNumbers})` });
            }
          } else if (betPosition === 4) {
            // Corner bet (4 numbers) - predefined corner positions
            // All possible corners in roulette table (22 corners total)
            // FIXED: Correct corner values based on actual roulette table layout
            const cornerMap = {
              2: "0,1,2",      // Middle-left corner
              5: "1,2,4,5",      // Middle-left corner
              8: "4,5,7,8",      // Middle-left corner
              11: "7,8,10,11",  // Middle-left corner - FIXED
              14: "10,11,13,14", // Middle-left corner - FIXED
              17: "13,14,16,17", // Middle-left corner - FIXED
              20: "16,17,19,20", // Middle-left corner
              23: "19,20,22,23", // Middle-left corner - FIXED
              26: "22,23,25,26", // Middle-left corner
              29: "25,26,28,29", // Middle-left corner
              32: "28,29,31,32", // Middle-left corner
              35: "31,32,33,35", // Middle-right corner

              3: "2,3,0",      // Top-left corner
              6: "2,3,5,6",      // Top-left corner
              9: "5,6,8,9",     // Top-left corner
              12: "8,9,11,12",  // Top-left corner
              15: "11,12,14,15", // Top-left corner - FIXED
              18: "14,15,17,18", // Top-left corner
              21: "17,18,20,21", // Top-left corner
              24: "20,21,23,24", // Top-left corner
              27: "23,24,26,27", // Top-left corner
              30: "26,27,29,30", // Top-left corner
              33: "29,30,32,33", // Top-left corner
              36: "32,33,35,36"  // Top-right corner
            };

            const cornerNumbers = cornerMap[actualNumber];
            if (cornerNumbers) {
              // Use the actualNumber (where bet was placed) to get corner definition
              allBets.push({ type: BetType.CORNER, value: cornerNumbers, amount, name: `Corner ${actualNumber} (${cornerNumbers})` });
            }
          }
        }
      });

      console.log("All bets to process:", allBets);
      console.log("Column bets:", columns);
      console.log("Column bet positions:");
      console.log(`  Index 0 (Top "2 To 1"): ${columns[0] > 0 ? `$${columns[0]} bet` : 'No bet'} → 3rd Column (3,6,9,12,15,18,21,24,27,30,33,36)`);
      console.log(`  Index 1 (Middle "2 To 1"): ${columns[1] > 0 ? `$${columns[1]} bet` : 'No bet'} → 2nd Column (2,5,8,11,14,17,20,23,26,29,32,35)`);
      console.log(`  Index 2 (Bottom "2 To 1"): ${columns[2] > 0 ? `$${columns[2]} bet` : 'No bet'} → 1st Column (1,4,7,10,13,16,19,22,25,28,31,34)`);
      console.log("Inside bets:", inside);



      console.log("Game simulation with multiple bets:", allBets);

      // Simulate the game locally (no blockchain interaction)
      // Reset roll result for the new bet
      setRollResult(-1);

      // Set notification to bet placed
      setNotificationIndex(notificationSteps.BET_PLACED);

      // Simulate wheel spinning and result after delay
      let fairnessRound = null;
      if (fairness.enabled) {
        fairnessRound = await fairness.begin();
      }

      setTimeout(async () => {
        let winningNumber;
        let fairnessProof = null;
        if (fairness.enabled && fairnessRound) {
          winningNumber = deriveRouletteOutcome(fairnessRound.seedBytes);
          fairnessProof = await fairness.reveal({ winningNumber }, fairnessRound);
          setLastFairnessProof(fairnessProof);
          fairness.reset();
        } else {
          winningNumber = Math.floor(Math.random() * 37);
        }
        setRollResult(winningNumber);

        // Debug: Show which column the winning number belongs to
        if (winningNumber > 0) {
          const columnNumber = winningNumber % 3;
          let columnName = "";
          if (columnNumber === 1) columnName = "1st Column";
          else if (columnNumber === 2) columnName = "2nd Column";
          else if (columnNumber === 0) columnName = "3rd Column";

          console.log(`🎯 WINNING NUMBER: ${winningNumber}`);
          console.log(`📊 COLUMN INFO: ${winningNumber} % 3 = ${columnNumber} → ${columnName}`);
          console.log(`🔢 COLUMN NUMBERS: ${columnName} contains: ${getColumnNumbers(columnNumber)}`);
        } else {
          console.log(`🎯 WINNING NUMBER: 0 (Green - No column bet)`);
        }

        const { totalPayout, netResult, winningBets, losingBets } = calculateRouletteRoundResult(
          allBets,
          winningNumber,
        );
        setWinnings(netResult);

        console.log("🎯 WINNINGS CALCULATION:", {
          totalPayout,
          totalBetAmount,
          netResult,
          winningsState: netResult,
          explanation: "totalPayout already includes original bet, so netResult = totalPayout"
        });

        console.log("Bet results:", {
          winningNumber,
          totalBets: allBets.length,
          winningBets: winningBets.length,
          losingBets: losingBets.length,
          totalPayout,
          netResult,
          totalBetAmount
        });

        // Settle house balance in one call: debit stake + credit winnings (or release on loss).
        const settled = await settleNative(
          totalBetAmount,
          netResult,
          playAddress,
          'roulette',
          {
            bets: allBets.map((bet) => ({
              type: bet.type,
              value: bet.value,
              amount: bet.amount,
            })),
            fairnessProof: fairnessProof || undefined,
          },
        );
        if (!settled.ok) {
          console.error('Roulette settle failed:', settled.error);
          showSnackbar(
            settled.error || 'Could not update your house balance for this round. Please refresh and try again.',
            'error',
          );
        }

        // Add to betting history
        const newBet = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          timestamp: new Date(),
          betType: `Multiple Bets (${allBets.length})`,
          amount: totalBetAmount,
          numbers: [],
          result: winningNumber,
          win: netResult > 0,  // Use netResult to determine if it's a win
          returned: netResult > 0 ? netResult : 0,
          payout: netResult > 0 ? netResult - totalBetAmount : -totalBetAmount,
          multiplier: netResult > 0 ? (netResult / totalBetAmount).toFixed(2) : 0,
          totalBets: allBets.length, // Add totalBets field
          winningBets: winningBets.length, // Add winningBets field
          txHash: null,
          details: {
            winningBets: winningBets.map(bet => `${bet.name}: ${bet.amount} × ${bet.multiplier}x`),
            losingBets: losingBets.map(bet => `${bet.name}: -${bet.amount}`)
          }
        };

        console.log("newBet object created:", {
          win: newBet.win,
          payout: newBet.payout,
          netResult,
          totalPayout,
          totalBetAmount
        });

        setBettingHistory(prev => [newBet, ...prev].slice(0, 50)); // Keep last 50 bets

        lastRoundSummaryRef.current = {
          winningNumber,
          netResult,
          totalBetAmount,
        };

        // Log game to blockchain
        if (playAddress && totalBetAmount > 0) {
          const gameResult = `number${winningNumber}_${netResult > 0 ? 'win' : 'loss'}_${winningBets.length}bets`;
          logGame({
            gameType: 'roulette',
            playerAddress: playAddress,
            betAmount: totalBetAmount,
            result: gameResult,
            // Gross return (includes stake) so leaderboard/profile PnL = payout - bet is correct.
            payout: netResult > 0 ? netResult : 0,
            fairnessProof: fairnessProof || undefined,
          }).then(res => {
            if (res?.success) {
              setBettingHistory(prev => prev.map(item =>
                item.id === newBet.id
                  ? {
                      ...item,
                      txHash: res.transactionHash || res.proofReference || null,
                      explorerUrl: res.explorerUrl || null,
                      fairnessProof: fairnessProof || item.fairnessProof,
                    }
                  : item
              ));
            }
          }).catch(error => {
            console.error('Failed to log roulette game:', error);
          });
        }

        console.log("New bet added to history:", newBet); // Debug log
        console.log("Updated bettingHistory:", [newBet, ...bettingHistory].slice(0, 50)); // Debug log

        // Show result notification
        if (netResult > 0) {
          const winMessage = winningBets.length === 1
            ? `🎉 WINNER! ${winningBets[0].name} - You won ${(netResult - totalBetAmount).toFixed(4)} ${symbol}!`
            : `🎉 MULTIPLE WINNERS! ${winningBets.length} bets won - Total: ${(netResult - totalBetAmount).toFixed(4)} ${symbol}!`;

          setNotificationMessage(winMessage);
          setNotificationSeverity("success");
          showSnackbar(winMessage, 'success');
        } else {
          const lossMsg = `Number ${winningNumber} — lost ${formatNativeAmount(totalBetAmount, playChain)} ${symbol}`;
          setNotificationMessage(lossMsg);
          setNotificationSeverity("error");
          showSnackbar(lossMsg, 'info');
        }

        // Re-enable betting
        setSubmitDisabled(false);

      }, 4000); // Wait 4 seconds for wheel animation

    } catch (error) {
      console.error("Error in lockBet:", error);
      setError(error.message || error.toString());
      setShowNotification(false);
      alert(`Error: ${error.message || error.toString()}`);

      // No need to refund since we don't deduct balance upfront anymore
    } finally {
      // Don't disable submit here since we removed the blockchain wait
    }
  };

  // Helper function to get bet type name for history
  const getBetTypeName = (betType, betValue) => {
    switch (betType) {
      case BetType.COLOR:
        return betValue === 0 ? 'Red' : 'Black';
      case BetType.ODDEVEN:
        return betValue === 1 ? 'Odd' : 'Even';
      case BetType.HIGHLOW:
        return betValue === 1 ? 'High (19-36)' : 'Low (1-18)';
      case BetType.DOZEN:
        return `Dozen ${betValue + 1}`;
      case BetType.COLUMN:
        return `Column ${betValue + 1}`;
      case BetType.NUMBER:
        return `Straight ${betValue}`;
      case BetType.SPLIT:
        return `Split ${betValue}`;
      case BetType.STREET:
        return `Street ${betValue}`;
      case BetType.CORNER:
        // For corner bets, betValue is already a string like "7,8,10,11"
        // Convert it to a more readable format like "7-8-10-11"
        if (typeof betValue === 'string' && betValue.includes(',')) {
          const cornerNumbers = betValue.split(',').map(n => n.trim());
          return `Corner ${cornerNumbers.join('-')}`;
        }
        return `Corner ${betValue}`;
      default:
        return 'Unknown';
    }
  };

  const handleWithdrawWinnings = useCallback(async (e) => {
    if (e) e.preventDefault();
    playSound(winSoundRef);

    if (!address) {
      console.error("Wallet not connected.");
      alert("Please connect your wallet.");
      return;
    }

    try {
      const amount = parseEther(winnings.toString()); // Use winnings as the amount to withdraw

      reset(e); // Reset the state after withdrawing

      // Simulate the contract interaction
      const withdrawSimulation =
        await ViemClient.publicPharosSepoliaClient.simulateContract({
          address: rouletteContractAddress,
          abi: rouletteABI,
          functionName: "withdrawTokens",
          args: [amount],
          account: address,
        });

      // Execute the contract transaction
      const withdrawResponse = await ViemClient.getWalletClient().writeContract(
        withdrawSimulation.request
      );

      if (withdrawResponse) {
        // Extract hash from response if it's an object
        const responseHash = typeof withdrawResponse === 'object' ?
          (withdrawResponse.hash || String(withdrawResponse)) :
          withdrawResponse;

        console.log("Winnings withdrawn successfully:", responseHash);
        alert("Winnings withdrawn successfully!");
      } else {
        throw new Error("Withdrawal transaction failed.");
      }
    } catch (error) {
      console.error("Error withdrawing winnings:", error);
      alert(`Failed to withdraw winnings: ${error.message}`);
    }
  }, [playSound, winnings, reset]);

  const config = undefined; // wagmi removed

  const contractAddress = '0xbD8Ca722093d811bF314dDAB8438711a4caB2e73'; // ✅ FIX THIS

  // Remove the custom writeContract function and use the imported one directly
  const waitForTransaction = async (hash) => {
    try {
      // Ensure hash is a string, not an object
      const hashStr = typeof hash === 'object' && hash.hash ? hash.hash : hash;
      const receipt = await waitForTransactionReceipt({
        hash: hashStr,
        chainId: 0x138b
      });
      setTransactionReceipt(receipt);
      return receipt;
    } catch (error) {
      console.error("Wait for transaction error:", error);
      throw error;
    }
  };

  // Update the checkNetwork function to focus on correct wallet detection
  const checkNetwork = async () => {
    // Ensure we're running in the browser
    if (typeof window === "undefined") return;

    console.log("Checking network...");

    try {
      // First check if user is connected via wagmi
      if (isConnected && address) {
        console.log("Wallet connected via wagmi:", address);
        setCorrectNetwork(true);
        return;
      }

      // Fall back to window.ethereum check with retry
      const checkWithRetry = async (attempts = 3) => {
        if (window.ethereum && typeof window.ethereum.request === 'function') {
          console.log("Ethereum provider found, requesting chain ID...");
          try {
            const chainId = await window.ethereum.request({ method: "eth_chainId" });
            console.log("Current chain ID:", chainId);

            // Support both Mantle Sepolia (0x138b) and Pharos Devnet (0xc352)
            const isCorrectNetwork = chainId === "0x138b" || chainId === "0xc352";
            console.log("Is correct network:", isCorrectNetwork);
            setCorrectNetwork(isCorrectNetwork);
          } catch (error) {
            console.error("Error checking chain ID:", error);
            if (attempts > 1) {
              console.log(`Retrying... (${attempts - 1} attempts left)`);
              setTimeout(() => checkWithRetry(attempts - 1), 500);
            } else {
              setCorrectNetwork(false);
            }
          }
        } else {
          console.log("Ethereum provider not available or not fully initialized");
          if (attempts > 1) {
            console.log(`Retrying... (${attempts - 1} attempts left)`);
            setTimeout(() => checkWithRetry(attempts - 1), 500);
          } else {
            setCorrectNetwork(false);
          }
        }
      };

      // Start the retry process
      checkWithRetry();
    } catch (error) {
      console.error("Error in checkNetwork:", error);
      setCorrectNetwork(false);
    }
  };

  useEffect(() => {
    // Only check when component mounts or when wallet connection changes
    if (typeof window !== "undefined") {
      console.log("Wallet connection state changed, checking network...");
      console.log("isConnected:", isConnected, "address:", address);

      checkNetwork();

      // Setup event listener if provider exists
      const setupListeners = () => {
        if (window.ethereum && typeof window.ethereum.on === 'function') {
          window.ethereum.on("chainChanged", () => {
            console.log("Chain changed, rechecking network");
            checkNetwork();
          });
          window.ethereum.on("accountsChanged", () => {
            console.log("Accounts changed, rechecking network");
            checkNetwork();
          });

          return () => {
            if (window.ethereum && typeof window.ethereum.removeListener === 'function') {
              window.ethereum.removeListener("chainChanged", checkNetwork);
              window.ethereum.removeListener("accountsChanged", checkNetwork);
            }
          };
        }
      };

      return setupListeners();
    }
  }, [isConnected, address]); // Add dependencies to run when wallet connection changes

  const switchNetwork = async () => {
    // Ensure we're running in the browser
    if (typeof window === "undefined") return;

    try {
      // Check if wallet is connected first
      if (!isConnected) {
        console.log("Wallet not connected, please connect wallet first");
        alert("Please connect your wallet first using the connect button in the top right corner");
        return;
      }

      // Check if ethereum provider exists
      if (!window.ethereum || typeof window.ethereum.request !== 'function') {
        alert("No Ethereum wallet detected. Please install a wallet like MetaMask.");
        return;
      }

      console.log("Attempting to switch to Mantle Sepolia network");

      try {
        // Try Mantle Sepolia first
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x138b" }],
        });

        console.log("Successfully switched to Mantle Sepolia");
        // Set network to correct and reload after short delay
        setCorrectNetwork(true);
        setTimeout(() => window.location.reload(), 1000);
        return;
      } catch (switchError) {
        console.log("Switch network error:", switchError);

        // If network doesn't exist in wallet (error code 4902), try adding it
        if (switchError.code === 4902) {
          try {
            console.log("Adding Mantle Sepolia to wallet");
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x138b",
                  chainName: "Mantle Sepolia",
                  nativeCurrency: {
                    name: "Mantle",
                    symbol: "MNT",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
                  blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
                },
              ],
            });

            // Try switching again after adding
            try {
              await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x138b" }],
              });

              console.log("Successfully switched to Mantle Sepolia after adding");
              // Set network to correct and reload after short delay
              setCorrectNetwork(true);
              setTimeout(() => window.location.reload(), 1000);
              return;
            } catch (error) {
              console.error("Error switching to Mantle after adding:", error);
            }
          } catch (addError) {
            console.error("Failed to add Mantle Sepolia:", addError);

            // If Mantle Sepolia fails, try Pharos Devnet as fallback
            try {
              console.log("Adding Pharos Devnet to wallet");
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xc352",
                    chainName: "Pharos Devnet",
                    nativeCurrency: {
                      name: "Pharos",
                      symbol: "PHR",
                      decimals: 18,
                    },
                    rpcUrls: ["https://devnet.dplabs-internal.com"],
                    blockExplorerUrls: ["https://pharosscan.xyz"],
                  },
                ],
              });

              // Try switching to Pharos
              try {
                await window.ethereum.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: "0xc352" }],
                });

                console.log("Successfully switched to Pharos Devnet");
                // Set network to correct and reload after short delay
                setCorrectNetwork(true);
                setTimeout(() => window.location.reload(), 1000);
                return;
              } catch (error) {
                console.error("Error switching to Pharos after adding:", error);
              }
            } catch (pharosError) {
              console.error("Failed to add Pharos Devnet:", pharosError);
              alert("Unable to switch to required networks. Please try adding Mantle Sepolia manually.");
            }
          }
        } else {
          // Handle other errors
          console.error("Failed to switch network:", switchError);
          alert("Failed to switch network. Please try again or add Mantle Sepolia manually.");
        }
      }
    } catch (error) {
      console.error("Error in switchNetwork:", error);
      alert("An error occurred while switching networks. Please refresh and try again.");
    }
  };

  // Calculate total bet
  const total = useMemo(() => {
    let val = red + black + odd + even + over + under;
    val += dozens.reduce((acc, currVal) => {
      return acc + currVal;
    }, 0);
    val += columns.reduce((acc, currVal) => {
      return acc + currVal;
    }, 0);
    val += inside.reduce((acc, currVal) => {
      return acc + currVal;
    }, 0);
    return val;
  }, [red, black, odd, even, over, under, dozens, columns, inside]);

  // Update the clear bet function
  const clearBet = useCallback((e) => {
    if (e) e.preventDefault();
    playSound(menuClickRef);
    setRed(0);
    setBlack(0);
    setOdd(0);
    setEven(0);
    setOver(0);
    setUnder(0);
    dispatchDozens({ type: "reset" });
    dispatchColumns({ type: "reset" });
    dispatchInside({ type: "reset" });
    dispatchEvents({ type: "reset" });
    setWinnings(-1); // Reset winnings when clearing bets
  }, [playSound, menuClickRef]);

  // Removed handlePlaceBet function - now using lockBet with Redux balance

  // Removed placeAptBet function - now using lockBet with Redux balance

  // Helper function to get column numbers for debugging
  const getColumnNumbers = (columnModulo) => {
    const numbers = [];
    for (let i = 1; i <= 36; i++) {
      if (i % 3 === columnModulo) {
        numbers.push(i);
      }
    }
    return numbers.join(', ');
  };

  const handleGoAgain = () => {
    // Keep chip layout — only reset round outcome so the same bets can be replayed.
    setRollResult(-1);
    setWinnings(-1);
    setSubmitDisabled(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <div
        ref={contentRef}
        className="site-game-page site-page-top font-sans md:pt-4"
        style={{ backgroundColor: "#080005" }}
      >
        {/* Audio elements */}
        <audio ref={spinSoundRef} src="/sounds/ball-spin.mp3" preload="auto" />
        <audio ref={winSoundRef} src="/sounds/win-chips.mp3" preload="auto" />
        <audio ref={chipSelectRef} src="/sounds/chip-select.mp3" preload="auto" />
        <audio ref={chipPlaceRef} src="/sounds/chip-put.mp3" preload="auto" />
        <audio ref={menuClickRef} src="/sounds/menu.mp3" preload="auto" />
        <audio ref={backgroundMusicRef} src="/sounds/background-music.mp3" preload="auto" loop />
        <audio ref={ambientSoundsRef} src="/sounds/ambient-sounds.mp3" preload="auto" loop />

        {/* Page Header */}
        <RouletteHeader />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            pt: { xs: 0, md: 1 },
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: { md: 1680, lg: 1800 },
            mx: { md: "auto" },
            px: { xs: 0, md: 2, lg: 3 },
          }}
        >


          {/* Recent Results Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowX: 'auto',
              py: 0.75,
              mt: 1,
              mb: 2,
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
              gap: 1,
              width: '100%',
              mx: 'auto',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mr: 1.5,
                whiteSpace: 'nowrap',
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '20px',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              Recent Results:
            </Typography>
            {recentResults.length === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '20px',
                  opacity: 0.8
                }}
              >
                No results yet
              </Typography>
            ) : (
              recentResults.map((num, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    backgroundColor: num === 0 ? 'game.green' :
                      [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num) ? 'game.red' : 'dark.bg',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  {num}
                </Box>
              ))
            )}
          </Box>

          {/* Roulette table — mobile: horizontal scroll; desktop: full width */}
          <Box
            sx={{
              width: '100%',
              ...(isSmallScreen
                ? {
                    overflowX: 'auto',
                    overflowY: 'visible',
                    pb: 1,
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-x',
                    '&::-webkit-scrollbar': { height: '6px' },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(255,255,255,0.25)',
                      borderRadius: '4px',
                    },
                  }
                : {
                    overflowX: 'auto',
                    overflowY: 'visible',
                    display: 'flex',
                    justifyContent: 'center',
                  }),
            }}
          >
            <Box
              sx={{
                width: '100%',
                ...(isSmallScreen
                  ? { minWidth: 920, width: 920, flexShrink: 0 }
                  : {
                      minWidth: { md: 1100, lg: 1280 },
                      maxWidth: '100%',
                    }),
              }}
            >
            <Grid
              container
              columns={14}
              sx={{
                mt: { xs: 1.5, md: 3 },
                mx: 'auto',
                px: { xs: 0.5, sm: 1 },
                width: '100%',
                '& .MuiTypography-h5': {
                  fontSize: { xs: '1.1rem', md: '1.35rem', lg: '1.5rem' },
                },
              }}
            >
              <Grid xs={1} md={1}>
                <GridZero inside={inside} placeBet={placeBet} />
              </Grid>
              <Grid xs={4} md={4} container columns={12}>
                {firstThird.map((val, ind) => (
                  <Grid xs={3} md={3} key={`first-third-${val.val}`}>
                    <GridInside
                      insideNumber={val.val}
                      red={val?.red}
                      topEdge={ind < 4}
                      placeBet={placeBet}
                      straightup={inside[(val.val - 1) * 4 + 1]}
                      splitleft={inside[(val.val - 1) * 4 + 2]}
                      splitbottom={inside[(val.val - 1) * 4 + 3]}
                      corner={inside[(val.val - 1) * 4 + 4]}
                      isWinner={rollResult === val.val}
                    />
                  </Grid>
                ))}
              </Grid>
              <Grid xs={4} md={4} container columns={12}>
                {secondThird.map((val, ind) => (
                  <Grid xs={3} md={3} key={`second-third-${val.val}`}>
                    <GridInside
                      insideNumber={val.val}
                      red={val?.red}
                      topEdge={ind < 4}
                      placeBet={placeBet}
                      straightup={inside[(val.val - 1) * 4 + 1]}
                      splitleft={inside[(val.val - 1) * 4 + 2]}
                      splitbottom={inside[(val.val - 1) * 4 + 3]}
                      corner={inside[(val.val - 1) * 4 + 4]}
                      isWinner={rollResult === val.val}
                    />
                  </Grid>
                ))}
              </Grid>
              <Grid xs={4} md={4} container columns={12}>
                {thirdThird.map((val, ind) => (
                  <Grid xs={3} md={3} key={`third-third-${val.val}`}>
                    <GridInside
                      insideNumber={val.val}
                      red={val?.red}
                      topEdge={ind < 4}
                      placeBet={placeBet}
                      straightup={inside[(val.val - 1) * 4 + 1]}
                      splitleft={inside[(val.val - 1) * 4 + 2]}
                      splitbottom={inside[(val.val - 1) * 4 + 3]}
                      corner={inside[(val.val - 1) * 4 + 4]}
                      isWinner={rollResult === val.val}
                    />
                  </Grid>
                ))}
              </Grid>
              <Grid xs={1} md={1} sx={{ display: "flex", alignItems: "stretch" }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", width: "100%" }}
                >
                  <GridColumnBet
                    topCard={true}
                    columns={columns}
                    index={0}
                    bet={bet}
                    placeBet={placeBet}
                  />
                  <GridColumnBet
                    columns={columns}
                    index={1}
                    bet={bet}
                    placeBet={placeBet}
                  />
                  <GridColumnBet
                    bottomCard={true}
                    columns={columns}
                    index={2}
                    bet={bet}
                    placeBet={placeBet}
                  />
                </Box>
              </Grid>

              <Grid xs={1} md={1} />
              <Grid xs={4} md={4}>
                <GridOutsideBet onClick={(e) => placeBet(e, "dozens", 0)}>
                  <Typography variant="h5">1st 12</Typography>
                  {dozens[0] > 0 && (
                    <BetBox
                      betValue={dozens[0]}
                      betType="1st 12"
                      onClick={(e) => placeBet(e, "dozens", 0)}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid xs={4} md={4}>
                <GridOutsideBet onClick={(e) => placeBet(e, "dozens", 1)}>
                  <Typography variant="h5">2nd 12</Typography>
                  {dozens[1] > 0 && (
                    <BetBox
                      betValue={dozens[1]}
                      betType="2nd 12"
                      onClick={(e) => placeBet(e, "dozens", 1)}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid xs={4} md={4}>
                <GridOutsideBet
                  rightCard={true}
                  onClick={(e) => placeBet(e, "dozens", 2)}
                >
                  <Typography variant="h5">3rd 12</Typography>
                  {dozens[2] > 0 && (
                    <BetBox
                      betValue={dozens[2]}
                      betType="3rd 12"
                      onClick={(e) => placeBet(e, "dozens", 2)}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid
                xs={1}
                md={1}
                sx={{
                  borderLeft: (theme) => `10px solid ${theme.palette.dark.card}`,
                }}
              />

              <Grid xs={1} md={1} />
              <Grid xs={2} md={2}>
                <GridOutsideBet onClick={(e) => placeBet(e, "under")}>
                  <Typography variant="h5">1-18</Typography>
                  {under > 0 && (
                    <BetBox
                      betValue={under}
                      betType="Under (1-18)"
                      onClick={(e) => placeBet(e, "under")}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid xs={2} md={2}>
                <GridOutsideBet onClick={(e) => placeBet(e, "even")}>
                  <Typography variant="h5">Even</Typography>
                  {even > 0 && (
                    <BetBox
                      betValue={even}
                      betType="Even"
                      onClick={(e) => placeBet(e, "even")}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid xs={2} md={2}>
                <GridOutsideBet onClick={(e) => placeBet(e, "red")}>
                  <Box
                    sx={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: (theme) => theme.palette.game.red,
                    }}
                  />
                  {red > 0 && (
                    <BetBox
                      betValue={red}
                      betType="Red"
                      onClick={(e) => placeBet(e, "red")}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid xs={2} md={2}>
                <GridOutsideBet onClick={(e) => placeBet(e, "black")}>
                  <Box
                    sx={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: (theme) => theme.palette.dark.bg,
                    }}
                  />
                  {black > 0 && (
                    <BetBox
                      betValue={black}
                      betType="Black"
                      onClick={(e) => placeBet(e, "black")}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid xs={2} md={2}>
                <GridOutsideBet onClick={(e) => placeBet(e, "odd")}>
                  <Typography variant="h5">Odd</Typography>
                  {odd > 0 && (
                    <BetBox
                      betValue={odd}
                      betType="Odd"
                      onClick={(e) => placeBet(e, "odd")}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid xs={2} md={2}>
                <GridOutsideBet
                  rightCard={true}
                  onClick={(e) => placeBet(e, "over")}
                >
                  <Typography variant="h5">19-36</Typography>
                  {over > 0 && (
                    <BetBox
                      betValue={over}
                      betType="Over (19-36)"
                      onClick={(e) => placeBet(e, "over")}
                    />
                  )}
                </GridOutsideBet>
              </Grid>
              <Grid
                xs={1}
                md={1}
                sx={{
                  borderLeft: (theme) => `10px solid ${theme.palette.dark.card}`,
                }}
              />
            </Grid>
            </Box>
          </Box>

          {isSmallScreen && (
            <Typography
              variant="caption"
              sx={{ display: 'block', textAlign: 'center', mt: 1, mb: 1, opacity: 0.55, px: 2 }}
            >
              Swipe left or right to view the full table
            </Typography>
          )}

          <Box
            sx={{
              mt: 1.5,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
              justifyContent: "center",
              mb: { xs: 2, md: 2.5 },
              gap: { xs: 1.5, md: 2 },
              px: { xs: 2, md: 0 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                mb: { xs: 2, md: 0 },
                alignItems: { xs: 'center', md: 'flex-start' },
                width: { xs: '100%', md: 'auto' },
              }}
            >
              <Typography
                variant="h4"
                color="text.accent"
                sx={{ mb: { xs: 1, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}
              >
                Roulette
              </Typography>
              <RouletteInfoTriggers activePanel={helpPanel} onOpen={setHelpPanel} />
              <RouletteInfoDialog
                panel={helpPanel}
                onClose={() => setHelpPanel(null)}
                onSwitchPanel={setHelpPanel}
              />

            </Box>

            {/* Betting Controls */}
            <Box sx={{
              display: "flex",
              flexDirection: "column",
              width: { xs: '100%', md: 'auto' },
              maxWidth: { xs: '400px', md: 'none' },
            }}>
              <TextFieldCurrency
                label="Bet Amount"
                variant="standard"
                value={bet}
                handleChange={handleBetChange}
              />

              <Typography color="white" sx={{ opacity: 0.8 }}>
                Current Bet Total: {formatNativeAmount(total, playChain)} {symbol}
              </Typography>

              {/* Quick Bet Buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {[1, 5, 10, 25, 50, 100].map(amount => (
                  <Button
                    key={amount}
                    onClick={() => persistChipBet(amount)}
                    sx={{
                      minWidth: '40px',
                      height: '30px',
                      py: 0,
                      backgroundColor: bet === amount ? 'primary.light' : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    {amount}
                  </Button>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                ml: { xs: 0, md: 3 },
                mt: { xs: 0, md: 1 },
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Tooltip title={<Typography>Undo last bet</Typography>}>
                  <span style={{ display: 'inline-flex' }}>
                    <IconButton
                      disabled={events.length === 0 || submitDisabled}
                      onClick={revertEvent}
                    >
                      <UndoIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={<Typography>Clear bet</Typography>}>
                  <span style={{ display: 'inline-flex' }}>
                    <IconButton
                      disabled={submitDisabled}
                      onClick={clearBet}
                    >
                      <ClearIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              <Box sx={{ mt: 3 }}>
                {rollResult >= 0 ? (
                  <Box>
                    <Button onClick={handleGoAgain}>Play Again</Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                      Your bets stay on the table
                    </Typography>
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography variant="h5">
                        Result: <span style={{
                          color: rollResult === 0 ? '#14D854' :
                            [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(rollResult) ? '#d82633' : 'white'
                        }}>{rollResult}</span>
                      </Typography>

                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Button
                      disabled={total === 0 || submitDisabled}
                      loading={submitDisabled}
                      onClick={lockBet}
                    >
                      {total > 0
                        ? `Place Bet (${formatNativeAmount(total, playChain)} ${symbol})`
                        : `Place Bet (${symbol})`}
                    </Button>
                    {submitDisabled && rollResult < 0 && (
                      <Typography color="white" sx={{ opacity: 0.8 }}>
                        Dice rolling, please wait...
                      </Typography>
                    )}
                    {total > 0 && !submitDisabled && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                        {(() => {
                          const activeBetCount = [red, black, odd, even, over, under].filter(x => x > 0).length +
                            dozens.filter(x => x > 0).length +
                            columns.filter(x => x > 0).length +
                            inside.filter(x => x > 0).length;
                          return activeBetCount > 1
                            ? `${activeBetCount} bets selected`
                            : `1 bet selected`;
                        })()}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Stats Only */}
            <Box sx={{ width: { xs: '100%', md: '260px' }, mt: { xs: 1, md: 0 }, flexShrink: 0 }}>
              <BettingStats history={bettingHistory} chain={playChain} symbol={symbol} />
            </Box>
          </Box>
        </Box>


        {/* New enhanced sections */}
        <Box sx={{
          mt: { xs: 4, md: 6 },
          px: { xs: 2, md: 4 },
          mx: 'auto',
          maxWidth: '1600px',
        }}>
          <Box sx={{ mb: { xs: 8, md: 10 } }}>
            <RouletteGameIntro />
          </Box>

          {/* First row - Strategy Guide and Win Probabilities (most important for players) */}
          <Grid container spacing={3} sx={{ mb: { xs: 5, md: 6 } }}>
            <Grid xs={12} md={7}>
              <div id="strategy" className="scroll-mt-16">
                <StrategyGuide />
              </div>
            </Grid>
            <Grid xs={12} md={5}>
              <WinProbabilities />
            </Grid>
          </Grid>

          {/* Second row - Roulette Payout (full width for clarity) */}
          <Grid container spacing={3} sx={{ mb: { xs: 5, md: 6 } }}>
            <Grid xs={12}>
              <div id="payouts" className="scroll-mt-16">
                <RoulettePayout />
              </div>
            </Grid>
          </Grid>

          {/* Third row - Roulette History and Leaderboard */}
          <Grid container spacing={3} sx={{ mb: { xs: 5, md: 6 } }}>
            <Grid xs={12} md={7}>
              <div id="history" className="scroll-mt-16">
                <RouletteHistory bettingHistory={bettingHistory} />
              </div>
            </Grid>
            <Grid xs={12} md={5}>
              <RouletteLeaderboard />
            </Grid>
          </Grid>

          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: '400px',
              left: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(104, 29, 219, 0.4) 0%, rgba(104, 29, 219, 0) 70%)',
              filter: 'blur(50px)',
              zIndex: -1,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '800px',
              right: '-100px',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(216, 38, 51, 0.3) 0%, rgba(216, 38, 51, 0) 70%)',
              filter: 'blur(70px)',
              zIndex: -1,
            }}
          />
        </Box>

        <Snackbar
          open={showNotification}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{ zIndex: 10001 }}
        >
          <MuiAlert
            onClose={handleCloseNotification}
            severity={notificationIndex === notificationSteps.RESULT_READY ? (winnings > 0 ? "success" : "error") : "info"}
            elevation={6}
            variant="filled"
            sx={{ width: '100%', backgroundColor: 'background.paper', color: 'text.primary' }}
          >
            {notificationMessage}
            {notificationIndex === notificationSteps.RESULT_READY && (
              <Typography>
                {winnings > 0
                  ? `🎉 You won ${winnings.toFixed(4)} ${symbol}!`
                  : winnings < 0
                    ? `💸 You lost ${Math.abs(winnings).toFixed(4)} ${symbol}!`
                    : "🤝 Break even!"}
              </Typography>
            )}
          </MuiAlert>
        </Snackbar>

        {/* Sound control button - add near the top of the UI */}
        <Box sx={{ position: 'fixed', top: 15, right: 15, zIndex: 100 }}>
          <IconButton
            onClick={toggleSound}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
            }}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </IconButton>
        </Box>

        {/* Snackbar for play feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={isInsufficientBalanceAlert(snackbarPayload) ? 9000 : 6000}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ '& .MuiSnackbarContent-root': { p: 0, bgcolor: 'transparent', boxShadow: 'none' } }}
        >
          <Box>
            {isInsufficientBalanceAlert(snackbarPayload) ? (
              <PlayBalanceAlert
                have={snackbarPayload.have}
                need={snackbarPayload.need}
                more={snackbarPayload.more}
                symbol={snackbarPayload.symbol}
                hint={snackbarPayload.hint}
                onClose={closeSnackbar}
              />
            ) : (
              <MuiAlert
                onClose={closeSnackbar}
                severity={snackbarSeverity}
                elevation={8}
                variant="filled"
                sx={{
                  maxWidth: 400,
                  width: '100%',
                  bgcolor: '#1a0a22',
                  color: 'white',
                  border: '1px solid rgba(104, 29, 219, 0.35)',
                  '& .MuiAlert-icon': { color: snackbarSeverity === 'error' ? '#ff8a80' : '#b794f6' },
                }}
              >
                {snackbarPayload?.message}
              </MuiAlert>
            )}
          </Box>
        </Snackbar>


      </div>
    </ThemeProvider>
  );
}
