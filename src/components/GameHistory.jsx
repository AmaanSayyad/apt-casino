import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, IconButton, Tooltip } from '@mui/material';
import { OpenInNew, Verified } from '@mui/icons-material';

const GameHistory = ({ hotNumbers, coldNumbers, recentGames = [] }) => {
  const [showVrfDetails, setShowVrfDetails] = useState(true);
  
  // Fallback to mock data if no recent games provided
  const recentNumbers = recentGames.length > 0 
    ? recentGames.map(game => game.resultData?.number || 0)
    : [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  
  const openArbiscan = (txHash) => {
    if (txHash) {
      const network = process.env.NEXT_PUBLIC_NETWORK || 'arbitrum-sepolia';
      let explorerUrl;
      
      if (network === 'arbitrum-sepolia') {
        explorerUrl = `https://sepolia.arbiscan.io/tx/${txHash}`;
      } else if (network === 'arbitrum-one') {
        explorerUrl = `https://arbiscan.io/tx/${txHash}`;
      } else {
        explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
      }
      
      window.open(explorerUrl, '_blank');
    }
  };

  const NumberBall = ({ number, size = 32, opacity = 1, game = null }) => (
    <Tooltip 
      title={game?.vrfDetails?.transactionHash ? 
        `VRF Verified - Block #${game.vrfDetails.blockNumber || 'N/A'}` : 
        'Number result'
      }
      arrow
    >
      <Box 
        sx={{ 
          position: 'relative',
          width: size, 
          height: size, 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: number === 0 ? '#14D854' : 
            [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number) ? '#d82633' : '#333',
          color: 'white',
          fontWeight: 'bold',
          fontSize: `${size * 0.025}rem`,
          opacity,
          transition: 'transform 0.2s ease-in-out',
          cursor: game?.vrfDetails?.transactionHash ? 'pointer' : 'default',
          '&:hover': {
            transform: game?.vrfDetails?.transactionHash ? 'scale(1.1)' : 'scale(1.05)',
          }
        }}
        onClick={() => game?.vrfDetails?.transactionHash && openArbiscan(game.vrfDetails.transactionHash)}
      >
        {number}
        {game?.vrfDetails?.transactionHash && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Verified sx={{ fontSize: 8, color: 'white' }} />
          </Box>
        )}
      </Box>
    </Tooltip>
  );

  return (
    <Paper 
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" color="white">Recent Game Results</Typography>
        <Chip
          icon={<Verified />}
          label="VRF Verified"
          color="success"
          size="small"
          onClick={() => setShowVrfDetails(!showVrfDetails)}
          sx={{ cursor: 'pointer' }}
        />
      </Box>
      <Typography variant="body1" paragraph color="white">
        Track the results of previous spins and identify patterns. All results are verified using Chainlink VRF.
        {showVrfDetails && ' Click on verified numbers to view transaction details.'}
      </Typography>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1, 
          my: 3,
          justifyContent: 'center'
        }}
      >
        {recentNumbers.map((num, idx) => (
          <NumberBall 
            key={idx} 
            number={num} 
            opacity={idx < 20 ? 1 : 0.5}
            game={recentGames[idx]}
          />
        ))}
      </Box>
      
      <Typography variant="h6" gutterBottom color="white">Hot and Cold Numbers</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Typography variant="subtitle1" color="error.main" gutterBottom>Hot Numbers</Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {hotNumbers.map((num, idx) => (
                <NumberBall key={idx} number={num} size={36} />
              ))}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Typography variant="subtitle1" color="info.main" gutterBottom>Cold Numbers</Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {coldNumbers.map((num, idx) => (
                <NumberBall key={idx} number={num} size={36} />
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default React.memo(GameHistory); 