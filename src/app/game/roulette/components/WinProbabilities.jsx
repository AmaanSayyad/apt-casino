"use client";
import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Tooltip, Stack, Fade } from '@mui/material';
import { FaChartPie, FaInfoCircle, FaThumbsUp, FaDice, FaQuestion, FaChevronRight } from 'react-icons/fa';
import Grid from "@mui/material/Unstable_Grid2";

const probabilityData = [
  {
    type: 'Red/Black',
    probability: 48.6,
    odds: '1:1',
    color: '#d82633'
  },
  {
    type: 'Odd/Even',
    probability: 48.6,
    odds: '1:1',
    color: '#681DDB'
  },
  {
    type: 'High/Low',
    probability: 48.6,
    odds: '1:1',
    color: '#7209B7'
  },
  {
    type: 'Dozens',
    probability: 32.4,
    odds: '2:1',
    color: '#4361EE'
  },
  {
    type: 'Columns',
    probability: 32.4,
    odds: '2:1',
    color: '#4CC9F0'
  },
  {
    type: 'Six Line',
    probability: 16.2,
    odds: '5:1',
    color: '#F72585'
  },
  {
    type: 'Corner',
    probability: 10.8,
    odds: '8:1',
    color: '#3A0CA3'
  },
  {
    type: 'Street',
    probability: 8.1,
    odds: '11:1',
    color: '#4895EF'
  },
  {
    type: 'Split',
    probability: 5.4,
    odds: '17:1',
    color: '#F94144'
  },
  {
    type: 'Straight Up',
    probability: 2.7,
    odds: '35:1',
    color: '#14D854'
  }
];

const WinProbabilities = () => {
  const [sortBy, setSortBy] = useState('probability'); // or 'odds'
  
  const sortedData = [...probabilityData].sort((a, b) => {
    if (sortBy === 'probability') {
      return b.probability - a.probability;
    } else {
      // Sort by payout (extract the number before the colon in the odds string)
      const payoutA = parseInt(a.odds.split(':')[0]);
      const payoutB = parseInt(b.odds.split(':')[0]);
      return payoutB - payoutA;
    }
  });
  
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
        <FaChartPie color="#681DDB" size={22} />
        <span style={{ background: 'linear-gradient(90deg, #FFFFFF, #14D854)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Win Probabilities
        </span>
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="body2" 
          color="rgba(255,255,255,0.7)"
        >
          Visual guide to win chances in European Roulette
        </Typography>
        
        <Stack 
          direction="row" 
          spacing={1}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '20px',
            padding: '2px',
            border: '1px solid rgba(104, 29, 219, 0.2)'
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
                backgroundColor: sortBy === 'probability' ? 'rgba(104, 29, 219, 0.4)' : 'rgba(104, 29, 219, 0.1)',
              }
            }}
          >
            By Chance
          </Button>
          <Button 
            size="small" 
            onClick={() => setSortBy('odds')}
            sx={{ 
              fontSize: '0.75rem', 
              color: sortBy === 'odds' ? 'white' : 'rgba(255,255,255,0.6)',
              backgroundColor: sortBy === 'odds' ? 'rgba(104, 29, 219, 0.3)' : 'transparent',
              borderRadius: '18px',
              minWidth: 'auto',
              p: 0.5,
              px: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: sortBy === 'odds' ? 'rgba(104, 29, 219, 0.4)' : 'rgba(104, 29, 219, 0.1)',
              }
            }}
          >
            By Payout
          </Button>
        </Stack>
      </Box>
      
      <Grid container spacing={2}>
        {sortedData.map((item, index) => (
          <Fade 
            in={true} 
            key={item.type}
            style={{ 
              transformOrigin: '0 0 0',
              transitionDelay: `${index * 50}ms`
            }}
          >
            <Grid xs={12} sm={6} md={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(${parseInt(item.color.slice(1, 3), 16)}, ${parseInt(item.color.slice(3, 5), 16)}, ${parseInt(item.color.slice(5, 7), 16)}, 0.05) 100%)`,
                  border: `1px solid ${item.color}40`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  height: '100%',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 5px 15px rgba(0, 0, 0, 0.3), 0 0 10px ${item.color}30`,
                    borderColor: `${item.color}60`,
                    '& .hover-arrow': {
                      opacity: 1,
                      transform: 'translateX(0)'
                    }
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}`
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold" 
                      color="white"
                      sx={{ mb: 0.5 }}
                    >
                      {item.type}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="rgba(255,255,255,0.7)" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5 
                      }}
                    >
                      <span style={{ color: '#d82633', fontWeight: 'bold' }}>{item.odds}</span>
                      payout ratio
                    </Typography>
                  </Box>
                  <Tooltip 
                    title={
                      <Box>
                        <Typography variant="body2">
                          {item.type === 'Red/Black' && 'Bet on all red or black numbers.'}
                          {item.type === 'Odd/Even' && 'Bet on all odd or even numbers.'}
                          {item.type === 'High/Low' && 'Bet on numbers 1-18 or 19-36.'}
                          {item.type === 'Dozens' && 'Bet on a group of 12 numbers (1-12, 13-24, or 25-36).'}
                          {item.type === 'Columns' && 'Bet on a vertical column of 12 numbers.'}
                          {item.type === 'Six Line' && 'Bet on six consecutive numbers forming two rows.'}
                          {item.type === 'Corner' && 'Bet on four numbers forming a square.'}
                          {item.type === 'Street' && 'Bet on three consecutive numbers in a row.'}
                          {item.type === 'Split' && 'Bet on two adjacent numbers.'}
                          {item.type === 'Straight Up' && 'Bet on a single number.'}
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                  >
                    <Box sx={{ 
                      cursor: 'help',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(104, 29, 219, 0.2)',
                      }
                    }}>
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
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  >
                    <Box 
                      sx={{ 
                        height: '100%', 
                        width: `${item.probability}%`, 
                        background: `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
                        borderRadius: '6px',
                        position: 'relative',
                        boxShadow: `0 0 10px ${item.color}80`,
                        transition: 'width 1s cubic-bezier(0.65, 0, 0.35, 1)',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                        }
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
                          border: `1px solid ${item.color}80`
                        }}
                      >
                        <FaDice color={item.color} size={16} />
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
                      {item.probability > 40 && <FaThumbsUp color="#14D854" />}
                      {item.probability > 15 && item.probability <= 40 && <FaThumbsUp color="#FFA500" />}
                      {item.probability <= 15 && <FaQuestion color="#d82633" />}
                      
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        color={item.probability > 40 ? '#14D854' : item.probability > 15 ? '#FFA500' : '#d82633'}
                      >
                        {item.probability > 40 && 'Best odds'}
                        {item.probability > 15 && item.probability <= 40 && 'Medium odds'}
                        {item.probability <= 15 && 'High reward'}
                      </Typography>
                    </Box>
                    
                    <FaChevronRight 
                      className="hover-arrow" 
                      color="rgba(255,255,255,0.4)" 
                      size={14} 
                      style={{ 
                        opacity: 0, 
                        transform: 'translateX(-10px)',
                        transition: 'all 0.3s ease'
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
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }}
      >
        <FaInfoCircle color="#681DDB" style={{ flexShrink: 0 }} />
        <Typography variant="body2" color="rgba(255,255,255,0.8)">
          Higher probability bets offer more frequent wins but lower payouts. Riskier bets have higher rewards but less chance of winning.
        </Typography>
      </Box>
    </Paper>
  );
};

export default WinProbabilities; 