'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Tooltip, Typography, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ROULETTE_VARIANT,
  ROULETTE_TUTORIAL_STEPS,
  ROULETTE_TUTORIAL_TIPS,
  ROULETTE_ODDS_HIGHLIGHTS,
  rouletteOdds,
} from '../tutorials';

const tooltipSx = {
  tooltip: {
    maxWidth: 280,
    px: 1.5,
    py: 1,
    fontSize: '0.75rem',
    lineHeight: 1.45,
    backgroundColor: 'rgba(10, 0, 8, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(192, 38, 211, 0.25)',
    borderRadius: '10px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
  },
};

const STEP_ICONS = {
  wallet: AccountBalanceWalletOutlinedIcon,
  chip: CasinoOutlinedIcon,
  board: GridOnOutlinedIcon,
  spin: SyncOutlinedIcon,
};

function parseOddsSections() {
  const sections = [];
  let current = null;
  for (const line of rouletteOdds) {
    if (line.startsWith('Below')) {
      const title = line
        .replace(/^Below are the supported /i, '')
        .replace(/ bets$/i, '')
        .trim();
      current = { title, items: [] };
      sections.push(current);
    } else if (line.startsWith('-') && current) {
      const raw = line.slice(1).trim();
      const m = raw.match(/^(.+?)\s*\(([^)]+)\s*payout\)\s*:\s*(.+)$/i);
      if (m) {
        current.items.push({ name: m[1].trim(), payout: m[2].trim(), desc: m[3].trim() });
      } else {
        current.items.push({ name: raw, payout: '', desc: '' });
      }
    }
  }
  return sections;
}

const ODDS_SECTIONS = parseOddsSections();

function InfoTrigger({ label, preview, active, onClick }) {
  return (
    <Tooltip title={preview} placement="top" arrow slotProps={{ tooltip: tooltipSx }}>
      <Box
        component="button"
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={`${label} — ${preview}`}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          borderRadius: '10px',
          border: '1px solid',
          borderColor: active ? 'rgba(192, 38, 211, 0.45)' : 'rgba(255,255,255,0.08)',
          bgcolor: active ? 'rgba(104, 29, 219, 0.15)' : 'rgba(255,255,255,0.03)',
          color: active ? '#f0abfc' : 'rgba(255,255,255,0.65)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          font: 'inherit',
          '&:hover': {
            borderColor: 'rgba(192, 38, 211, 0.4)',
            bgcolor: 'rgba(104, 29, 219, 0.12)',
            color: '#fff',
            '& .info-icon-wrap': {
              bgcolor: 'rgba(192, 38, 211, 0.35)',
              transform: 'scale(1.08)',
              boxShadow: '0 0 14px rgba(192, 38, 211, 0.45)',
            },
          },
        }}
      >
        <Typography component="span" sx={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.02em' }}>
          {label}
        </Typography>
        <Box
          className="info-icon-wrap"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 15 }} />
        </Box>
      </Box>
    </Tooltip>
  );
}

export function RouletteInfoTriggers({ activePanel, onOpen }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
      <InfoTrigger
        label="Tutorial"
        preview="4-step guide — fund, chip, bet, spin"
        active={activePanel === 'tutorial'}
        onClick={() => onOpen(activePanel === 'tutorial' ? null : 'tutorial')}
      />
      <InfoTrigger
        label="Odds"
        preview="Inside & outside bet types with payout multipliers"
        active={activePanel === 'odds'}
        onClick={() => onOpen(activePanel === 'odds' ? null : 'odds')}
      />
    </Box>
  );
}

function PanelTabs({ panel, onSwitch }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        p: 0.5,
        mx: 2.5,
        mt: 2,
        borderRadius: '12px',
        bgcolor: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {[
        { id: 'tutorial', label: 'How to play' },
        { id: 'odds', label: 'Payout odds' },
      ].map(({ id, label }) => (
        <Box
          key={id}
          component="button"
          type="button"
          onClick={() => onSwitch(id)}
          sx={{
            flex: 1,
            py: 1,
            borderRadius: '9px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: panel === id ? '#fff' : 'rgba(255,255,255,0.4)',
            bgcolor: panel === id ? 'rgba(104, 29, 219, 0.35)' : 'transparent',
            boxShadow: panel === id ? '0 2px 12px rgba(104, 29, 219, 0.25)' : 'none',
            transition: 'all 0.2s ease',
            '&:hover': { color: '#fff' },
          }}
        >
          {label}
        </Box>
      ))}
    </Box>
  );
}

