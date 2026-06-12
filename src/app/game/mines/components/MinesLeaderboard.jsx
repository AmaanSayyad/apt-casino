"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useGameLeaderboard } from '@/hooks/useGameLeaderboard';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';
import Link from 'next/link';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Tooltip,
  LinearProgress,
  IconButton,
  Collapse,
  Skeleton,
} from '@mui/material';
import {
  FaTrophy,
  FaFire,
  FaMedal,
  FaCrown,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaGlobe,
  FaStar,
  FaSyncAlt,
} from 'react-icons/fa';

// ---------- helpers --------------------------------------------------------------

function shortenWallet(addr) {
  if (!addr || typeof addr !== 'string') return '';
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function compactApt(n) {
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (abs >= 1) return n.toFixed(2);
  if (abs >= 0.001) return n.toFixed(4);
  return n.toFixed(6);
}

function timeAgo(ms) {
  if (!ms || typeof ms !== 'number') return null;
  const diff = Date.now() - ms;
  if (diff < 0) return 'just now';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const BADGE_BY_RANK = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];

function BadgeIcon({ type }) {
  switch (type) {
    case 'diamond':
      return <FaCrown style={{ color: '#00bcd4' }} />;
    case 'platinum':
      return <FaCrown style={{ color: '#e0e0e0' }} />;
    case 'gold':
      return <FaStar style={{ color: '#ffc107' }} />;
    case 'silver':
      return <FaMedal style={{ color: '#b0bec5' }} />;
    case 'bronze':
      return <FaMedal style={{ color: '#bf8970' }} />;
    default:
      return null;
  }
}

function StatBlock({ label, value, accent }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: { xs: 72, sm: 110 } }}>
      <Typography variant="caption" color="rgba(255,255,255,0.5)">
        {label}
      </Typography>
      <Typography variant="body2" color={accent || 'white'} fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}

// ---------- component ------------------------------------------------------------

