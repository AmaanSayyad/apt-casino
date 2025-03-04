"use client";
import React from 'react';
import { Box, Typography, Paper, Grid, Divider } from '@mui/material';

const BettingOption = ({ name, description, payout, color }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      p: 2,
      borderRadius: 1,
      mb: 1.5,
      backgroundColor: color || 'rgba(255, 255, 255, 0.05)',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
      }
    }}
  >
    <Box>
      <Typography variant="h6" fontWeight="bold" color="white">
        {name}
      </Typography>
      <Typography variant="body2" color="white" sx={{ mt: 0.5, opacity: 0.8 }}>
        {description}
      </Typography>
    </Box>
    <Box sx={{ 
      minWidth: '70px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      pl: 2
    }}>
      <Typography variant="caption" color="white" sx={{ opacity: 0.7 }}>
        Payout
      </Typography>
      <Typography variant="h6" fontWeight="bold" color="white">
        {payout}
      </Typography>
    </Box>
  </Box>
);

const BettingTable = ({ data }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
      }}
    >
      <Typography variant="h4" color="white" gutterBottom sx={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {data?.title || "Betting Options"}
      </Typography>
      
      <Typography variant="body1" paragraph sx={{ mb: 3, color: 'white' }}>
        {data?.description || "Explore our comprehensive betting options and maximize your winning potential:"}
      </Typography>
      
      <Grid container spacing={4}>
        {data?.options?.map((category, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" color="white" sx={{ mb: 2, borderBottom: '2px solid', pb: 1, display: 'inline-block', letterSpacing: '0.5px' }}>
                {category.category}
              </Typography>
              
              {category.bets.map((bet, betIndex) => (
                <BettingOption
                  key={betIndex}
                  name={bet.name}
                  description={bet.description}
                  payout={bet.payout}
                  color={category.category === 'Inside Bets' ? 'rgba(104, 29, 219, 0.15)' : 'rgba(216, 38, 51, 0.15)'}
                />
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
      
      <Divider sx={{ my: 4 }} />
      
      <Box>
        <Typography variant="h5" color="white" gutterBottom>
          Roulette Strategies
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
              <Typography variant="h6" color="white" gutterBottom>
                The Martingale Strategy
              </Typography>
              <Typography variant="body2" paragraph color="white">
                Double your bet after each loss, so when you eventually win, you recover all previous losses plus a profit equal to your original stake.
              </Typography>
              <Typography variant="caption" color="warning.main">
                Warning: Requires large bankroll and can reach betting limits quickly.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
              <Typography variant="h6" color="white" gutterBottom>
                The D'Alembert System
              </Typography>
              <Typography variant="body2" paragraph color="white">
                Increase your stake by one unit after a loss, and decrease it by one unit after a win. A safer approach than Martingale.
              </Typography>
              <Typography variant="caption" color="info.main">
                Tip: Good for even-money bets like Red/Black or Odd/Even.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
              <Typography variant="h6" color="white" gutterBottom>
                The Fibonacci Strategy
              </Typography>
              <Typography variant="body2" paragraph color="white">
                Follow the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21, etc.) when increasing your bets after losses.
              </Typography>
              <Typography variant="caption" color="info.main">
                Tip: Less aggressive than Martingale but still has recovery potential.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
              <Typography variant="h6" color="white" gutterBottom>
                The James Bond Strategy
              </Typography>
              <Typography variant="body2" paragraph color="white">
                Place 70% of your stake on high numbers (19-36), 25% on six numbers (13-18), and 5% on zero.
              </Typography>
              <Typography variant="caption" color="success.main">
                Advantage: Covers 25 of 37 possible outcomes on every spin.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default BettingTable;
