"use client";
import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Box, Typography, Container, Grid, Paper, Avatar, Tabs, Tab, Button, Tooltip, LinearProgress } from '@mui/material';
import Image from 'next/image';
import { FaChartLine, FaInfoCircle, FaHistory, FaQuestionCircle, FaTrophy, FaFire, FaCoins, FaChartBar, FaClock, FaPlayCircle } from 'react-icons/fa';

// Custom TabPanel component
const TabPanel = ({ children, value, index, ...props }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`game-tabpanel-${index}`}
    aria-labelledby={`game-tab-${index}`}
    {...props}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

// A tab accessor function for accessibility
const a11yProps = (index) => ({
  id: `game-tab-${index}`,
  'aria-controls': `game-tabpanel-${index}`,
});

// Custom YouTube video component
const YouTubeVideo = ({ videoUrl }) => {
  if (!videoUrl) return null;
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: '95%', sm: '85%', md: '75%' },
        maxWidth: '800px',
        mx: 'auto',
        paddingTop: { xs: '53.25%', sm: '47.5%', md: '42%' },
        mb: 6,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        border: '2px solid rgba(104, 29, 219, 0.4)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
          border: '2px solid rgba(216, 38, 51, 0.5)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-3px',
          left: '-3px',
          right: '-3px',
          bottom: '-3px',
          borderRadius: '20px',
          background: 'linear-gradient(45deg, #d82633, #681DDB, #14D854, #d82633)',
          backgroundSize: '400% 400%',
          zIndex: -1,
          filter: 'blur(10px)',
          opacity: 0.7,
          animation: 'gradient 15s ease infinite',
          '@keyframes gradient': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          }
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '16px',
          padding: '2px',
          background: 'linear-gradient(45deg, #d82633, #681DDB, #14D854, #d82633)',
          backgroundSize: '400% 400%',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude', 
          WebkitMaskComposite: 'xor',
          pointerEvents: 'none',
          animation: 'gradient 15s ease infinite',
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("/images/casino-texture.jpg"), linear-gradient(135deg, #140009 0%, #200010 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          py: 1.5,
          background: 'linear-gradient(to bottom, rgba(9, 0, 5, 0.8), rgba(9, 0, 5, 0))',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2
        }}
      >
      </Box>
      <iframe
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          zIndex: 1
        }}
        src={videoUrl}
        title="Roulette Masterclass Tutorial"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Box>
  );
};

// Memoized components for better performance
const MemoizedTabPanel = React.memo(TabPanel);
const MemoizedYouTubeVideo = React.memo(YouTubeVideo);

// Lazy loaded tab contents
const BettingOptionsContent = lazy(() => import('./BettingTable'));
const GameHistoryContent = lazy(() => import('./GameHistory'));
const FAQContent = lazy(() => import('./FAQContent'));

