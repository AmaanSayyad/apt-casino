"use client";
import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Button, Tooltip, Stack, Fade } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  FaChartPie,
  FaInfoCircle,
  FaThumbsUp,
  FaQuestion,
  FaChevronRight,
  FaDotCircle,
} from 'react-icons/fa';

// Illustrative probability buckets per risk profile.
// Numbers represent: rough share of drops landing in that bin family,
// based on the Plinko config tables in PlinkoGame.jsx (16-row default).
const RISK_DATA = {
  Low: [
    {
      type: 'Center hits',
      sample: '≈ 0.5×–1.1×',
      probability: 62,
      color: '#14D854',
      tip: 'Most balls drift back to the center bins. Slow, steady, low variance.',
      tag: 'Best odds',
    },
    {
      type: 'Mid bins',
      sample: '≈ 1.4×–2×',
      probability: 30,
      color: '#FFA500',
      tip: 'Light kickers that gently top up the bankroll between center hits.',
      tag: 'Frequent boost',
    },
    {
      type: 'Edge bins',
      sample: '≈ 5×–16×',
      probability: 8,
      color: '#d82633',
      tip: 'Rare side hits — small max top-end on Low risk, but they happen.',
      tag: 'Rare upside',
    },
  ],
  Medium: [
    {
      type: 'Center hits',
      sample: '≈ 0.3×–1×',
      probability: 55,
      color: '#14D854',
      tip: 'Most balls still hit center, but center pays less than 1× on Medium.',
      tag: 'Most common',
    },
    {
      type: 'Mid bins',
      sample: '≈ 1.5×–5×',
      probability: 35,
      color: '#FFA500',
      tip: 'Where the action is — frequent 2×–5× wins that swing your session.',
      tag: 'Sweet spot',
    },
    {
      type: 'Edge bins',
      sample: '≈ 10×–110×',
      probability: 10,
      color: '#d82633',
      tip: 'The hunt — 16-row Medium tops out around 110×.',
      tag: 'High reward',
    },
  ],
  High: [
    {
      type: 'Center hits',
      sample: '≈ 0.2×–0.5×',
      probability: 48,
      color: '#14D854',
      tip: 'Center is a “mostly lose” zone on High — payouts well below 1×.',
      tag: 'Loss zone',
    },
    {
      type: 'Mid bins',
      sample: '≈ 1×–9×',
      probability: 40,
      color: '#FFA500',
      tip: 'Wins live further out — you need a real bounce to land here.',
      tag: 'Win zone',
    },
    {
      type: 'Edge bins',
      sample: '≈ 26×–1000×',
      probability: 12,
      color: '#d82633',
      tip: 'Jackpot territory — 16-row High peaks at 1000× on each edge.',
      tag: 'Jackpot',
    },
  ],
};

