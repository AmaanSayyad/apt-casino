"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Avatar, Chip, Button, LinearProgress } from '@mui/material';
import { FaTv, FaUsers, FaCoins, FaPlay, FaVolumeUp } from 'react-icons/fa';
import Grid from "@mui/material/Unstable_Grid2";

// Sample data - would come from API in real application
const liveGamesData = [
  {
    id: 'live-1',
    title: 'VIP Roulette Room',
    dealer: 'Alexandra',
    dealerAvatar: '/images/avatars/dealer1.png',
    players: 24,
    minBet: 50,
    maxBet: 10000,
    status: 'betting',
    timeRemaining: 20,
    lastNumbers: [7, 32, 15, 19, 0],
    isVIP: true
  },
  {
    id: 'live-2',
    title: 'Classic European Roulette',
    dealer: 'Michael',
    dealerAvatar: '/images/avatars/dealer2.png',
    players: 37,
    minBet: 10,
    maxBet: 5000,
    status: 'spinning',
    timeRemaining: 8,
    lastNumbers: [36, 18, 22, 9, 14],
    isVIP: false
  },
  {
    id: 'live-3',
    title: 'Beginners Roulette Lounge',
    dealer: 'Sarah',
    dealerAvatar: '/images/avatars/dealer3.png',
    players: 19,
    minBet: 5,
    maxBet: 1000,
    status: 'announcing',
    timeRemaining: 5,
    lastNumbers: [11, 25, 17, 34, 6],
    isVIP: false
  }
];

const LiveGames = () => {
  const [games, setGames] = useState(liveGamesData);
  
  // Simulate countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setGames(prevGames => prevGames.map(game => {
        // Decrease time remaining
        let newTimeRemaining = game.timeRemaining - 1;
        let newStatus = game.status;
        
        // Cycle through states
        if (newTimeRemaining <= 0) {
          if (game.status === 'betting') {
            newStatus = 'spinning';
            newTimeRemaining = 8;
          } else if (game.status === 'spinning') {
            newStatus = 'announcing';
            newTimeRemaining = 5;
          } else if (game.status === 'announcing') {
            newStatus = 'betting';
            newTimeRemaining = 20;
            
            // Add new random number to lastNumbers
            const newNumber = Math.floor(Math.random() * 37);
            const newLastNumbers = [newNumber, ...game.lastNumbers.slice(0, 4)];
            return { ...game, status: newStatus, timeRemaining: newTimeRemaining, lastNumbers: newLastNumbers };
          }
        }
        
        return { ...game, status: newStatus, timeRemaining: newTimeRemaining };
      }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Get status text and color
  const getStatusInfo = (status, timeRemaining) => {
    switch (status) {
      case 'betting':
        return {
          text: `Betting Open (${timeRemaining}s)`,
          color: '#14D854',
          bgColor: 'rgba(20, 216, 84, 0.15)'
        };
      case 'spinning':
        return {
          text: `Wheel Spinning (${timeRemaining}s)`,
          color: '#ffc107',
          bgColor: 'rgba(255, 193, 7, 0.15)'
        };
      case 'announcing':
        return {
          text: `Results (${timeRemaining}s)`,
          color: '#d82633',
          bgColor: 'rgba(216, 38, 51, 0.15)'
        };
      default:
        return {
          text: 'Unknown',
          color: 'white',
          bgColor: 'rgba(255, 255, 255, 0.15)'
        };
    }
  };
  
  return (
    <Paper
      elevation={5}
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: 'rgba(9, 0, 5, 0.8)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(104, 29, 219, 0.2)',
        mb: 5,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Typography 
        variant="h5" 
        fontWeight="bold" 
        color="#d82633" 
        gutterBottom
        sx={{ 
          borderBottom: '1px solid rgba(104, 29, 219, 0.3)',
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <FaTv color="#681DDB" />
        Live Roulette Tables
      </Typography>
      
      <Typography 
        variant="body2" 
        color="rgba(255,255,255,0.7)"
        sx={{ mb: 3, mt: 1 }}
      >
        Join live dealer roulette tables and experience the thrill of real-time play with other players.
      </Typography>
      
      <Grid container spacing={3}>
        {games.map((game) => {
          const statusInfo = getStatusInfo(game.status, game.timeRemaining);
          
          return (
            <Grid xs={12} md={4} key={game.id}>
              <Box 
                sx={{
                  backgroundColor: 'rgba(9, 0, 5, 0.4)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: game.isVIP ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(104, 29, 219, 0.15)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
                  }
                }}
              >
                {/* Status bar */}
                <Box 
                  sx={{ 
                    backgroundColor: statusInfo.bgColor,
                    color: statusInfo.color,
                    py: 0.75,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(104, 29, 219, 0.1)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: statusInfo.color,
                        animation: game.status === 'spinning' ? 'pulse 1s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { opacity: 0.6 },
                          '50%': { opacity: 1 },
                          '100%': { opacity: 0.6 }
                        }
                      }} 
                    />
                    <Typography variant="caption" fontWeight="medium">
                      {statusInfo.text}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaUsers size={12} color="rgba(255,255,255,0.7)" />
                    <Typography variant="caption" color="rgba(255,255,255,0.7)">
                      {game.players}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Progress bar for time remaining */}
                <LinearProgress 
                  variant="determinate" 
                  value={(game.timeRemaining / (game.status === 'betting' ? 20 : game.status === 'spinning' ? 8 : 5)) * 100} 
                  sx={{ 
                    height: 2,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: statusInfo.color
                    }
                  }}
                />
                
                {/* Main content */}
                <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography fontWeight="bold" variant="subtitle1">
                      {game.title}
                    </Typography>
                    {game.isVIP && (
                      <Chip 
                        label="VIP" 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(255, 215, 0, 0.15)', 
                          color: '#ffc107',
                          height: 20,
                          fontSize: '0.6rem'
                        }} 
                      />
                    )}
                  </Box>
                  
                  {/* Dealer info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      src={game.dealerAvatar} 
                      alt={game.dealer}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        mr: 1.5,
                        border: '2px solid rgba(104, 29, 219, 0.3)'
                      }}
                    >
                      {game.dealer.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="rgba(255,255,255,0.7)">
                        Dealer
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {game.dealer}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Bet limits */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="rgba(255,255,255,0.7)">
                        Min Bet
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FaCoins size={12} color="#ffc107" />
                        {game.minBet} APTC
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="rgba(255,255,255,0.7)">
                        Max Bet
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        <FaCoins size={12} color="#ffc107" />
                        {game.maxBet.toLocaleString()} APTC
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Recent numbers */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.7)" sx={{ mb: 1, display: 'block' }}>
                      Recent Numbers
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {game.lastNumbers.map((number, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: number === 0 ? '#14D854' : 
                              [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number) ? '#d82633' : '#333',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {number}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 'auto' }}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      startIcon={<FaPlay />}
                      disabled={game.status !== 'betting'}
                      sx={{ 
                        backgroundColor: game.status === 'betting' ? '#681DDB' : 'rgba(104, 29, 219, 0.3)',
                        '&:hover': {
                          backgroundColor: game.status === 'betting' ? '#5a17c9' : 'rgba(104, 29, 219, 0.3)',
                        }
                      }}
                    >
                      {game.status === 'betting' ? 'Join Table' : 'Waiting...'}
                    </Button>
                    
                    {game.status === 'spinning' && (
                      <Button 
                        fullWidth 
                        variant="text" 
                        startIcon={<FaVolumeUp />}
                        sx={{ 
                          mt: 1,
                          color: 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                          }
                        }}
                      >
                        Watch Live
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default LiveGames; 