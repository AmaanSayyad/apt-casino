import React, { useState } from 'react';
import { Box, Typography, Paper, Collapse, IconButton } from '@mui/material';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const FAQContent = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: "What is the house edge in European Roulette?",
      answer: "European Roulette has a house edge of 2.70%, which is lower than American Roulette (5.26%) due to having only one zero pocket instead of two."
    },
    {
      question: "How does provably fair technology work in this game?",
      answer: "Our roulette game uses blockchain-based random number generation that creates verifiable and tamper-proof results. Each spin outcome is determined by a combination of the house's pre-committed seed and your browser's randomness."
    },
    {
      question: "What is the maximum payout I can win?",
      answer: "The maximum payout is 35:1 for a straight-up bet (betting on a single number). With the maximum bet of 1,000 APTC, you can win up to 35,000 APTC on a single spin."
    },
    {
      question: "Can I play roulette on mobile devices?",
      answer: "Yes, our roulette game is fully responsive and optimized for mobile devices. You can enjoy the same high-quality experience on smartphones and tablets."
    },
    {
      question: "How do I withdraw my winnings?",
      answer: "After winning, click the 'Collect' button to transfer your winnings to your wallet. The transaction is processed on the blockchain and typically completes within a few minutes."
    }
  ];

  const handleExpandClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" gutterBottom color="white" sx={{ mb: 4 }}>
        Frequently Asked Questions
      </Typography>
      
      {faqs.map((faq, index) => (
        <Box 
          key={index} 
          sx={{ 
            mb: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateX(8px)'
            }
          }}
        >
          <Box
            onClick={() => handleExpandClick(index)}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: expandedIndex === index ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
            }}
          >
            <Typography 
              variant="h6" 
              color="primary.main1"
              sx={{
                fontSize: '1.1rem',
                fontWeight: expandedIndex === index ? 'bold' : 'medium'
              }}
            >
              {faq.question}
            </Typography>
            <IconButton 
              size="small" 
              sx={{ color: 'white' }}
            >
              {expandedIndex === index ? <FaChevronUp /> : <FaChevronDown />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedIndex === index}>
            <Box sx={{ p: 2, pt: 1 }}>
              <Typography 
                variant="body1" 
                color="white"
                sx={{
                  opacity: 0.9,
                  lineHeight: 1.6
                }}
              >
                {faq.answer}
              </Typography>
            </Box>
          </Collapse>
        </Box>
      ))}
    </Paper>
  );
};

export default React.memo(FAQContent); 