const PlinkoWinProbabilities = ({ risk = 'Medium' }) => {
  const safeRisk = ['Low', 'Medium', 'High'].includes(risk) ? risk : 'Medium';
  const [sortBy, setSortBy] = useState('probability'); // 'probability' | 'reward'

  const sortedData = useMemo(() => {
    const data = RISK_DATA[safeRisk] || RISK_DATA.Medium;
    const arr = [...data];
    if (sortBy === 'probability') {
      arr.sort((a, b) => b.probability - a.probability);
    } else {
      arr.sort((a, b) => {
        const peakA = parseFloat(String(a.sample).split('–').pop());
        const peakB = parseFloat(String(b.sample).split('–').pop());
        return (peakB || 0) - (peakA || 0);
      });
    }
    return arr;
  }, [safeRisk, sortBy]);

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
        <FaChartPie color="#681DDB" size={22} />
        <span
          style={{
            background: 'linear-gradient(90deg, #FFFFFF, #14D854)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
        Win Probabilities
        </span>
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="rgba(255,255,255,0.7)">
          Where the ball tends to land at{' '}
          <Box component="span" sx={{ color: '#FFA500', fontWeight: 600 }}>
            {safeRisk} risk
          </Box>{' '}
          · 16 rows (illustrative)
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '20px',
            padding: '2px',
            border: '1px solid rgba(104, 29, 219, 0.2)',
          }}
        >
          <Button
            size="small"
            onClick={() => setSortBy('probability')}
            sx={{
              fontSize: '0.75rem',
              color: sortBy === 'probability' ? 'white' : 'rgba(255,255,255,0.6)',
              backgroundColor: sortBy === 'probability' ? 'rgba(104, 29, 219, 0.3)' : 'transparent',
              borderRadius: '18px',
              minWidth: 'auto',
              p: 0.5,
              px: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor:
                  sortBy === 'probability' ? 'rgba(104, 29, 219, 0.4)' : 'rgba(104, 29, 219, 0.1)',
              },
            }}
          >
            By Chance
          </Button>
          <Button
            size="small"
            onClick={() => setSortBy('reward')}
            sx={{
              fontSize: '0.75rem',
              color: sortBy === 'reward' ? 'white' : 'rgba(255,255,255,0.6)',
              backgroundColor: sortBy === 'reward' ? 'rgba(104, 29, 219, 0.3)' : 'transparent',
              borderRadius: '18px',
              minWidth: 'auto',
              p: 0.5,
              px: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor:
                  sortBy === 'reward' ? 'rgba(104, 29, 219, 0.4)' : 'rgba(104, 29, 219, 0.1)',
              },
            }}
          >
            By Reward
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {sortedData.map((item, index) => (
          <Fade in key={item.type} style={{ transformOrigin: '0 0 0', transitionDelay: `${index * 80}ms` }}>
            <Grid xs={12}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(${parseInt(
                    item.color.slice(1, 3),
                    16,
                  )}, ${parseInt(item.color.slice(3, 5), 16)}, ${parseInt(
                    item.color.slice(5, 7),
                    16,
                  )}, 0.05) 100%)`,
                  border: `1px solid ${item.color}40`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 5px 15px rgba(0,0,0,0.3), 0 0 10px ${item.color}30`,
                    borderColor: `${item.color}60`,
                    '& .hover-arrow': { opacity: 1, transform: 'translateX(0)' },
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="white" sx={{ mb: 0.5 }}>
                      {item.type}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="rgba(255,255,255,0.7)"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      Multiplier range{' '}
                      <Box component="span" sx={{ color: item.color, fontWeight: 700, ml: 0.5 }}>
                        {item.sample}
                      </Box>
                    </Typography>
                  </Box>
                  <Tooltip
                    title={<Typography variant="body2">{item.tip}</Typography>}
                    arrow
                    placement="top"
                  >
                    <Box
                      sx={{
                        cursor: 'help',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                        '&:hover': { backgroundColor: 'rgba(104, 29, 219, 0.2)' },
                      }}
                    >
                      <FaInfoCircle color="rgba(255,255,255,0.6)" size={14} />
                    </Box>
                  </Tooltip>
                </Box>

                <Box sx={{ position: 'relative', mt: 2, mb: 1 }}>
                  <Box
                    sx={{
                      height: '12px',
                      width: '100%',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, item.probability))}%`,
                        background: `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
                        borderRadius: '6px',
                        position: 'relative',
                        boxShadow: `0 0 10px ${item.color}80`,
                        transition: 'width 1s cubic-bezier(0.65, 0, 0.35, 1)',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          border: `1px solid ${item.color}80`,
                        }}
                      >
                        <FaDotCircle color={item.color} size={14} />
                      </Box>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="white"
                        sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      >
                        {item.probability}%
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {item.probability >= 40 && <FaThumbsUp color="#14D854" />}
                      {item.probability >= 15 && item.probability < 40 && <FaThumbsUp color="#FFA500" />}
                      {item.probability < 15 && <FaQuestion color="#d82633" />}
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={
                          item.probability >= 40
                            ? '#14D854'
                            : item.probability >= 15
                            ? '#FFA500'
                            : '#d82633'
                        }
                      >
                        {item.tag}
      </Typography>
                    </Box>

                    <FaChevronRight
                      className="hover-arrow"
                      color="rgba(255,255,255,0.4)"
                      size={14}
                      style={{
                        opacity: 0,
                        transform: 'translateX(-10px)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Fade>
        ))}
      </Grid>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mt: 3,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(104, 29, 219, 0.05) 0%, rgba(104, 29, 219, 0.15) 100%)',
          border: '1px solid rgba(104, 29, 219, 0.15)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        <FaInfoCircle color="#681DDB" style={{ flexShrink: 0 }} />
        <Typography variant="body2" color="rgba(255,255,255,0.8)">
          Probabilities are illustrative — actual outcomes depend on physics and bin landing. Higher risk
          trades hit-rate for top-end multiplier.
        </Typography>
      </Box>
    </Paper>
  );
};

export default PlinkoWinProbabilities;
