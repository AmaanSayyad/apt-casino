'use client';

import React from 'react';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/** Rich insufficient-balance alert (replaces long plain-text toasts). */
export default function PlayBalanceAlert({
  have,
  need,
  more,
  symbol = 'SOL',
  hint,
  onClose,
}) {
  return (
    <Paper
      elevation={8}
      role="alert"
      sx={{
        width: '100%',
        maxWidth: 400,
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(145deg, rgba(28, 8, 38, 0.98) 0%, rgba(12, 4, 18, 0.98) 100%)',
        border: '1px solid rgba(216, 38, 51, 0.45)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: 'linear-gradient(180deg, #d82633, #681DDB)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pl: 0.5 }}>
        <Box
          sx={{
            mt: 0.25,
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: 'rgba(216, 38, 51, 0.15)',
            border: '1px solid rgba(216, 38, 51, 0.35)',
          }}
        >
          <AccountBalanceWalletOutlinedIcon sx={{ color: '#ff8a80', fontSize: 22 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ lineHeight: 1.3 }}>
            Insufficient balance
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.55)" sx={{ display: 'block', mt: 0.25 }}>
            This bet exceeds your playable balance
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: 1,
              mt: 2,
              mb: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(104, 29, 219, 0.2)',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="rgba(255,255,255,0.45)" sx={{ display: 'block', mb: 0.5 }}>
                You have
              </Typography>
              <Typography variant="body1" fontWeight={700} color="white" sx={{ fontFamily: 'monospace' }}>
                {have}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                {symbol}
              </Typography>
            </Box>

            <ArrowForwardIcon sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="rgba(255,255,255,0.45)" sx={{ display: 'block', mb: 0.5 }}>
                Bet needs
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#ff8a80" sx={{ fontFamily: 'monospace' }}>
                {need}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                {symbol}
              </Typography>
            </Box>
          </Box>

          {more && Number(more) > 0 ? (
            <Typography variant="body2" color="rgba(255,255,255,0.75)" sx={{ lineHeight: 1.45 }}>
              Short by{' '}
              <Box component="span" sx={{ color: '#ffc107', fontWeight: 700, fontFamily: 'monospace' }}>
                {more} {symbol}
              </Box>
            </Typography>
          ) : null}

          {hint ? (
            <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ display: 'block', mt: 1, lineHeight: 1.4 }}>
              {hint}
            </Typography>
          ) : null}
        </Box>

        {onClose ? (
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Dismiss"
            sx={{
              color: 'rgba(255,255,255,0.45)',
              mt: -0.5,
              mr: -0.5,
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Box>
    </Paper>
  );
}
