"use client";

import React, { useState } from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Avatar, Chip, Divider, Fade } from '@mui/material';
import { FaLightbulb, FaChevronDown, FaStar, FaExclamationTriangle, FaChartLine, FaQuestion, FaCalculator, FaBookOpen, FaCheck, FaTimes } from 'react-icons/fa';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';
import { houseEdgePercent } from '@/lib/houseEdge';

const WheelStrategyGuide = () => {
  const { chainLabel } = usePlayCurrency();
  const edge = houseEdgePercent('wheel');
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const strategies = [
    {
      id: 'strategy-1',
      title: 'Low Risk Approach',
      difficulty: 'Beginner',
      effectiveness: 3,
      risk: 'Low',
      color: '#14D854',
      description: 'This strategy focuses on consistent small wins by sticking to the low-risk wheel setting. It offers the highest probability of winning but with smaller multipliers.',
      pros: ['More frequent wins', 'Lower bankroll volatility', 'Good for beginners to learn the game'],
      cons: ['Lower potential payouts', 'Slower bankroll growth', 'Less exciting gameplay experience'],
      example: 'Set the wheel to Low Risk, bet a small percentage of your bankroll (1-3%), and aim for consistent small wins rather than big payouts.'
    },
    {
      id: 'strategy-2',
      title: 'Medium Risk Balancer',
      difficulty: 'Intermediate',
      effectiveness: 4,
      risk: 'Medium',
      color: '#FFA500',
      description: 'A balanced approach that uses the medium risk setting to get a mix of reasonable win probability with decent multipliers. This strategy aims to balance risk and reward.',
      pros: ['Good balance of win frequency and payout size', 'Moderate bankroll growth potential', 'More exciting than low risk'],
      cons: ['Higher variance than low risk', 'Requires larger bankroll management', 'Losing streaks can be longer'],
      example: 'Use the Medium Risk wheel, bet 2-5% of your bankroll, and be prepared for some losses between wins. Consider taking profits after significant wins.'
    },
    {
      id: 'strategy-3',
      title: 'High Risk Hunter',
      difficulty: 'Advanced',
      effectiveness: 3,
      risk: 'High',
      color: '#d82633',
      description: 'This aggressive strategy targets the high multipliers on the high-risk wheel. It accepts frequent losses for the chance at large payouts that can quickly multiply your bankroll.',
      pros: ['Potential for massive wins', 'Can grow bankroll quickly when lucky', 'Most exciting gameplay experience'],
      cons: ['High probability of losing streaks', 'Requires strict bankroll management', 'Can deplete funds quickly without discipline'],
      example: 'Select High Risk, bet only 1-2% of your bankroll per spin, and be prepared for many losses. The goal is to hit a few big multipliers that make up for all the losses.'
    },
    {
      id: 'strategy-4',
      title: 'Martingale Adaptation',
      difficulty: 'Advanced',
      effectiveness: 2,
      risk: 'High',
      color: '#681DDB',
      description: 'A modified Martingale system where you double your bet after each loss, but only on the low-risk wheel to improve win probability. Switch back to your base bet after any win.',
      pros: ['Can recover previous losses with a single win', 'Works well during short sessions', 'Simple concept to follow'],
      cons: ['Requires large bankroll', 'Table limits can prevent proper execution', 'A long losing streak can be devastating'],
      example: 'Start with a small base bet (e.g., 0.001 ETH) on Low Risk. After each loss, double your bet. After any win, return to your base bet amount.'
    },
    {
      id: 'strategy-5',
      title: 'Risk Ladder Climbing',
      difficulty: 'Intermediate',
      effectiveness: 3,
      risk: 'Mixed',
      color: '#4361EE',
      description: 'This strategy involves starting with low risk and progressively moving to higher risk levels as you accumulate wins. It aims to protect your initial bankroll while allowing for bigger wins later.',
      pros: ['Protects initial bankroll', 'Allows for bigger wins after securing profit', 'Adaptable to different situations'],
      cons: ['Requires tracking wins and losses', 'Needs discipline to switch risk levels properly', 'Complex decision-making during play'],
      example: 'Start with Low Risk until you\'ve won 20% over your starting bankroll. Then switch to Medium Risk until you\'ve won another 20%. Finally, use High Risk with a portion of your profits.'
    }
  ];

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
        }
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
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        <FaBookOpen color="#FFA500" size={22} />
        <span style={{ background: 'linear-gradient(90deg, #FFFFFF, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Spin the Wheel Strategy Guide
        </span>
      </Typography>
      
      <Typography 
        variant="body2" 
        color="rgba(255,255,255,0.7)"
        sx={{ mb: 3 }}
      >
        Popular betting strategies to enhance your Fortune Wheel experience. Remember that no strategy can overcome the house edge entirely.
      </Typography>

      {strategies.map((strategy, index) => (
        <Fade 
          in={true} 
          key={strategy.id}
          style={{ 
            transformOrigin: '0 0 0',
            transitionDelay: `${index * 100}ms`
          }}
        >
          <Accordion 
            expanded={expanded === strategy.id} 
            onChange={handleChange(strategy.id)}
            sx={{
              backgroundColor: 'transparent',
              backgroundImage: 'none',
              boxShadow: 'none',
              mb: 2,
              '&:before': {
                display: 'none',
              },
              '& .MuiAccordionSummary-root': {
                background: `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(${parseInt(strategy.color.slice(1, 3), 16)}, ${parseInt(strategy.color.slice(3, 5), 16)}, ${parseInt(strategy.color.slice(5, 7), 16)}, 0.2) 100%)`,
                borderRadius: expanded === strategy.id ? '12px 12px 0 0' : '12px',
                border: `1px solid ${strategy.color}50`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }
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
                }
              }
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
                    border: '1px solid rgba(255,255,255,0.2)'
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
                        height: 24
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
                        bgcolor: strategy.risk === 'High' ? 'rgba(216, 38, 51, 0.2)' : 
                                strategy.risk === 'Medium' ? 'rgba(255, 165, 0, 0.2)' : 
                                'rgba(20, 216, 84, 0.2)', 
                        color: strategy.risk === 'High' ? '#d82633' : 
                               strategy.risk === 'Medium' ? '#FFA500' : 
                               '#14D854',
                        border: `1px solid ${strategy.risk === 'High' ? '#d8263340' : 
                                          strategy.risk === 'Medium' ? '#FFA50040' : 
                                          '#14D85440'}`,
                        height: 24
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
                    border: '1px solid rgba(20, 216, 84, 0.2)'
                  }}
                >
                  <Typography variant="subtitle2" color="#14D854" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FaCheck color="#14D854" />
                    Advantages
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {strategy.pros.map((pro, i) => (
                      <Typography component="li" key={i} variant="body2" color="rgba(255,255,255,0.8)" sx={{ mb: 0.5 }}>
                        {pro}
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
                    border: '1px solid rgba(216, 38, 51, 0.2)'
                  }}
                >
                  <Typography variant="subtitle2" color="#d82633" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FaTimes color="#d82633" />
                    Disadvantages
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {strategy.cons.map((con, i) => (
                      <Typography component="li" key={i} variant="body2" color="rgba(255,255,255,0.8)" sx={{ mb: 0.5 }}>
                        {con}
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
                  gap: 2
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
      ))}
      
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
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }}
      >
        <FaExclamationTriangle color="#d82633" size={20} style={{ flexShrink: 0 }} />
        <Typography variant="body2" color="rgba(255,255,255,0.8)">
          <strong>Important:</strong> These strategies can enhance entertainment value. Our {chainLabel}-powered wheel uses provably fair randomness with verifiable outcomes and a {edge.toFixed(1)}% house edge. Always gamble responsibly and set clear limits for your play.
        </Typography>
      </Box>
    </Paper>
  );
};

export default WheelStrategyGuide;
