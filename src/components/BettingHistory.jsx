"use client";
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const BettingHistory = ({ history }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      <Typography variant="h6" color="primary" gutterBottom>
        Betting History
      </Typography>
      {history.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="text.secondary">
            No betting history yet
          </Typography>
        </Box>
      ) : (
        history.map((bet, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              },
              borderLeft: bet.won ? '4px solid #4caf50' : '4px solid #f44336'
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                {bet.type}
              </Typography>
              <Typography variant="body1" color="text.primary">
                {bet.amount} APTC
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(bet.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="body1" 
                fontWeight="bold"
                color={bet.won ? 'success.main' : 'error.main'}
              >
                {bet.won ? '+' : '-'}{bet.payout} APTC
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  Result:
                </Typography>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: 'white',
                    fontWeight: 'bold',
                    backgroundColor: bet.roll === 0 ? '#14D854' : 
                      [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(bet.roll) ? '#d82633' : '#333'
                  }}
                >
                  {bet.roll}
                </Box>
              </Box>
            </Box>
          </Box>
        ))
      )}
    </Paper>
  );
};

export default BettingHistory; 