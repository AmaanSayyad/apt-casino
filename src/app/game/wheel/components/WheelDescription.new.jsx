"use client";

import React from 'react';
import { Box, Typography, Paper, Grid, Divider, Fade, Chip } from '@mui/material';
import { FaCheckCircle, FaInfoCircle, FaCoins, FaRandom, FaArrowRight, FaGem, FaGamepad } from 'react-icons/fa';
import { GiWheelbarrow, GiTrophyCup } from 'react-icons/gi';

const WheelDescription = () => {
  const features = [
    { text: "Provably fair", icon: <FaCheckCircle color="#14D854" /> },
    { text: "Multiple risk levels", icon: <FaCheckCircle color="#14D854" /> },
    { text: "Win up to 50x", icon: <FaCheckCircle color="#14D854" /> },
    { text: "Instant results", icon: <FaCheckCircle color="#14D854" /> }
  ];

  const steps = [
    {
      step: 1,
      title: "Choose Risk Level",
      description: "Select Low, Medium, or High risk. Higher risk means higher potential rewards but lower chances of winning."
    },
    {
      step: 2,
      title: "Enter Bet Amount",
      description: "Enter your bet amount, making sure it's within your available balance."
    },
    {
      step: 3,
      title: "Spin the Wheel",
      description: "Click the 'Spin' button to start the wheel."
    },
    {
      step: 4,
      title: "Wait for Result",
      description: "Wait for the wheel to stop spinning to see if you've won."
    },
    {
      step: 5,
      title: "Collect Winnings",
      description: "If the wheel lands on a winning segment, your bet will be multiplied by the corresponding value."
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
        <GiWheelbarrow color="#FFA500" size={22} />
        <span style={{ background: 'linear-gradient(90deg, #FFFFFF, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          About Fortune Wheel
        </span>
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="rgba(255,255,255,0.8)" paragraph>
              Fortune Wheel is an exciting casino game that combines simplicity with the thrill of unpredictable outcomes. 
              Players place bets on where they think the wheel will land, with different risk levels offering various potential rewards.
            </Typography>
            
            <Typography variant="body1" color="rgba(255,255,255,0.8)" paragraph>
              The game features a spinning wheel divided into segments, each representing a different multiplier. 
              The higher the risk level you choose, the greater the potential rewards – but also the higher chance of losing your bet.
            </Typography>
            
            <Typography variant="body1" color="rgba(255,255,255,0.8)" paragraph>
              With our provably fair system, you can verify that each spin result is completely random and not manipulated. 
              Fortune Wheel offers an adrenaline-pumping experience with the chance to win up to 50x your initial bet!
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {features.map((feature, index) => (
              <Fade 
                in={true} 
                key={index}
                style={{ 
                  transformOrigin: '0 0 0',
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <Chip 
                  icon={feature.icon}
                  label={feature.text}
                  sx={{ 
                    bgcolor: 'rgba(0,0,0,0.3)', 
                    color: 'white',
                    border: '1px solid rgba(20, 216, 84, 0.3)',
                    '& .MuiChip-icon': {
                      color: 'inherit'
                    }
                  }}
                />
              </Fade>
            ))}
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2,
                color: 'white'
              }}
            >
              <FaGem color="#FFA500" />
              Key Features
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(216, 38, 51, 0.1)', 
                    border: '1px solid rgba(216, 38, 51, 0.2)',
                    height: '100%'
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    color="#d82633" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1 
                    }}
                  >
                    <GiWheelbarrow />
                    Risk Levels
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Choose from Low, Medium, or High risk levels. Each affects the wheel's segment distribution and potential multipliers.
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(104, 29, 219, 0.1)', 
                    border: '1px solid rgba(104, 29, 219, 0.2)',
                    height: '100%'
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    color="#681DDB" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1 
                    }}
                  >
                    <FaCoins />
                    Multipliers
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Win up to 50x your bet with the right spin! Different wheel segments offer various multiplier values.
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(20, 216, 84, 0.1)', 
                    border: '1px solid rgba(20, 216, 84, 0.2)',
                    height: '100%'
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    color="#14D854" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1 
                    }}
                  >
                    <GiTrophyCup />
                    Auto-Betting
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Use our auto-betting feature to place multiple bets automatically with customizable settings.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              backgroundColor: 'rgba(0,0,0,0.2)', 
              border: '1px solid rgba(104, 29, 219, 0.2)',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 3,
                color: 'white'
              }}
            >
              <FaGamepad color="#FFA500" />
              How to Play
            </Typography>
            
            <Box sx={{ position: 'relative' }}>
              {steps.map((step, index) => (
                <Fade 
                  in={true} 
                  key={step.step}
                  style={{ 
                    transformOrigin: '0 0 0',
                    transitionDelay: `${index * 150}ms`
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      mb: 2.5, 
                      position: 'relative',
                      '&:not(:last-child)::after': {
                        content: '""',
                        position: 'absolute',
                        left: 20,
                        top: 40,
                        bottom: -10,
                        width: 1,
                        backgroundColor: 'rgba(104, 29, 219, 0.3)',
                        zIndex: 0
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        backgroundColor: 'rgba(104, 29, 219, 0.2)', 
                        border: '1px solid rgba(104, 29, 219, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        mr: 2,
                        flexShrink: 0,
                        zIndex: 1,
                        boxShadow: '0 0 10px rgba(104, 29, 219, 0.3)'
                      }}
                    >
                      {step.step}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold" 
                        color="white"
                        sx={{ mb: 0.5 }}
                      >
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        {step.description}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              ))}
            </Box>
            
            <Box 
              sx={{ 
                mt: 3, 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255, 165, 0, 0.1)', 
                border: '1px solid rgba(255, 165, 0, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5
              }}
            >
              <FaInfoCircle color="#FFA500" style={{ marginTop: 3, flexShrink: 0 }} />
              <Box>
                <Typography variant="subtitle2" color="#FFA500" sx={{ mb: 0.5 }}>
                  Pro Tip
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  Start with the low risk level to get familiar with the game mechanics. Once comfortable, you can experiment with higher risk levels for bigger potential rewards.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default WheelDescription;