function TutorialContent({ onViewOdds }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          p: 1.5,
          borderRadius: '12px',
          border: '1px solid rgba(20, 216, 84, 0.2)',
          bgcolor: 'rgba(20, 216, 84, 0.06)',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '10px',
            bgcolor: 'rgba(20, 216, 84, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 800,
            color: '#14D854',
            fontFamily: 'monospace',
          }}
        >
          0
        </Box>
        <Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
            {ROULETTE_VARIANT.title}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', mt: 0.25, lineHeight: 1.5 }}>
            {ROULETTE_VARIANT.tagline}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {ROULETTE_TUTORIAL_STEPS.map(({ step, title, body, icon }) => {
          const Icon = STEP_ICONS[icon] || CasinoOutlinedIcon;
          return (
            <Box
              key={step}
              sx={{
                display: 'flex',
                gap: 1.5,
                p: 1.5,
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.06)',
                bgcolor: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'rgba(104, 29, 219, 0.2)' },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(241,50,77,0.2), rgba(88,28,190,0.25))',
                  border: '1px solid rgba(192, 38, 211, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon sx={{ fontSize: 18, color: '#e9d5ff' }} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.35 }}>
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'rgba(244, 114, 182, 0.8)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    STEP {step}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#fff', mb: 0.5 }}>
                  {title}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.58)', lineHeight: 1.55 }}>
                  {body}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderRadius: '12px',
          border: '1px dashed rgba(255,255,255,0.1)',
          bgcolor: 'rgba(255,255,255,0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#fbbf24' }}>
            QUICK TIPS
          </Typography>
        </Box>
        <Box component="ul" sx={{ m: 0, pl: 2.25, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {ROULETTE_TUTORIAL_TIPS.map((tip) => (
            <Typography
              key={tip}
              component="li"
              sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}
            >
              {tip}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={onViewOdds}
        sx={{
          width: '100%',
          py: 1.25,
          borderRadius: '10px',
          border: '1px solid rgba(104, 29, 219, 0.35)',
          bgcolor: 'rgba(104, 29, 219, 0.08)',
          color: '#e9d5ff',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: 'rgba(104, 29, 219, 0.15)', borderColor: 'rgba(192, 38, 211, 0.5)' },
        }}
      >
        View full payout odds →
      </Box>
    </Box>
  );
}

function OddsContent() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {ROULETTE_ODDS_HIGHLIGHTS.map(({ label, payout, color }) => (
          <Box
            key={label}
            sx={{
              flex: '1 1 100px',
              minWidth: 90,
              p: 1.25,
              borderRadius: '10px',
              border: `1px solid ${color}33`,
              bgcolor: `${color}12`,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color }}>
              {payout}
            </Typography>
            <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', mt: 0.25 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {ODDS_SECTIONS.map((section) => (
        <Box key={section.title}>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#c084fc',
              mb: 1,
            }}
          >
            {section.title} bets
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1,
            }}
          >
            {section.items.map((item) => (
              <Box
                key={item.name}
                sx={{
                  p: 1.25,
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  bgcolor: 'rgba(255,255,255,0.02)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {item.name}
                  </Typography>
                  {item.payout && (
                    <Typography
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: '#e9d5ff',
                        px: 0.75,
                        py: 0.25,
                        borderRadius: '4px',
                        bgcolor: 'rgba(104, 29, 219, 0.2)',
                      }}
                    >
                      {item.payout}
                    </Typography>
                  )}
                </Box>
                {item.desc && (
                  <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', mt: 0.5, lineHeight: 1.4 }}>
                    {item.desc}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function RouletteInfoDialog({ panel, onClose, onSwitchPanel }) {
  const [mounted, setMounted] = useState(false);
  const open = panel === 'tutorial' || panel === 'odds';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const switchPanel = onSwitchPanel || (() => {});

  return createPortal(
    <AnimatePresence>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
        role="presentation"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="roulette-info-title"
          style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: panel === 'odds' ? 560 : 480 }}
        >
          <Box
            sx={{
              overflow: 'hidden',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              bgcolor: '#0A0008',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(192,38,211,0.08)',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                px: 2.5,
                pt: 2.5,
                pb: 2,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background:
                  'linear-gradient(180deg, rgba(216, 38, 51, 0.1) 0%, rgba(104, 29, 219, 0.06) 40%, transparent 100%)',
              }}
            >
              <IconButton
                onClick={onClose}
                aria-label="Close"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  color: 'rgba(255,255,255,0.45)',
                  bgcolor: 'rgba(255,255,255,0.04)',
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <Typography
                sx={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(244, 114, 182, 0.75)',
                }}
              >
                APT-Casino
              </Typography>
              <Typography
                id="roulette-info-title"
                sx={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#fff',
                  mt: 0.5,
                  pr: 4,
                  fontFamily: 'var(--font-display, inherit)',
                }}
              >
                Roulette guide
              </Typography>
            </Box>

            <PanelTabs panel={panel} onSwitch={switchPanel} />

            <Box
              sx={{
                maxHeight: 'min(62vh, 480px)',
                overflowY: 'auto',
                px: 2.5,
                py: 2,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'rgba(104, 29, 219, 0.35)',
                  borderRadius: 3,
                },
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={panel}
                  initial={{ opacity: 0, x: panel === 'odds' ? 8 : -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: panel === 'odds' ? -8 : 8 }}
                  transition={{ duration: 0.2 }}
                >
                  {panel === 'tutorial' ? (
                    <TutorialContent onViewOdds={() => switchPanel('odds')} />
                  ) : (
                    <OddsContent />
                  )}
                </motion.div>
              </AnimatePresence>
            </Box>

            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                Press Esc to close
              </Typography>
              <Box
                component="button"
                type="button"
                onClick={onClose}
                sx={{
                  px: 3,
                  py: 0.9,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  background: 'linear-gradient(90deg, #f1324d, #581cbe)',
                  boxShadow: '0 4px 20px rgba(241, 50, 77, 0.25)',
                  '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-1px)' },
                  transition: 'all 0.2s',
                }}
              >
                Got it
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </AnimatePresence>,
    document.body,
  );
}
