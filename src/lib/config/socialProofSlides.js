/**
 * Advisory board — confirmed advisors (public/).
 */

export const ADVISORY_BOARD = [
  {
    id: 'rahat',
    src: '/Rahat%20Movement.PNG',
    alt: 'Rahat Chowdhury — Head of DevRel at Movement',
    name: 'Rahat Chowdhury',
    role: 'Head of DevRel',
    org: 'Movement',
    blurred: false,
    accent: 'violet',
    xUrl: 'https://x.com/rahatcodes',
  },
  {
    id: 'lucas',
    src: '/Lucas.PNG',
    alt: 'Lucas Liao — Solutions Architect at BNB Chain',
    name: 'Lucas Liao',
    role: 'Solutions Architect',
    org: 'BNB Chain',
    blurred: false,
    accent: 'amber',
    xUrl: 'https://x.com/0xlucasliao',
  },
];

/** @deprecated Use ADVISORY_BOARD */
export const ADVISOR_REVEAL = ADVISORY_BOARD[0];

export const ADVISOR_ACCENT_STYLES = {
  amber: {
    border: 'border-amber-500/25 hover:border-amber-400/45',
    glow: 'shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]',
    pill: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  },
  cyan: {
    border: 'border-cyan-500/25 hover:border-cyan-400/45',
    glow: 'shadow-[0_0_40px_-12px_rgba(6,182,212,0.35)]',
    pill: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  },
  violet: {
    border: 'border-violet-500/25 hover:border-violet-400/45',
    glow: 'shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]',
    pill: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
  },
};
