"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  alpha 
} from '@mui/material';

/**
 * A card component that can be used to navigate to other pages
 * with hover animation effects
 */
export default function HoverSelectionCard({ 
  children, 
  heading, 
  subheading, 
  href, 
  disabled = false,
  ...props 
}) {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (!disabled) {
      setIsHovered(false);
    }
  };
  
  const cardContent = (
    <Paper
      elevation={isHovered ? 12 : 3}
      sx={{
        p: 3,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        background: disabled 
          ? alpha(theme.palette.background.paper, 0.1)
          : isHovered 
            ? 'linear-gradient(145deg, #1a1a1a, #330e6d)' 
            : alpha(theme.palette.background.paper, 0.15),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isHovered ? theme.palette.primary.main : 'transparent'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        '&:hover': {
          transform: disabled ? 'none' : 'translateY(-4px)',
        },
        ...props
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box>
        <Typography 
          variant="h5" 
          component="h3" 
          color={isHovered ? 'primary' : 'text.primary'}
          sx={{ 
            mb: 0.5,
            transition: 'color 0.3s ease',
            opacity: isHovered ? 1 : 0.9
          }}
        >
          {heading}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 2,
            opacity: isHovered ? 0.9 : 0.7, 
            transition: 'opacity 0.3s ease',
          }}
        >
          {subheading}
        </Typography>
        
        {children}
      </Box>
      
      {isHovered && !disabled && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            transform: 'translate(50%, -50%)',
            background: 'radial-gradient(circle, rgba(106, 13, 173, 0.4) 0%, rgba(106, 13, 173, 0) 70%)',
            borderRadius: '50%',
            zIndex: 0,
          }}
        />
      )}
    </Paper>
  );

  if (disabled) {
    return cardContent;
  }
  
  return (
    <Link href={href} passHref style={{ textDecoration: 'none' }}>
      {cardContent}
    </Link>
  );
} 