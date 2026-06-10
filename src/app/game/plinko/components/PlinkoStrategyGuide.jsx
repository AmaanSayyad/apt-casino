"use client";
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Chip,
  Fade,
} from '@mui/material';
import {
  FaLightbulb,
  FaChevronDown,
  FaStar,
  FaExclamationTriangle,
  FaCalculator,
  FaBookOpen,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';

const buildStrategies = (symbol) => [
  {
    id: 's1',
    title: 'Low-Risk Grinding',
    difficulty: 'Beginner',
    effectiveness: 4,
    risk: 'Low',
    color: '#14D854',
    description:
      'Stick to Low risk with 14–16 rows and small bet sizes. Ball lands near the center most of the time, paying around 1× — perfect for grinding long sessions with low variance and small bonus boosts.',
    pros: ['Low variance', 'Beginner friendly', 'Sustainable bankroll usage'],
    cons: ['Smaller peak payouts', 'Slow profit growth'],
    example: `Risk: Low · Rows: 16 · Bet: 0.1–0.25 ${symbol}. Play many rounds, stop when up 10–15%.`,
  },
  {
    id: 's2',
    title: 'Medium-Risk Balance',
    difficulty: 'Intermediate',
    effectiveness: 3,
    risk: 'Medium',
    color: '#FFA500',
    description:
      'Medium risk with 12–15 rows balances frequent small wins against occasional 4×–10× outliers. Good for players who want excitement without going full degen.',
    pros: ['Balanced risk/reward', 'Exciting outliers', 'Reasonable hit-rate'],
    cons: ['Still volatile on downswings', 'Needs disciplined stop-loss'],
    example: `Risk: Medium · Rows: 15 · Bet: 0.25–0.5 ${symbol} · Stop-loss: −20%, Take-profit: +30%.`,
  },
  {
    id: 's3',
    title: 'High-Risk Hunting',
    difficulty: 'Advanced',
    effectiveness: 2,
    risk: 'High',
    color: '#d82633',
    description:
      'High risk with 14–16 rows pushes mass into the edge slots — pay 0.2× most of the time, chase 100×+ outliers. Bankroll discipline is everything.',
    pros: ['Massive top-end multipliers', 'Adrenaline gameplay', 'Big-win highlights'],
    cons: ['Brutal variance', 'Long losing streaks expected'],
    example: `Risk: High · Rows: 16 · Flat bet: 0.05–0.1 ${symbol} · Hard stop after 50 drops.`,
  },
];

const PlinkoStrategyGuide = () => {
  const { symbol } = usePlayCurrency();
  const strategies = buildStrategies(symbol);
  const [expanded, setExpanded] = useState('s1');
  const handleChange = (panel) => (_event, isExpanded) => {
    if (isExpanded) setExpanded(panel);
  };

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
          background: 'linear-gradient(90deg, #FFA500, #681DDB)',
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
        <FaBookOpen color="#FFA500" size={22} />
        <span
          style={{
            background: 'linear-gradient(90deg, #FFFFFF, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Plinko Strategy Guide
        </span>
      </Typography>

      <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 3 }}>
        Popular Plinko approaches. These shape variance, not RTP — the house edge is built into the
        multiplier table.
      </Typography>

      {strategies.map((strategy, index) => {
        const r = parseInt(strategy.color.slice(1, 3), 16);
        const g = parseInt(strategy.color.slice(3, 5), 16);
        const b = parseInt(strategy.color.slice(5, 7), 16);

        const riskChipBg =
          strategy.risk === 'High'
            ? 'rgba(216, 38, 51, 0.2)'
            : strategy.risk === 'Medium'
            ? 'rgba(255, 165, 0, 0.2)'
            : 'rgba(20, 216, 84, 0.2)';
        const riskChipColor =
          strategy.risk === 'High' ? '#d82633' : strategy.risk === 'Medium' ? '#FFA500' : '#14D854';
        const riskChipBorder =
          strategy.risk === 'High'
            ? '#d8263340'
            : strategy.risk === 'Medium'
            ? '#FFA50040'
            : '#14D85440';

        return (
          <Fade in key={strategy.id} style={{ transformOrigin: '0 0 0', transitionDelay: `${index * 100}ms` }}>
            <Accordion
              expanded={expanded === strategy.id}
              onChange={handleChange(strategy.id)}
              sx={{
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                boxShadow: 'none',
                mb: 2,
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  background: `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(${r}, ${g}, ${b}, 0.2) 100%)`,
                  borderRadius: expanded === strategy.id ? '12px 12px 0 0' : '12px',
                  border: `1px solid ${strategy.color}50`,
                  transition: 'all 0.3s ease',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.4)' },
                },
                '& .MuiAccordionDetails-root': {
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '0 0 12px 12px',
                  borderLeft: `1px solid ${strategy.color}50`,
                  borderRight: `1px solid ${strategy.color}50`,
                  borderBottom: `1px solid ${strategy.color}50`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: strategy.color,
                  },
                },
              }}
            >
              <AccordionSummary
                expandIcon={<FaChevronDown color="white" />}
                aria-controls={`${strategy.id}-content`}
                id={`${strategy.id}-header`}
                sx={{
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    color: 'white',
                    transition: 'transform 0.3s',
                    transform: expanded === strategy.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Avatar
                    sx={{
                      bgcolor: strategy.color,
                      width: 40,
                      height: 40,
                      boxShadow: `0 0 10px ${strategy.color}80`,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <FaLightbulb />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      color="white"
                      fontWeight="bold"
                      sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                    >
                      {strategy.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={strategy.difficulty}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.3)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.1)',
                          height: 24,
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="rgba(255,255,255,0.7)">
                          Effectiveness:
                        </Typography>
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            size={12}
                            color={i < strategy.effectiveness ? '#FFA500' : 'rgba(255,255,255,0.2)'}
                          />
                        ))}
                      </Box>
                      <Chip
                        label={`Risk: ${strategy.risk}`}
                        size="small"
                        sx={{
                          bgcolor: riskChipBg,
                          color: riskChipColor,
                          border: `1px solid ${riskChipBorder}`,
                          height: 24,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph color="rgba(255,255,255,0.9)" sx={{ mb: 2 }}>
                  {strategy.description}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(20, 216, 84, 0.1)',
                      border: '1px solid rgba(20, 216, 84, 0.2)',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="#14D854"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                    >
                      <FaCheck color="#14D854" />
                      Advantages
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {strategy.pros.map((p, i) => (
                        <Typography
                          component="li"
                          key={i}
                          variant="body2"
                          color="rgba(255,255,255,0.8)"
                          sx={{ mb: 0.5 }}
                        >
                          {p}
                        </Typography>
                      ))}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(216, 38, 51, 0.1)',
                      border: '1px solid rgba(216, 38, 51, 0.2)',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="#d82633"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                    >
                      <FaTimes color="#d82633" />
                      Disadvantages
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {strategy.cons.map((c, i) => (
                        <Typography
                          component="li"
                          key={i}
                          variant="body2"
                          color="rgba(255,255,255,0.8)"
                          sx={{ mb: 0.5 }}
                        >
                          {c}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    border: '1px solid rgba(255, 165, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                >
                  <FaCalculator color="#FFA500" style={{ marginTop: '3px' }} />
                  <Box>
                    <Typography variant="subtitle2" color="#FFA500" sx={{ mb: 1 }}>
                      Example:
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.8)">
                      {strategy.example}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Fade>
        );
      })}

      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(216, 38, 51, 0.05) 0%, rgba(216, 38, 51, 0.15) 100%)',
          border: '1px solid rgba(216, 38, 51, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        <FaExclamationTriangle color="#d82633" size={20} style={{ flexShrink: 0 }} />
        <Typography variant="body2" color="rgba(255,255,255,0.8)">
          <strong>Important:</strong> Strategies shape variance only — the house edge stays. Set
          stop-loss / take-profit limits and play responsibly.
        </Typography>
      </Box>
    </Paper>
  );
};

export default PlinkoStrategyGuide;
