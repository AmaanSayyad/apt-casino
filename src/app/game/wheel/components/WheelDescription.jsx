"use client";

import React from 'react';
import { Box, Typography, Paper, Grid, Fade, Chip } from '@mui/material';
import { FaCheckCircle, FaCoins, FaGem } from 'react-icons/fa';
import { GiWheelbarrow, GiTrophyCup } from 'react-icons/gi';

const WheelDescription = () => {
  const features = [
    { text: "Provably fair", icon: <FaCheckCircle color="#14D854" /> },
    { text: "Multiple risk levels", icon: <FaCheckCircle color="#14D854" /> },
    { text: "Win up to 50x", icon: <FaCheckCircle color="#14D854" /> },
    { text: "Instant results", icon: <FaCheckCircle color="#14D854" /> }
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

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="rgba(255,255,255,0.8)" paragraph>
          Fortune Wheel combines simplicity with thrilling unpredictable outcomes. Choose your risk level, place your bet, and win up to 50x your initial stake!
        </Typography>
        
        <Typography variant="body1" color="rgba(255,255,255,0.8)" paragraph>
          Our provably fair system ensures every spin is completely random and transparent, giving you an adrenaline-pumping gaming experience.
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
      
      <Box>
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
    </Paper>
  );
};

export default WheelDescription; 