/**
 * Referral utilities — pure server-side.
 *
 * Wallet normalization mirrors what `/api/deposit` uses for Aptos addresses
 * (lower-case, 0x-prefixed, 64-char hex). Non-hex inputs are returned trimmed
 * + lower-cased so other chains (e.g. Solana) still get consistent keys.
 */

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // skip 0/O/1/I/L
const CODE_LENGTH = 8;

export const CUSTOM_REFERRAL_MIN = 3;
export const CUSTOM_REFERRAL_MAX = 20;

/** 3–20 chars; letters, digits, hyphen/underscore; no leading/trailing separator. */
const CUSTOM_REFERRAL_PATTERN = /^[A-Z0-9](?:[A-Z0-9_-]{0,18}[A-Z0-9])?$/;

export const REFERRAL_RESERVED_CODES = new Set([
  'ADMIN',
  'API',
  'APT',
  'APTC',
  'APTOS',
  'BANK',
  'CASINO',
  'CODE',
  'DASHBOARD',
  'GAME',
  'GAMES',
  'HELP',
  'HOME',
  'LEADERBOARD',
  'LIVE',
  'LOGIN',
  'LOTTERY',
  'MINES',
  'NULL',
  'OTC',
  'PLINKO',
  'PROFILE',
  'REF',
  'REFER',
  'REFERRAL',
  'REFERRALS',
  'ROULETTE',
  'SOL',
  'SOLANA',
  'STAKE',
  'STAKING',
  'SUPPORT',
  'UNDEFINED',
  'WHEEL',
  'WWW',
]);

export function normalizeReferralCodeInput(code: string | null | undefined): string {
  return String(code || '').trim().toUpperCase();
}

export function normalizeWallet(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = String(input).trim().toLowerCase();
  if (!trimmed) return null;

  // Aptos-style hex address normalization (also fine for EVM 0x addresses).
  if (/^0x[0-9a-f]+$/.test(trimmed)) {
    const hex = trimmed.slice(2).padStart(64, '0');
    return `0x${hex}`;
  }

  return trimmed;
}

/** Chain-aware wallet key for DB lookups (Solana base58 is case-sensitive). */
export function normalizeWalletForChain(
  input: string | null | undefined,
  chain?: string | null,
): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  if ((chain || '').toLowerCase() === 'solana') {
    if (trimmed.length < 32 || trimmed.length > 44) return null;
    return trimmed;
  }

  return normalizeWallet(trimmed);
}

/** Compare wallets for self-referral / leaderboard (Solana allows legacy lowercase rows). */
export function walletsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
  chain?: string | null,
): boolean {
  if (!a || !b) return false;
  if ((chain || '').toLowerCase() === 'solana') {
    return a === b || a.toLowerCase() === b.toLowerCase();
  }
  const na = normalizeWallet(a);
  const nb = normalizeWallet(b);
  return !!na && na === nb;
}

export function inferChainFromWallet(wallet: string | null | undefined): 'solana' | 'aptos' {
  const t = String(wallet || '').trim();
  if (/^0x[0-9a-f]+$/i.test(t)) return 'aptos';
  if (t.length >= 32 && t.length <= 44) return 'solana';
  return 'aptos';
}

/** Resolve chain for referral APIs — wallet shape wins over a mismatched query param. */
export function resolveReferralChain(
  walletInput: string | null | undefined,
  chainParam: string | null | undefined,
): 'solana' | 'aptos' {
  const inferred = inferChainFromWallet(walletInput);
  if (inferred === 'solana') return 'solana';
  if (inferred === 'aptos') return 'aptos';
  return (chainParam || 'aptos').toLowerCase() === 'solana' ? 'solana' : 'aptos';
}

export function generateReferralCode(): string {
  let out = '';
  const buf = new Uint8Array(CODE_LENGTH);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buf);
    for (let i = 0; i < CODE_LENGTH; i += 1) {
      out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length];
    }
    return out;
  }
  // Fallback (Math.random) — only reached in environments without WebCrypto.
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export function isAutoReferralCode(code: string | null | undefined): boolean {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== CODE_LENGTH) return false;
  for (let i = 0; i < code.length; i += 1) {
    if (!CODE_ALPHABET.includes(code[i])) return false;
  }
  return true;
}

export function isValidCustomReferralName(name: string | null | undefined): boolean {
  const n = normalizeReferralCodeInput(name);
  if (n.length < CUSTOM_REFERRAL_MIN || n.length > CUSTOM_REFERRAL_MAX) return false;
  if (!CUSTOM_REFERRAL_PATTERN.test(n)) return false;
  if (REFERRAL_RESERVED_CODES.has(n)) return false;
  return true;
}

export function isValidReferralCode(code: string | null | undefined): boolean {
  if (!code || typeof code !== 'string') return false;
  const n = normalizeReferralCodeInput(code);
  return isAutoReferralCode(n) || isValidCustomReferralName(n);
}

export const REFERRAL_CODE_LENGTH = CODE_LENGTH;
