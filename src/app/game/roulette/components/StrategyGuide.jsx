"use client";
import React, { useState } from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Avatar, Chip, Divider, Fade } from '@mui/material';
import { FaLightbulb, FaChevronDown, FaStar, FaExclamationTriangle, FaChartLine, FaQuestion, FaCalculator, FaBookOpen, FaCheck, FaTimes } from 'react-icons/fa';

const StrategyGuide = () => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const strategies = [
    {
      id: 'strategy-1',
      title: 'Martingale System',
      difficulty: 'Beginner',
      effectiveness: 4,
      risk: 'High',
      color: '#d82633',
      description: 'The Martingale strategy involves doubling your bet after each loss, so when you eventually win, you recover all previous losses plus a small profit equal to your original bet.',
      pros: ['Simple to understand and execute', 'Can be effective in short sessions', 'Works with even-money bets (Red/Black, Odd/Even)'],
      cons: ['Requires a large bankroll', 'Table limits can prevent doubling after several losses', 'A losing streak can deplete your funds quickly'],
      example: 'Start with $10 on Red. If you lose, bet $20 on Red. If you lose again, bet $40, then $80, and so on until you win.'
    },
    {
      id: 'strategy-2',
      title: 'D\'Alembert System',
      difficulty: 'Intermediate',
      effectiveness: 3,
      risk: 'Medium',
      color: '#681DDB',
      description: 'A gentler progression system where you increase your bet by one unit after a loss and decrease it by one unit after a win. This approach is less aggressive than Martingale.',
      pros: ['Lower risk than Martingale', 'Doesn\'t require large bankroll', 'More sustainable for longer sessions'],
      cons: ['Slower recovery from losses', 'Still vulnerable to long losing streaks', 'Lower potential short-term gains'],
      example: 'Start with $10 on Black. If you win, bet $9 next. If you lose, bet $11 next. Continue adding after losses and subtracting after wins.'
    },
    {
      id: 'strategy-3',
      title: 'Fibonacci System',
      difficulty: 'Intermediate',
      effectiveness: 3,
      risk: 'Medium',
      color: '#7209B7',
      description: 'Based on the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13...), you move one step forward in the sequence after a loss and two steps back after a win.',
      pros: ['More measured progression than Martingale', 'Can recover losses with fewer wins', 'Mathematical approach appeals to some players'],
      cons: ['Complex to track during play', 'Can still lead to large bets after losing streaks', 'Requires discipline to follow correctly'],
      example: 'Using units: Bet 1 unit. If you lose, bet 1 again. If you lose again, bet 2, then 3, then 5, etc. After a win, move back two numbers in the sequence.'
    },
    {
      id: 'strategy-4',
      title: 'James Bond Strategy',
      difficulty: 'Advanced',
      effectiveness: 2,
      risk: 'High',
      color: '#4361EE',
      description: 'A flat betting system that covers more than half the table. Place $140 on high numbers (19-36), $50 on six numbers (13-18), and $10 on zero for insurance.',
      pros: ['Covers 25 numbers out of 37', 'Can provide exciting gameplay', 'Fixed betting amount (no progression)'],
      cons: ['Requires larger initial bet ($200 total)', 'Doesn\'t guarantee a profit', 'House edge still applies to overall strategy'],
      example: 'With a $200 bankroll, bet $140 on high (19-36), $50 on 13-18, and $10 on 0. This covers 25 out of 37 possible outcomes.'
    },
    {
      id: 'strategy-5',
      title: 'Oscar\'s Grind',
      difficulty: 'Advanced',
      effectiveness: 3,
      risk: 'Low',
      color: '#14D854',
      description: 'A positive progression system focused on winning one unit at a time. You increase your bet by one unit after a win, but keep it the same after a loss.',
      pros: ['Conservative approach with minimal risk', 'Good for players with patience', 'Can be profitable in the long run with even-money bets'],
      cons: ['Very slow progression', 'Small profit goals', 'Requires lots of time and many winning spins'],
      example: 'Start with 1 unit. Keep betting 1 unit until you win. After a win, increase to 2 units. Continue until you\'ve made a profit of 1 unit, then start over.'
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
          Roulette Strategy Guide
        </span>
      </Typography>
      
      <Typography 
        variant="body2" 
        color="rgba(255,255,255,0.7)"
        sx={{ mb: 3 }}
      >
        Popular betting strategies to enhance your roulette experience. Remember that no strategy can overcome the house edge entirely.
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
          <strong>Important:</strong> These strategies can enhance entertainment but cannot overcome the 2.7% house edge. Always gamble responsibly and set clear limits for your play.
        </Typography>
      </Box>
    </Paper>
  );
};

export default StrategyGuide; 