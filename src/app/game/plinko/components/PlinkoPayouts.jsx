"use client";
import React from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { FaCoins, FaExclamationTriangle } from 'react-icons/fa';
import { applyHouseEdgeToMultiplier, houseEdgePercent } from '@/lib/houseEdge';

function adjustMultiplier(rawLabel) {
  const raw = parseFloat(String(rawLabel).replace('x', ''));
  if (!Number.isFinite(raw) || raw <= 0) return rawLabel;
  const v = applyHouseEdgeToMultiplier(raw, 'plinko');
  return `${v.toFixed(2).replace(/\.?0+$/, '')}x`;
}

// Compact, illustrative payout table — multipliers shown are *post* house edge,
// so they match what actually pays out in PlinkoGame.jsx (16-row tables).
const PAYOUT_ROWS = [
  {
    profile: 'Low Risk',
    rows: '16',
    description: 'Mild swings, center-loaded',
    color: '#14D854',
    edge: '0.5×',
    center: '1×',
    midSamples: ['1.1x', '1.4x', '2x'],
    edgeSamples: ['5.6x', '9x', '16x'],
    maxRaw: 16,
  },
  {
    profile: 'Medium Risk',
    rows: '16',
    description: 'Balanced — hunt for 10×–100×',
    color: '#FFA500',
    edge: '0.3×',
    center: '0.5–1×',
    midSamples: ['1.5x', '3x', '5x'],
    edgeSamples: ['10x', '41x', '110x'],
    maxRaw: 110,
  },
  {
    profile: 'High Risk',
    rows: '16',
    description: 'Edge-heavy — degen jackpot mode',
    color: '#d82633',
    edge: '0.2×',
    center: '0.2–1×',
    midSamples: ['2x', '4x', '9x'],
    edgeSamples: ['26x', '130x', '1000x'],
    maxRaw: 1000,
  },
];

const adjusted = PAYOUT_ROWS.map((row) => ({
  ...row,
  midSamples: row.midSamples.map(adjustMultiplier),
  edgeSamples: row.edgeSamples.map(adjustMultiplier),
}));

const PLINKO_EDGE_PCT = houseEdgePercent('plinko');

const PlinkoPayouts = () => {
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
          background: 'linear-gradient(90deg, #d82633, #681DDB)',
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
        <FaCoins color="#681DDB" size={22} />
        <span
          style={{
            background: 'linear-gradient(90deg, #FFFFFF, #d82633)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Plinko Payouts
        </span>
      </Typography>

      <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 3, mt: 1 }}>
        Multiplier ranges by risk profile (16 rows). All values shown are{' '}
        <Box component="span" sx={{ color: 'white', fontWeight: 600 }}>
          post house edge
        </Box>{' '}
        — i.e. exactly what you receive.
        {PLINKO_EDGE_PCT > 0 && (
          <Box component="span" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.5)' }}>
            (current edge {PLINKO_EDGE_PCT.toFixed(2)}%)
          </Box>
        )}
      </Typography>

      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: '560px' }}>
          <Grid
            container
            sx={{
              py: 1,
              px: 2,
              borderRadius: '8px 8px 0 0',
              background: 'linear-gradient(90deg, rgba(104, 29, 219, 0.2), rgba(216, 38, 51, 0.2))',
              mb: 1,
            }}
          >
            <Grid xs={2.5}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">
                Profile
              </Typography>
            </Grid>
            <Grid xs={3}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">
                Behaviour
              </Typography>
            </Grid>
            <Grid xs={1.25} sx={{ textAlign: 'center' }}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">
                Edge
              </Typography>
            </Grid>
            <Grid xs={1.25} sx={{ textAlign: 'center' }}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">
                Center
              </Typography>
            </Grid>
            <Grid xs={2} sx={{ textAlign: 'center' }}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">
                Mid bins
              </Typography>
            </Grid>
            <Grid xs={2} sx={{ textAlign: 'center' }}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">
                Edge bins
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: 'rgba(104, 29, 219, 0.15)', mb: 1 }} />

          {adjusted.map((row, idx) => (
            <React.Fragment key={row.profile}>
              <Grid
                container
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(104, 29, 219, 0.1)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Grid xs={2.5}>
                  <Typography
                    fontWeight="medium"
                    color="white"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: row.color,
                        marginRight: '8px',
                        boxShadow: `0 0 8px ${row.color}`,
                      },
                    }}
                  >
                    {row.profile}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', ml: 2, mt: 0.25, color: 'rgba(255,255,255,0.5)' }}
                  >
                    {row.rows} rows
                  </Typography>
                </Grid>
                <Grid xs={3}>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    {row.description}
                  </Typography>
                </Grid>
                <Grid xs={1.25} sx={{ textAlign: 'center' }}>
                  <Chip
                    label={row.edge}
                    size="small"
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(216, 38, 51, 0.15)',
                      color: '#ff8a80',
                      minWidth: '55px',
                      border: '1px solid rgba(216, 38, 51, 0.2)',
                    }}
                  />
                </Grid>
                <Grid xs={1.25} sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.85)" fontWeight={500}>
                    {row.center}
                  </Typography>
                </Grid>
                <Grid xs={2}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                    {row.midSamples.map((m) => (
                      <Chip
                        key={`mid-${row.profile}-${m}`}
                        label={m}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          backgroundColor: `${row.color}20`,
                          color: 'white',
                          border: `1px solid ${row.color}40`,
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid xs={2}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                    {row.edgeSamples.map((m) => (
                      <Chip
                        key={`edge-${row.profile}-${m}`}
                        label={m}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: `${row.color}33`,
                          color: 'white',
                          border: `1px solid ${row.color}`,
                          boxShadow: `0 0 6px ${row.color}40`,
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
              {idx !== adjusted.length - 1 && (
                <Divider sx={{ borderColor: 'rgba(104, 29, 219, 0.05)' }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          mt: 3,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(216, 38, 51, 0.05) 0%, rgba(216, 38, 51, 0.15) 100%)',
          border: '1px solid rgba(216, 38, 51, 0.1)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        <FaExclamationTriangle color="#d82633" size={16} style={{ flexShrink: 0 }} />
        <Typography variant="body2" color="rgba(255,255,255,0.8)">
          Multipliers vary per row count and risk — these samples track the in-game payout config.
          Higher risk means heavier weight in the edge bins (and the loss zone).
        </Typography>
      </Box>
    </Paper>
  );
};

export default PlinkoPayouts;
