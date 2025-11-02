"use client";
import React from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import Grid from "@mui/material/Unstable_Grid2";
import { FaCoins, FaExclamationTriangle } from 'react-icons/fa';

const payoutData = [
  { 
    betType: 'Straight Up', 
    description: 'Single number bet', 
    payout: '35:1', 
    probability: 2.7, 
    houseEdge: 2.7,
    examples: ['0', '1', '36'],
    color: '#14D854'
  },
  { 
    betType: 'Split', 
    description: 'Two adjacent numbers', 
    payout: '17:1', 
    probability: 5.4, 
    houseEdge: 2.7,
    examples: ['1-2', '25-26'],
    color: '#F94144'
  },
  { 
    betType: 'Street', 
    description: 'Three numbers in row', 
    payout: '11:1', 
    probability: 8.1, 
    houseEdge: 2.7,
    examples: ['1-2-3', '34-36'],
    color: '#4895EF'
  },
  { 
    betType: 'Corner', 
    description: 'Four numbers in square', 
    payout: '8:1', 
    probability: 10.8, 
    houseEdge: 2.7,
    examples: ['1-2-4-5'],
    color: '#3A0CA3'
  },
  { 
    betType: 'Six Line', 
    description: 'Six consecutive numbers', 
    payout: '5:1', 
    probability: 16.2, 
    houseEdge: 2.7,
    examples: ['1-6', '31-36'],
    color: '#F72585'
  },
  { 
    betType: 'Dozen', 
    description: '12 consecutive numbers', 
    payout: '2:1', 
    probability: 32.4, 
    houseEdge: 2.7,
    examples: ['1-12', '25-36'],
    color: '#4361EE'
  },
  { 
    betType: 'Column', 
    description: '12 numbers (vertical)', 
    payout: '2:1', 
    probability: 32.4, 
    houseEdge: 2.7,
    examples: ['1st col', '3rd col'],
    color: '#4CC9F0'
  },
  { 
    betType: 'Red/Black', 
    description: 'All red or black numbers', 
    payout: '1:1', 
    probability: 48.6, 
    houseEdge: 2.7,
    examples: ['Red', 'Black'],
    color: '#d82633'
  },
  { 
    betType: 'Odd/Even', 
    description: 'All odd or even numbers', 
    payout: '1:1', 
    probability: 48.6, 
    houseEdge: 2.7,
    examples: ['Odd', 'Even'],
    color: '#681DDB'
  },
  { 
    betType: 'High/Low', 
    description: 'Numbers 1-18 or 19-36', 
    payout: '1:1', 
    probability: 48.6, 
    houseEdge: 2.7,
    examples: ['1-18', '19-36'],
    color: '#7209B7'
  }
];

const RoulettePayout = () => {
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
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '5px',
          background: 'linear-gradient(90deg, #d82633, #681DDB)',
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
        <FaCoins color="#681DDB" size={22} />
        <span style={{ background: 'linear-gradient(90deg, #FFFFFF, #d82633)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Roulette Payouts
        </span>
      </Typography>
      
      <Typography 
        variant="body2" 
        color="rgba(255,255,255,0.7)"
        sx={{ mb: 3, mt: 1 }}
      >
        European Roulette offers a 2.7% house edge across all bets. See payout ratios below:
      </Typography>
      
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: '650px' }}>
          <Grid container sx={{ 
            py: 1, 
            px: 2, 
            borderRadius: '8px 8px 0 0',
            background: 'linear-gradient(90deg, rgba(104, 29, 219, 0.2), rgba(216, 38, 51, 0.2))',
            mb: 1
          }}>
            <Grid xs={2.5}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">Bet Type</Typography>
            </Grid>
            <Grid xs={3}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">Description</Typography>
            </Grid>
            <Grid xs={1.5} sx={{ textAlign: 'center' }}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">Payout</Typography>
            </Grid>
            <Grid xs={1.5} sx={{ textAlign: 'center' }}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">Win %</Typography>
            </Grid>
            <Grid xs={3.5} sx={{ textAlign: 'center' }}>
              <Typography fontWeight="bold" fontSize="0.85rem" color="white">Examples</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ borderColor: 'rgba(104, 29, 219, 0.15)', mb: 1 }} />
          
          {payoutData.map((item, index) => (
            <React.Fragment key={index}>
              <Grid container sx={{ 
                py: 1.5, 
                px: 2, 
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(104, 29, 219, 0.1)',
                  transform: 'translateX(4px)'
                }
              }}>
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
                        backgroundColor: item.color,
                        marginRight: '8px',
                        boxShadow: `0 0 8px ${item.color}`
                      }
                    }}
                  >
                    {item.betType}
                  </Typography>
                </Grid>
                <Grid xs={3}>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">{item.description}</Typography>
                </Grid>
                <Grid xs={1.5} sx={{ textAlign: 'center' }}>
                  <Chip 
                    label={item.payout} 
                    size="small"
                    sx={{ 
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(216, 38, 51, 0.15)',
                      color: '#d82633',
                      minWidth: '55px',
                      border: '1px solid rgba(216, 38, 51, 0.2)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  />
                </Grid>
                <Grid xs={1.5} sx={{ textAlign: 'center' }}>
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    sx={{
                      color: item.probability > 30 ? '#14D854' : item.probability > 10 ? '#FFA500' : '#d82633',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5
                    }}
                  >
                    {item.probability}%
                  </Typography>
                </Grid>
                <Grid xs={3.5}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                    {item.examples.map((example, idx) => (
                      <Chip 
                        key={idx}
                        label={example} 
                        size="small"
                        sx={{ 
                          height: 20,
                          fontSize: '0.7rem',
                          backgroundColor: `${item.color}20`,
                          color: 'white',
                          border: `1px solid ${item.color}40`
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
              {index !== payoutData.length - 1 && (
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
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }}
      >
        <FaExclamationTriangle color="#d82633" size={16} style={{ flexShrink: 0 }} />
        <Typography variant="body2" color="rgba(255,255,255,0.8)">
          European Roulette (single zero) offers a better 2.7% house edge compared to American Roulette's 5.26% edge (double zero).
        </Typography>
      </Box>
    </Paper>
  );
};

export default RoulettePayout; 