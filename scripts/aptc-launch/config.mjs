/**
 * APTC mainnet launch parameters — keep in sync with src/lib/config/tokenomics.js
 * @see https://solana.com/docs/intro/installation
 */

export const APTC_LAUNCH = {
  name: 'AptCasino.fun',
  symbol: 'APTC',
  decimals: 6,
  /** Raw supply before decimals: 1_000_000_000 */
  supplyHuman: 1_000_000_000,
  uri: 'https://aptcasino.fun/aptc-token-metadata.json',
  logoPath: 'public/APTC_logo_1000x1000.png',
  /** Base58 vanity prefix for mint keypair (case-sensitive). 4 chars ≈ long grind. */
  vanityPrefix: 'APTC',
  /** Also acceptable if 4-char grind is too slow */
  vanityFallbackPrefix: 'AptC',
  revokeMint: true,
  revokeFreeze: true,
  /** Set false to update metadata URI later; true = immutable (recommended at TGE) */
  revokeUpdate: true,
};

/** On-chain allocation wallets — must total 100% / 1B APTC */
export const APTC_WALLET_DISTRIBUTION = [
  { label: 'Liquidity', address: 'CAVLQyCEycrok3Mbv5mdCbE3epGQW3ibQ447fwTLweYx', pct: 12 },
  { label: 'Treasury', address: '77WBQZcjr1eLpYDk6PrwUbSUkLw57fNyX4U7pYqrrbHM', pct: 25 },
  { label: 'Staking', address: '4Ka1vdinFUqhh3TtHaohj1MiKVUrvJBrgsVp1MfVnXFQ', pct: 12 },
  { label: 'Community', address: '6o2MnFJkPsAcrd3aQwMLPvS7S3jLqoHufPVFpjnEemdU', pct: 15 },
  { label: 'Referrals', address: 'EuGB4qtHrCanacDktatYqiBGLcESBtomrE9o9vsf2PMC', pct: 10 },
  { label: 'Partnerships', address: 'hCs3cwHHjTJbCKDgFQdcDRGLZm9foDaKbJAmjme8uN8', pct: 10 },
  { label: 'Founder reserve', address: 'H19S7VBJweiiKhE3oFivrd43j7CAkJkWKHC2dHxDkBB', pct: 8 },
  { label: 'Marketing', address: '2HuE97iCqtwJ1QaZofezzHNbgGbuoGbZA39JXgwpGWLn', pct: 5 },
  { label: 'Competitions', address: 'Cyrc6UZz1P4RqmMrmSSuYCSrzfu8w6TnYEAxGStdgHvq', pct: 3 },
];

export function validateDistribution() {
  const total = APTC_WALLET_DISTRIBUTION.reduce((s, w) => s + w.pct, 0);
  if (total !== 100) {
    throw new Error(`Wallet distribution must total 100%, got ${total}%`);
  }
}

export function amountForWallet(pct, decimals = APTC_LAUNCH.decimals) {
  const raw = BigInt(APTC_LAUNCH.supplyHuman) * BigInt(pct);
  return (raw * 10n ** BigInt(decimals)) / 100n;
}
