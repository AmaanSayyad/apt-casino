import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import GameHistoryCard from './GameHistoryCard';

const GameHistoryList = ({ games, gameType, loading, error }) => {
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Loading game history...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Error loading game history: {error}
      </Alert>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          No games played yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
          Start playing to see your game history here!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ 
        color: 'white', 
        mb: 3, 
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        🎮 {gameType} Game History
      </Typography>
      
      {games.map((game, index) => (
        <GameHistoryCard 
          key={game.id || index} 
          game={game} 
          gameType={gameType}
        />
      ))}
    </Box>
  );
};

export default GameHistoryList;