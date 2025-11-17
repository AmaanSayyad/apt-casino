"use client";

import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Fade } from '@mui/material';
import { FaCoins, FaCalculator, FaExchangeAlt, FaMoneyBillWave, FaEquals } from 'react-icons/fa';
import { GiTwoCoins, GiCoinsPile, GiPayMoney } from 'react-icons/gi';

const WheelPayouts = () => {
  const payoutExamples = [
    { 
      risk: 'Low Risk',
      examples: [
        { bet: 100, multiplier: '1.2x', payout: 120, profit: 20 },
        { bet: 100, multiplier: '1.5x', payout: 150, profit: 50 },
        { bet: 100, multiplier: '2x', payout: 200, profit: 100 },
        { bet: 100, multiplier: '3x', payout: 300, profit: 200 }
      ]
    },
    { 
      risk: 'Medium Risk',
      examples: [
        { bet: 100, multiplier: '1.5x', payout: 150, profit: 50 },
        { bet: 100, multiplier: '2x', payout: 200, profit: 100 },
        { bet: 100, multiplier: '5x', payout: 500, profit: 400 },
        { bet: 100, multiplier: '10x', payout: 1000, profit: 900 }
      ]
    },
    { 
      risk: 'High Risk',
      examples: [
        { bet: 100, multiplier: '3x', payout: 300, profit: 200 },
        { bet: 100, multiplier: '5x', payout: 500, profit: 400 },
        { bet: 100, multiplier: '20x', payout: 2000, profit: 1900 },
        { bet: 100, multiplier: '50x', payout: 5000, profit: 4900 }
      ]
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
        <FaMoneyBillWave color="#FFA500" size={22} />
        <span style={{ background: 'linear-gradient(90deg, #FFFFFF, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Wheel Payouts
        </span>
      </Typography>
      
      <Typography 
        variant="body2" 
        color="rgba(255,255,255,0.7)"
        sx={{ mb: 3 }}
      >
        Understand how payouts are calculated in Fortune Wheel across different risk levels
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 2,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.05) 0%, rgba(255, 165, 0, 0.15) 100%)',
          border: '1px solid rgba(255, 165, 0, 0.2)',
        }}>
          <Box 
            sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 165, 0, 0.2)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              boxShadow: '0 0 15px rgba(255, 165, 0, 0.2)'
            }}
          >
            <FaCalculator color="#FFA500" size={20} />
          </Box>
          <Box>
            <Typography variant="h6" color="white" fontWeight="bold">Payout Calculation</Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              Your payout is calculated by multiplying your bet amount by the multiplier shown on the wheel segment.
            </Typography>
          </Box>
        </Box>
        
        <Box 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            border: '1px solid rgba(255, 165, 0, 0.1)',
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 2,
              color: '#FFA500'
            }}
          >
            <FaCoins />
            Payout Formula
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: { xs: 1, md: 2 },
              p: 2,
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 2
            }}
          >
            <Box 
              sx={{ 
                px: 3, 
                py: 2, 
                backgroundColor: 'rgba(255, 165, 0, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(255, 165, 0, 0.2)',
                textAlign: 'center',
                minWidth: 100
              }}
            >
              <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 0.5 }}>
                Bet Amount
              </Typography>
              <Typography variant="h6" color="white" fontWeight="bold">
                100 ETH
              </Typography>
            </Box>
            
            <FaExchangeAlt color="#FFA500" size={20} />
            
            <Box 
              sx={{ 
                px: 3, 
                py: 2, 
                backgroundColor: 'rgba(255, 165, 0, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(255, 165, 0, 0.2)',
                textAlign: 'center',
                minWidth: 100
              }}
            >
              <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 0.5 }}>
                Multiplier
              </Typography>
              <Typography variant="h6" color="white" fontWeight="bold">
                5.0x
              </Typography>
            </Box>
            
            <FaEquals color="#FFA500" size={20} />
            
            <Box 
              sx={{ 
                px: 3, 
                py: 2, 
                backgroundColor: 'rgba(20, 216, 84, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(20, 216, 84, 0.2)',
                textAlign: 'center',
                minWidth: 100
              }}
            >
              <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 0.5 }}>
                Payout
              </Typography>
              <Typography variant="h6" color="#14D854" fontWeight="bold">
                500 ETH
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {payoutExamples.map((riskLevel, index) => (
        <Fade 
          in={true} 
          key={riskLevel.risk}
          style={{ 
            transformOrigin: '0 0 0',
            transitionDelay: `${index * 100}ms`
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                mb: 2,
                color: 'white'
              }}
            >
              <GiTwoCoins color={
                riskLevel.risk === 'Low Risk' ? '#14D854' : 
                riskLevel.risk === 'Medium Risk' ? '#FFA500' : 
                '#d82633'
              } />
              {riskLevel.risk} Payouts
            </Typography>
            
            <TableContainer 
              sx={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                borderRadius: 2,
                border: '1px solid rgba(104, 29, 219, 0.2)',
                mb: 2,
                '& .MuiTableCell-root': {
                  borderColor: 'rgba(104, 29, 219, 0.1)',
                  color: 'rgba(255,255,255,0.8)'
                }
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Bet Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Multiplier</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Payout</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Profit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {riskLevel.examples.map((example, exIndex) => (
                    <TableRow 
                      key={exIndex} 
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(104, 29, 219, 0.1)' 
                        },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GiPayMoney color="#FFA500" />
                          <Typography>{example.bet} ETH</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{example.multiplier}</TableCell>
                      <TableCell sx={{ color: '#FFA500', fontWeight: 'medium' }}>{example.payout} ETH</TableCell>
                      <TableCell sx={{ color: '#14D854', fontWeight: 'medium' }}>+{example.profit} ETH</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Fade>
      ))}
      
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: 2, 
          p: 3, 
          borderRadius: 2,
          backgroundColor: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255, 165, 0, 0.1)'
        }}
      >
        <Box 
          sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 165, 0, 0.2)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            flexShrink: 0
          }}
        >
          <GiCoinsPile color="#FFA500" size={20} />
        </Box>
        <Box>
          <Typography variant="subtitle1" color="white" fontWeight="bold" sx={{ mb: 1 }}>
            Maximum Payout
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)">
            The maximum payout per spin is capped at 1,000,000 ETH. This means that regardless of your bet amount and the multiplier, you cannot win more than 1,000,000 ETH in a single spin.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default WheelPayouts;
