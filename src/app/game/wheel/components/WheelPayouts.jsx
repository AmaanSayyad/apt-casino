"use client";

import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Grid, Chip, Divider, Fade, Button, Stack } from '@mui/material';
import { FaCoins, FaCalculator, FaMoneyBillWave, FaEquals, FaArrowRight } from 'react-icons/fa';
import { GiTwoCoins, GiCoinsPile } from 'react-icons/gi';

const WheelPayouts = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSegments, setSelectedSegments] = useState(50); // Default to 50 segments
  
  // Payout data based on Stake.com's wheel multipliers
  const payoutData = {
    lowRisk: {
      color: '#14D854',
      examples: [
        { bet: 100, multiplier: '0.0x', payout: 0, profit: -100, segments: [10, 20, 30, 40, 50] },
        { bet: 100, multiplier: '1.2x', payout: 120, profit: 20, segments: [10, 20, 30, 40, 50] },
        { bet: 100, multiplier: '1.5x', payout: 150, profit: 50, segments: [10, 20, 30, 40, 50] }
      ]
    },
    mediumRisk: {
      color: '#FFA500',
      examples: [
        { bet: 100, multiplier: '0.0x', payout: 0, profit: -100, segments: [10, 20, 30, 40, 50] },
        { bet: 100, multiplier: '1.5x', payout: 150, profit: 50, segments: [10, 20, 30, 40, 50] },
        { bet: 100, multiplier: '2.0x', payout: 200, profit: 100, segments: [10, 20, 30, 40, 50] },
        { bet: 100, multiplier: '3.0x', payout: 300, profit: 200, segments: [10, 20] },
        { bet: 100, multiplier: '4.0x', payout: 400, profit: 300, segments: [30] },
        { bet: 100, multiplier: '5.0x', payout: 500, profit: 400, segments: [50] }
      ]
    },
    highRisk: {
      color: '#D82633',
      examples: [
        { bet: 100, multiplier: '0.0x', payout: 0, profit: -100, segments: [10, 20, 30, 40, 50] },
        { bet: 100, multiplier: '10.0x', payout: 1000, profit: 900, segments: [10] },
        { bet: 100, multiplier: '20.0x', payout: 2000, profit: 1900, segments: [20] },
        { bet: 100, multiplier: '30.0x', payout: 3000, profit: 2900, segments: [30] },
        { bet: 100, multiplier: '40.0x', payout: 4000, profit: 3900, segments: [40] },
        { bet: 100, multiplier: '50.0x', payout: 5000, profit: 4900, segments: [50] }
      ]
    }
  };

  const riskLevels = [
    { name: 'Low Risk', key: 'lowRisk' },
    { name: 'Medium Risk', key: 'mediumRisk' },
    { name: 'High Risk', key: 'highRisk' }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filter examples by selected segment count
  const getFilteredExamples = (riskKey) => {
    return payoutData[riskKey].examples.filter(example => 
      example.segments.includes(selectedSegments)
    );
  };

  // Get maximum multiplier for selected segments and risk level
  const getMaxMultiplier = (riskKey) => {
    const filtered = payoutData[riskKey].examples.filter(ex => ex.segments.includes(selectedSegments));
    if (filtered.length === 0) return '0.0x';
    
    const maxMultiplier = filtered.reduce((max, ex) => {
      const current = parseFloat(ex.multiplier);
      return current > max ? current : max;
    }, 0);
    
    return maxMultiplier.toFixed(1) + 'x';
  };

  return (
    <Paper
      elevation={5}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(9, 0, 5, 0.9) 0%, rgba(25, 5, 30, 0.85) 100%)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(216, 38, 51, 0.2)',
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
          background: 'linear-gradient(90deg, #FFA500, #D82633)',
        }
      }}
    >
      <Typography 
        variant="h5" 
        fontWeight="bold" 
        gutterBottom
        sx={{ 
          borderBottom: '1px solid rgba(216, 38, 51, 0.3)',
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
      
      {/* Segment selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
          Select number of segments to see corresponding payouts:
        </Typography>
        <Stack 
          direction="row" 
          spacing={1}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '20px',
            padding: '2px',
            border: '1px solid rgba(216, 38, 51, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
        >
          {[10, 20, 30, 40, 50].map(segments => (
            <Button 
              key={segments}
              size="small" 
              onClick={() => setSelectedSegments(segments)}
              sx={{ 
                fontSize: '0.75rem', 
                color: selectedSegments === segments ? 'white' : 'rgba(255,255,255,0.6)',
                backgroundColor: selectedSegments === segments ? 'rgba(216, 38, 51, 0.3)' : 'transparent',
                borderRadius: '18px',
                minWidth: 'auto',
                p: 0.5,
                px: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: selectedSegments === segments ? 'rgba(216, 38, 51, 0.4)' : 'rgba(216, 38, 51, 0.1)',
                }
              }}
            >
              {segments}
            </Button>
          ))}
        </Stack>
      </Box>
      
      {/* Compact payout calculation section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            height: '100%',
            background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.05) 0%, rgba(255, 165, 0, 0.15) 100%)',
            border: '1px solid rgba(255, 165, 0, 0.2)',
          }}>
            <Typography variant="subtitle1" color="white" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FaCalculator color="#FFA500" size={16} />
              Payout Calculation
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 2 }}>
              Your payout is calculated by multiplying your bet by the multiplier.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Chip 
                label="100 APTC" 
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.3)', 
                  color: 'white',
                  fontWeight: 'bold',
                  border: '1px solid rgba(255, 165, 0, 0.3)'
                }} 
              />
              <FaArrowRight color="#FFA500" />
              <Chip 
                label={`× ${getMaxMultiplier(riskLevels[activeTab].key)}`} 
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.3)', 
                  color: 'white',
                  fontWeight: 'bold',
                  border: '1px solid rgba(255, 165, 0, 0.3)'
                }} 
              />
              <FaEquals color="#FFA500" />
              <Chip 
                label={`${parseFloat(getMaxMultiplier(riskLevels[activeTab].key)) * 100} APTC`}
                sx={{ 
                  bgcolor: 'rgba(20, 216, 84, 0.2)', 
                  color: '#14D854',
                  fontWeight: 'bold',
                  border: '1px solid rgba(20, 216, 84, 0.3)'
                }} 
              />
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: 2, 
            borderRadius: 2,
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255, 165, 0, 0.1)'
          }}>
            <Typography variant="subtitle1" color="white" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GiCoinsPile color="#FFA500" size={18} />
              Maximum Payout
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
              Maximum payout: 1,000,000 APTC per spin.
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.5)" sx={{ fontSize: '0.8rem' }}>
              With {selectedSegments} segments, high risk offers up to {getMaxMultiplier('highRisk')} multiplier.
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Tabbed risk level payouts */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(216, 38, 51, 0.2)', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: payoutData[riskLevels[activeTab].key].color,
            },
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.6)',
              '&.Mui-selected': {
                color: 'white',
              }
            }
          }}
        >
          {riskLevels.map((level, index) => (
            <Tab 
              key={level.name} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GiTwoCoins color={payoutData[level.key].color} />
                  <span>{level.name}</span>
                </Box>
              } 
            />
          ))}
        </Tabs>
      </Box>
      
      {/* Payout examples for selected risk level */}
      <Fade in={true} key={`${activeTab}-${selectedSegments}`}>
        <Box sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 2, mb: 2 }}>
          {/* Small note about 0x multiplier */}
          <Box 
            sx={{ 
              mb: 2, 
              p: 1, 
              borderRadius: 2, 
              backgroundColor: 'rgba(216, 38, 51, 0.05)', 
              border: '1px solid rgba(216, 38, 51, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="caption" color="rgba(255,255,255,0.6)">
              0x multiplier = loss of bet (100 APTC)
            </Typography>
            <Typography variant="caption" fontWeight="bold" color="#e74c3c">
              -100 APTC
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {getFilteredExamples(riskLevels[activeTab].key)
              .filter(example => example.multiplier !== '0.0x') // Filter out 0x multipliers
              .map((example, index) => (
              <Grid item xs={6} sm={4} md={4} key={index}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${payoutData[riskLevels[activeTab].key].color}30`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 5px 15px rgba(0, 0, 0, 0.3), 0 0 10px ${payoutData[riskLevels[activeTab].key].color}30`,
                      borderColor: `${payoutData[riskLevels[activeTab].key].color}60`
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">Bet</Typography>
                    <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">Multiplier</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="white">{example.bet} APTC</Typography>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold" 
                      color={payoutData[riskLevels[activeTab].key].color}
                    >
                      {example.multiplier}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">Payout</Typography>
                    <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">Profit</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="#FFA500">
                      {example.payout} APTC
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold" 
                      color="#14D854"
                    >
                      +{example.profit} APTC
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Fade>
      
      <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: 'rgba(216, 38, 51, 0.1)', border: '1px solid rgba(216, 38, 51, 0.2)' }}>
        <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FaCoins color="#FFA500" size={14} />
          <span>With {selectedSegments} segments, the maximum multiplier for {riskLevels[activeTab].name.toLowerCase()} is {getMaxMultiplier(riskLevels[activeTab].key)}.</span>
        </Typography>
      </Box>
    </Paper>
  );
};

export default WheelPayouts; 