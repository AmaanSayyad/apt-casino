/** Canonical APT-Casino investor pitch deck (Figma Slides). */
export const PITCH_DECK_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PITCH_DECK_URL?.trim()) ||
  'https://www.figma.com/deck/pQc6GTjM3a8sXqbuGHyu1Z';

export const PITCH_DECK_EMBED = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(
  PITCH_DECK_URL,
)}`;