const GameDetail = ({ gameData = {}, bettingTableData = {}, showBettingTable = true, showProbabilities = true }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showVideo, setShowVideo] = useState(true); // Set to true by default

  // Memoize expensive calculations
  const hotNumbers = useMemo(() => [19, 7, 32], []);
  const coldNumbers = useMemo(() => [13, 6, 34], []);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Game statistics and recent-big-wins blocks were removed here — the live
  // values are now sourced from /api/games/stats via useGameStats(slug) in the
  // individual game pages (plinko/mines/roulette/wheel). Keep this comment so
  // hardcoded sample data doesn't creep back in.

  // Add win probability data
  const winProbabilities = useMemo(() => [
    { type: 'Even/Odd', probability: 48.6 },
    { type: 'Red/Black', probability: 48.6 },
    { type: 'Dozens', probability: 32.4 },
    { type: 'Single Number', probability: 2.7 }
  ], []);

  // Toggle YouTube video
  const toggleVideo = () => {
    setShowVideo(!showVideo);
  };

  return (
    <Box
      id="game-details"
      sx={{
        py: { xs: 8, md: 10 },
        px: { xs: 3, md: 8 },
        backgroundColor: '#090005',
        backgroundImage: `url("/images/casino-texture.jpg"), linear-gradient(135deg, #140009 0%, #200010 100%)`,
        backgroundBlendMode: 'overlay',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '24px',
        border: '1px solid rgba(104, 29, 219, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(15px)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
        mt: 8,
        mb: 8,
        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
        '&:hover': {
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.6)',
          transform: 'translateY(-5px)'
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-5px',
          left: '-5px',
          right: '-5px',
          bottom: '-5px',
          background: 'linear-gradient(125deg, rgba(216, 38, 51, 0.4), rgba(104, 29, 219, 0.4), rgba(20, 216, 84, 0.4))',
          backgroundSize: '300% 300%',
          zIndex: -1,
          filter: 'blur(20px)',
          opacity: 0.5,
          animation: 'gradientBg 15s ease infinite',
          '@keyframes gradientBg': {
            '0%': { backgroundPosition: '0% 50%', opacity: 0.3 },
            '50%': { backgroundPosition: '100% 50%', opacity: 0.5 },
            '100%': { backgroundPosition: '0% 50%', opacity: 0.3 }
          }
        },
        // Highlight top border with gradient
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '5%',
          right: '5%',
          height: '3px',
          background: 'linear-gradient(90deg, transparent, #d82633, #681DDB, #d82633, transparent)',
          opacity: 0.8,
          zIndex: 1
        }
      }}
    >
      {/* Animated background accents */}
      <Box 
        sx={{ 
          position: 'absolute', 
          right: '-10%', 
          top: '-10%', 
          width: '40%', 
          height: '40%', 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(9, 0, 5, 0.25) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
          opacity: 0.7,
          animation: 'float-slow 20s ease-in-out infinite',
          '@keyframes float-slow': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(-5%, 5%)' }
          }
        }} 
      />
      <Box 
        sx={{ 
          position: 'absolute', 
          left: '-5%', 
          bottom: '-5%', 
          width: '35%', 
          height: '35%', 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(9, 0, 5, 0.25) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
          opacity: 0.7,
          animation: 'float-slow2 18s ease-in-out infinite',
          '@keyframes float-slow2': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(5%, -5%)' }
          }
        }} 
      />
      <Box 
        sx={{ 
          position: 'absolute', 
          left: '50%', 
          top: '-5%', 
          width: '25%', 
          height: '25%', 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(9, 0, 5, 0.2) 0%, transparent 70%)',
          filter: 'blur(50px)',
          transform: 'translateX(-50%)',
          zIndex: 0,
          opacity: 0.6,
          animation: 'pulse 8s ease-in-out infinite alternate',
          '@keyframes pulse': {
            '0%': { opacity: 0.4, transform: 'translateX(-50%) scale(0.9)' },
            '100%': { opacity: 0.7, transform: 'translateX(-50%) scale(1.1)' }
          }
        }} 
      />
      
      {/* Subtle animated border glow */}
      <Box 
        sx={{ 
          position: 'absolute', 
          inset: 0,
          borderRadius: '24px',
          padding: '1px',
          background: 'linear-gradient(125deg, rgba(9, 0, 5, 0.5), rgba(9, 0, 5, 0.5))',
          opacity: 0.4,
          zIndex: 0,
          animation: 'borderPulse 4s ease-in-out infinite alternate',
          '@keyframes borderPulse': {
            '0%': { opacity: 0.2 },
            '100%': { opacity: 0.5 }
          }
        }} 
      />
      
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={5}>
          {/* Main content (full width without left sidebar) */}
          <Grid item xs={12}>
            <Box sx={{ mb: 6 }}>
              {/* Always show YouTube video at the top */}
              {gameData.youtube && (
                <Box sx={{ mb: 6 }}>
                  <MemoizedYouTubeVideo videoUrl={gameData.youtube} />
                </Box>
              )}
              
              {/* Game description paragraphs */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, rgba(9, 0, 5, 0.6) 0%, rgba(9, 0, 5, 0.3) 100%)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  p: { xs: 3, md: 4 },
                  mb: 4,
                  border: '1px solid rgba(104, 29, 219, 0.2)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '5px',
                    height: '100%',
                    background: 'linear-gradient(to bottom, #d82633, #681DDB)',
                  }
                }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 3,
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #FFFFFF, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block'
                  }}
                >
                  About {gameData.title || 'Game'}
                </Typography>
                
                {gameData.paragraphs && gameData.paragraphs.map((paragraph, index) => (
                  <Typography 
                    key={index} 
                    variant="body1" 
                    sx={{ 
                      mb: 2.5,
                      lineHeight: 1.95,
                      fontSize: '1.05rem',
                      color: 'rgba(255, 255, 255, 0.92)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      position: 'relative',
                      pl: index === 0 ? 0 : 2,
                      borderLeft: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {paragraph}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default GameDetail;
