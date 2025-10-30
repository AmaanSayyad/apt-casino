"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, useMediaQuery } from '@mui/material';
import { FaChevronLeft, FaChevronRight, FaGift, FaCoins } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const promotions = [
  {
    id: 1,
    title: "Weekly Cashback",
    description: "Get 5% cashback on all your roulette losses every week",
    color: "linear-gradient(135deg, #681DDB, #4A148C)",
    icon: <FaCoins size={24} />,
    buttonText: "Claim Now"
  },
  {
    id: 2,
    title: "Double Win Tuesday",
    description: "Every Tuesday: Double your winnings on 3 consecutive wins",
    color: "linear-gradient(135deg, #d82633, #8E0000)",
    icon: <FaGift size={24} />,
    buttonText: "Learn More"
  },
  {
    id: 3,
    title: "VIP Rewards",
    description: "Play roulette to earn VIP points and unlock exclusive rewards",
    color: "linear-gradient(135deg, #14D854, #00695C)",
    icon: <FaGift size={24} />,
    buttonText: "Join VIP"
  }
];

const FeaturedPromotions = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const isMobile = useMediaQuery('(max-width:600px)');
  
  const nextPromotion = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % promotions.length);
  };
  
  const prevPromotion = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + promotions.length) % promotions.length);
  };
  
  // Auto-rotate promotions
  useEffect(() => {
    const interval = setInterval(() => {
      nextPromotion();
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
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
        <FaGift color="#681DDB" />
        Featured Promotions
      </Typography>
      
      <Box 
        sx={{ 
          position: 'relative', 
          height: isMobile ? '200px' : '150px',
          overflow: 'hidden',
          mt: 2
        }}
      >
        <IconButton 
          sx={{ 
            position: 'absolute', 
            left: 0, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            zIndex: 2,
            backgroundColor: 'rgba(0,0,0,0.5)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
          }}
          onClick={prevPromotion}
        >
          <FaChevronLeft />
        </IconButton>
        
        <IconButton 
          sx={{ 
            position: 'absolute', 
            right: 0, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            zIndex: 2,
            backgroundColor: 'rgba(0,0,0,0.5)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
          }}
          onClick={nextPromotion}
        >
          <FaChevronRight />
        </IconButton>
        
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ 
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box 
              sx={{
                width: '80%',
                height: '100%',
                background: promotions[current].color,
                borderRadius: 3,
                p: 3,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box 
                  sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {promotions[current].icon}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="white">
                    {promotions[current].title}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    {promotions[current].description}
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="contained" 
                sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
                  px: 3,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {promotions[current].buttonText}
              </Button>
            </Box>
          </motion.div>
        </AnimatePresence>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        {promotions.map((_, index) => (
          <Box
            key={index}
            onClick={() => {
              setDirection(index > current ? 1 : -1);
              setCurrent(index);
            }}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: current === index ? '#681DDB' : 'rgba(255,255,255,0.3)',
              mx: 0.5,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default FeaturedPromotions; 