const MinesLeaderboard = () => {
  const { symbol } = usePlayCurrency();
  const { rows, loading, error, lastUpdated, refresh: load } = useGameLeaderboard('mines');
  const [expanded, setExpanded] = useState({});

  const handleExpandClick = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Re-render every 30s so the "X minutes ago" labels stay fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const updatedAgo = useMemo(() => timeAgo(lastUpdated), [lastUpdated]);

  return (
    <Paper
      elevation={5}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(9, 0, 5, 0.9) 0%, rgba(25, 5, 30, 0.85) 100%)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(104, 29, 219, 0.2)',
        mb: 5,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        height: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '5px',
          background: 'linear-gradient(90deg, #681DDB, #14D854)',
        },
      }}
    >
      <Typography
        variant="h5"
        fontWeight="bold"
        gutterBottom
        sx={{
          borderBottom: '1px solid rgba(104, 29, 219, 0.3)',
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        <FaTrophy color="#FFA500" size={22} />
        <span
          style={{
            background: 'linear-gradient(90deg, #FFFFFF, #ffb3b3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Mines Leaderboard
        </span>
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 3 }}>
        <Typography variant="body2" color="rgba(255,255,255,0.7)">
          Top players by net winnings
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={<FaGlobe size={12} />}
            label="Global"
            size="small"
            sx={{ backgroundColor: 'rgba(104, 29, 219, 0.3)', color: 'white', fontWeight: 'medium' }}
          />
          <Tooltip title="Refresh">
            <span style={{ display: 'inline-flex' }}>
              <IconButton
                size="small"
                onClick={load}
                disabled={loading}
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  '&:hover': { color: 'white', backgroundColor: 'rgba(104, 29, 219, 0.2)' },
                }}
              >
                <FaSyncAlt size={12} className={loading ? 'spin' : ''} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Leaderboard Entries */}
      <Box>
        {loading && rows.length === 0 &&
          [0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={68}
              sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.06)' }}
            />
          ))}

        {!loading && !error && rows.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'rgba(255,255,255,0.6)' }}>
            <Typography variant="body2">No Mines rounds played yet.</Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.4)' }}>
              Be the first — your wallet appears here once you play Mines.
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ textAlign: 'center', py: 4, color: '#ff8a80' }}>
            <Typography variant="body2">Could not load leaderboard.</Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.4)' }}>
              {error}
            </Typography>
          </Box>
        )}

        {rows.map((player, index) => {
          const id = player.wallet || `r${index}`;
          const handle =
            typeof player.handle === 'string' && player.handle.trim() && !player.handle.includes('[object')
              ? player.handle.trim()
              : shortenWallet(player.wallet);
          const winrateUnit = Math.max(0, Math.min(100, Math.round((player.winrate || 0) * 100)));
          const badge = BADGE_BY_RANK[index] || null;
          const lastSeen = timeAgo(player.lastWinMs || player.lastBetMs);
          // Win streak is not yet on the aggregated API; suppressed in the UI when missing.
          const winStreak = 0;

          return (
            <Box key={id} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1.5, sm: 0 },
                  p: { xs: 1.5, sm: 2 },
                  background:
                    index === 0
                      ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.08), rgba(9, 0, 5, 0.3))'
                      : index === 1
                      ? 'linear-gradient(90deg, rgba(224, 224, 224, 0.05), rgba(9, 0, 5, 0.3))'
                      : index === 2
                      ? 'linear-gradient(90deg, rgba(191, 137, 112, 0.05), rgba(9, 0, 5, 0.3))'
                      : 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 2,
                  border:
                    index === 0
                      ? '1px solid rgba(255, 215, 0, 0.3)'
                      : index === 1
                      ? '1px solid rgba(224, 224, 224, 0.2)'
                      : index === 2
                      ? '1px solid rgba(191, 137, 112, 0.2)'
                      : '1px solid rgba(104, 29, 219, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background:
                      index === 0
                        ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.15), rgba(9, 0, 5, 0.4))'
                        : index === 1
                        ? 'linear-gradient(90deg, rgba(224, 224, 224, 0.1), rgba(9, 0, 5, 0.4))'
                        : index === 2
                        ? 'linear-gradient(90deg, rgba(191, 137, 112, 0.1), rgba(9, 0, 5, 0.4))'
                        : 'rgba(25, 5, 30, 0.3)',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                  },
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    backgroundColor:
                      index === 0
                        ? '#ffc107'
                        : index === 1
                        ? '#e0e0e0'
                        : index === 2
                        ? '#bf8970'
                        : 'rgba(104, 29, 219, 0.3)',
                    boxShadow:
                      index < 3
                        ? `0 0 8px ${index === 0 ? '#ffc107' : index === 1 ? '#e0e0e0' : '#bf8970'}40`
                        : 'none',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
                {/* Rank */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor:
                      index === 0
                        ? '#ffc107'
                        : index === 1
                        ? '#e0e0e0'
                        : index === 2
                        ? '#bf8970'
                        : 'rgba(104, 29, 219, 0.2)',
                    color: index < 3 ? '#000' : '#fff',
                    fontWeight: 'bold',
                    mr: 2,
                    flexShrink: 0,
                    boxShadow: index < 3 ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  {player.rank ?? index + 1}
                </Box>

                {/* Avatar and handle */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 0, sm: 3 }, flexGrow: 1, minWidth: 0 }}>
                  <Avatar
                    src={player.avatarUrl || undefined}
                    alt={handle}
                    sx={{
                      mr: 2,
                      border: index < 3 ? '2px solid #ffc107' : '1px solid rgba(104, 29, 219, 0.2)',
                      width: 40,
                      height: 40,
                      boxShadow: index < 3 ? '0 0 8px rgba(255, 193, 7, 0.5)' : 'none',
                      bgcolor: 'rgba(104, 29, 219, 0.4)',
                    }}
                  >
                    {(handle || '').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Tooltip title={player.wallet || ''}>
                        <Typography
                          fontWeight="bold"
                          color="white"
                          sx={{
                            fontSize: index === 0 ? '1.05rem' : '1rem',
                            textShadow: index < 3 ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                            maxWidth: { xs: 110, sm: 220, md: 260 },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {handle}
                        </Typography>
                      </Tooltip>
                      <BadgeIcon type={badge} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                      <Tooltip title="Win rate">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={winrateUnit}
                            sx={{
                              width: 50,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #14D854, #00bcd4)',
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Typography variant="caption" color="rgba(255,255,255,0.7)">
                            {winrateUnit}%
                          </Typography>
                        </Box>
                      </Tooltip>

                      {winStreak > 0 && (
                        <Tooltip title={`${winStreak} win streak`}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.25,
                              borderRadius: 5,
                              backgroundColor: 'rgba(216, 38, 51, 0.1)',
                              border: '1px solid rgba(216, 38, 51, 0.1)',
                            }}
                          >
                            <FaFire color="#d82633" size={12} />
                            <Typography variant="caption" color="#ff8a80" fontWeight="bold">
                              {winStreak}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}

                      {lastSeen && (
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">
                          {lastSeen}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'space-between', sm: 'flex-end' },
                    width: { xs: '100%', sm: 'auto' },
                    ml: { xs: 0, sm: 'auto' },
                    pl: { xs: '52px', sm: 0 },
                  }}
                >
                {/* Winnings */}
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, mr: 1, minWidth: { xs: 0, sm: 88 } }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Net P&amp;L
                  </Typography>
                  <Typography
                    fontWeight="bold"
                    sx={{
                      background:
                        index === 0 ? 'linear-gradient(90deg, #14D854, #00e676)' : 'none',
                      WebkitBackgroundClip: index === 0 ? 'text' : 'none',
                      WebkitTextFillColor: index === 0 ? 'transparent' : 'none',
                      color:
                        index === 0
                          ? 'none'
                          : player.pnlApt >= 0
                          ? '#14D854'
                          : '#ff8a80',
                      fontSize: index === 0 ? '1.05rem' : '1rem',
                    }}
                  >
                    {player.pnlApt >= 0 ? '+' : ''}
                    {compactApt(player.pnlApt)} {symbol}
                  </Typography>
                </Box>

                {/* Expand button */}
                <IconButton
                  size="small"
                  onClick={() => handleExpandClick(id)}
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': { backgroundColor: 'rgba(104, 29, 219, 0.2)', color: 'white' },
                  }}
                >
                  {expanded[id] ? <FaChevronUp /> : <FaChevronDown />}
                </IconButton>
                </Box>

                {/* Expandable per-wallet stats */}
                <Collapse in={!!expanded[id]} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 2 },
                      pb: { xs: 1.5, sm: 2 },
                      pt: 0,
                      borderTop: '1px dashed rgba(104, 29, 219, 0.2)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: { xs: 2, md: 3 },
                      justifyContent: { xs: 'space-between', md: 'space-between' },
                      width: '100%',
                    }}
                  >
                    <StatBlock label="Bets" value={(player.bets ?? 0).toLocaleString()} />
                    <StatBlock label="Wins" value={(player.wins ?? 0).toLocaleString()} />
                    <StatBlock
                      label="Wagered"
                      value={`${compactApt(player.wageredApt || 0)} ${symbol}`}
                    />
                    <StatBlock
                      label="Biggest Win"
                      value={`${compactApt(player.biggestWinApt || 0)} ${symbol}`}
                      accent="#14D854"
                    />
                  </Box>
                </Collapse>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: '1px solid rgba(104, 29, 219, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="rgba(255,255,255,0.5)">
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#14D854',
              mr: 1,
              verticalAlign: 'middle',
              boxShadow: '0 0 6px rgba(20,216,84,0.6)',
            }}
          />
          {updatedAgo ? `Updated ${updatedAgo} · refreshes every minute` : 'Loading on-chain data…'}
        </Typography>

        <Box
          component={Link}
          href="/leaderboard?game=mines&metric=pnl&period=all"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            textDecoration: 'none',
            '&:hover': { color: 'white', '& .arrow-icon': { transform: 'translateX(3px)' } },
          }}
        >
          <Typography variant="caption">All-time leaderboard</Typography>
          <FaChevronRight
            size={10}
            className="arrow-icon"
            style={{ transition: 'transform 0.2s ease' }}
          />
        </Box>
      </Box>

      <style jsx global>{`
        .spin { animation: whl-spin 1s linear infinite; }
        @keyframes whl-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Paper>
  );
};

export default MinesLeaderboard;
