"use client";
import React from 'react';
import { Box, Typography, Container, Grid } from '@mui/material';
import { FaPlayCircle } from 'react-icons/fa';

// Custom YouTube video component
const YouTubeVideo = ({ videoUrl }) => {
  if (!videoUrl) return null;
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', // 16:9 aspect ratio
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
        title="Mines Masterclass Tutorial"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Box>
  );
};

const MinesGameDetail = ({ gameData = {} }) => {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        px: { xs: 3, md: 6 },
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
      }}
    >
      {/* Background elements */}
      <Box 
        sx={{ 
          position: 'absolute', 
          inset: 0,
          backgroundImage: `url("/images/casino-texture.jpg"), linear-gradient(135deg, #140009 0%, #200010 100%)`,
          backgroundBlendMode: 'overlay',
          backgroundSize: 'cover',
          opacity: 0.05,
          zIndex: 0
        }} 
      />
      
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={5}>
          {/* Left column - Video */}
          <Grid item xs={12} md={6}>
            <YouTubeVideo videoUrl={gameData.youtube} />
          </Grid>
          
          {/* Right column - Description */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, rgba(9, 0, 5, 0.6) 0%, rgba(9, 0, 5, 0.3) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                p: { xs: 3, md: 4 },
                border: '1px solid rgba(104, 29, 219, 0.2)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
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
                About {gameData.title || 'Mines'}
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
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MinesGameDetail; 