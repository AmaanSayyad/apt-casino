"use client";

import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Tooltip, Stack, Fade } from '@mui/material';
import { FaChartPie, FaInfoCircle, FaThumbsUp, FaDice, FaQuestion, FaChevronRight, FaPercentage } from 'react-icons/fa';
import Grid from "@mui/material/Unstable_Grid2";

const WheelProbability = () => {
  const [sortBy, setSortBy] = useState('probability'); // or 'multiplier'
  const [selectedSegments, setSelectedSegments] = useState(50); // Default to 50 segments
  
  // Probability data based on Stake.com's wheel
  const probabilityData = {
    lowRisk: [
      {
        type: 'Low Risk - 0x',
        probability: 25.0,
        multiplier: '0.0x',
        color: '#e74c3c',
        segments: [10, 20, 30, 40, 50]
      },
      {
        type: 'Low Risk - 1.2x',
        probability: 50.0,
        multiplier: '1.2x',
        color: '#27ae60',
        segments: [10, 20, 30, 40, 50]
      },
      {
        type: 'Low Risk - 1.5x',
        probability: 25.0,
        multiplier: '1.5x',
        color: '#2980b9',
        segments: [10, 20, 30, 40, 50]
      }
    ],
    mediumRisk: [
      {
        type: 'Medium Risk - 0x',
        probability: 50.0,
        multiplier: '0.0x',
        color: '#e74c3c',
        segments: [10, 20, 30, 40, 50]
      },
      {
        type: 'Medium Risk - 1.5x',
        probability: 20.0,
        multiplier: '1.5x',
        color: '#27ae60',
        segments: [10, 20, 30, 40, 50]
      },
      {
        type: 'Medium Risk - 2.0x',
        probability: 15.0,
        multiplier: '2.0x',
        color: '#2980b9',
        segments: [10, 20, 30, 40, 50]
      },
      {
        type: 'Medium Risk - 3.0x',
        probability: 10.0,
        multiplier: '3.0x',
        color: '#f39c12',
        segments: [10, 20]
      },
      {
        type: 'Medium Risk - 4.0x',
        probability: 5.0,
        multiplier: '4.0x',
        color: '#9b59b6',
        segments: [30]
      },
      {
        type: 'Medium Risk - 5.0x',
        probability: 5.0,
        multiplier: '5.0x',
        color: '#8e44ad',
        segments: [50]
      }
    ],
    highRisk: [
      {
        type: 'High Risk - 0x',
        probability: 90.0,
        multiplier: '0.0x',
        color: '#e74c3c',
        segments: [10, 20, 30, 40, 50]
      },
      {
        type: 'High Risk - 9.9x',
        probability: 10.0,
        multiplier: '9.9x',
        color: '#27ae60',
        segments: [10]
      },
      {
        type: 'High Risk - 19.8x',
        probability: 10.0,
        multiplier: '19.8x',
        color: '#2980b9',
        segments: [20]
      },
      {
        type: 'High Risk - 29.7x',
        probability: 10.0,
        multiplier: '29.7x',
        color: '#f39c12',
        segments: [30]
      },
      {
        type: 'High Risk - 39.6x',
        probability: 10.0,
        multiplier: '39.6x',
        color: '#9b59b6',
        segments: [40]
      },
      {
        type: 'High Risk - 49.5x',
        probability: 10.0,
        multiplier: '49.5x',
        color: '#8e44ad',
        segments: [50]
      }
    ]
  };

  // Combine all risk levels and filter by selected segment count
  const getAllProbabilityData = () => {
    const allData = [
      ...probabilityData.lowRisk.filter(item => item.segments.includes(selectedSegments)),
      ...probabilityData.mediumRisk.filter(item => item.segments.includes(selectedSegments)),
      ...probabilityData.highRisk.filter(item => item.segments.includes(selectedSegments))
    ];
    
    return allData;
  };

  const sortedData = [...getAllProbabilityData()].sort((a, b) => {
    if (sortBy === 'probability') {
      return b.probability - a.probability;
    } else {
      // Sort by multiplier (extract the number before the 'x')
      const multA = parseFloat(a.multiplier);
      const multB = parseFloat(b.multiplier);
      return multB - multA;
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
          background: 'linear-gradient(90deg, #D82633, #14D854)',
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
        <FaChartPie color="#D82633" size={22} />
        <span style={{ background: 'linear-gradient(90deg, #FFFFFF, #D82633)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Win Probabilities
        </span>
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="body2" 
          color="rgba(255,255,255,0.7)"
        >
          Win chances across different risk levels with {selectedSegments} segments
        </Typography>
        
        <Stack 
          direction="row" 
          spacing={1}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '20px',
            padding: '2px',
            border: '1px solid rgba(216, 38, 51, 0.2)'
          }}
        >
          <Button 
            size="small" 
            onClick={() => setSortBy('probability')}
            sx={{ 
              fontSize: '0.75rem', 
              color: sortBy === 'probability' ? 'white' : 'rgba(255,255,255,0.6)',
              backgroundColor: sortBy === 'probability' ? 'rgba(216, 38, 51, 0.3)' : 'transparent',
              borderRadius: '18px',
              minWidth: 'auto',
              p: 0.5,
              px: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: sortBy === 'probability' ? 'rgba(216, 38, 51, 0.4)' : 'rgba(216, 38, 51, 0.1)',
              }
            }}
          >
            By Chance
          </Button>
          <Button 
            size="small" 
            onClick={() => setSortBy('multiplier')}
            sx={{ 
              fontSize: '0.75rem', 
              color: sortBy === 'multiplier' ? 'white' : 'rgba(255,255,255,0.6)',
              backgroundColor: sortBy === 'multiplier' ? 'rgba(216, 38, 51, 0.3)' : 'transparent',
              borderRadius: '18px',
              minWidth: 'auto',
              p: 0.5,
              px: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: sortBy === 'multiplier' ? 'rgba(216, 38, 51, 0.4)' : 'rgba(216, 38, 51, 0.1)',
              }
            }}
          >
            By Multiplier
          </Button>
        </Stack>
      </Box>
      
      {/* Segment selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
          Select number of segments:
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
            <Grid xs={12} sm={6} md={4}>
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
                      <span style={{ color: item.color, fontWeight: 'bold' }}>{item.multiplier}</span>
                      multiplier
                    </Typography>
                  </Box>
                  <Tooltip 
                    title={
                      <Box>
                        <Typography variant="body2">
                          {item.type.includes('Low Risk') && 'Lower risk offers more frequent but smaller wins with max 1.5x multiplier.'}
                          {item.type.includes('Medium Risk') && 'Medium risk balances win frequency with payout size up to 5.0x multiplier.'}
                          {item.type.includes('High Risk') && `High risk has less frequent wins but larger potential payouts up to ${selectedSegments === 50 ? '49.5x' : selectedSegments === 40 ? '39.6x' : selectedSegments === 30 ? '29.7x' : selectedSegments === 20 ? '19.8x' : '9.9x'} multiplier.`}
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
                        backgroundColor: 'rgba(216, 38, 51, 0.2)',
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
                        <FaPercentage color={item.color} size={16} />
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
                      {item.probability > 30 && <FaThumbsUp color="#14D854" />}
                      {item.probability > 10 && item.probability <= 30 && <FaThumbsUp color="#FFA500" />}
                      {item.probability <= 10 && <FaQuestion color="#d82633" />}
                      
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        color={item.probability > 30 ? '#14D854' : item.probability > 10 ? '#FFA500' : '#d82633'}
                      >
                        {item.probability > 30 && 'Common'}
                        {item.probability > 10 && item.probability <= 30 && 'Medium'}
                        {item.probability <= 10 && 'Rare'}
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
          background: 'linear-gradient(135deg, rgba(216, 38, 51, 0.05) 0%, rgba(216, 38, 51, 0.15) 100%)',
          border: '1px solid rgba(216, 38, 51, 0.15)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }}
      >
        <FaInfoCircle color="#D82633" style={{ flexShrink: 0 }} />
        <Typography variant="body2" color="rgba(255,255,255,0.8)">
          More segments = higher potential multipliers. High risk with 50 segments offers up to 49.5x multiplier!
        </Typography>
      </Box>
    </Paper>
  );
};

export default WheelProbability; 