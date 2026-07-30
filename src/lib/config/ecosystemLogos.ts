/**
 * Landing page — supported chains & DEX / tooling partners.
 * Logo files live in /public/logos (shared with chain connect modal).
 */

export type EcosystemLogo = {
  key: string;
  src: string;
  alt: string;
  /** Shown on chain tiles when not yet playable */
  comingSoon?: boolean;
};

/** All multichain targets — order matches registry */
export const ECOSYSTEM_CHAIN_LOGOS: EcosystemLogo[] = [
  { key: 'solana', src: '/logos/solana-sol-logo.png', alt: 'Solana' },
  { key: 'aptos', src: '/logos/aptos-logo.png', alt: 'Aptos' },
  { key: 'robinhood', src: '/logos/robinhood.png', alt: 'Robinhood Chain', comingSoon: true },
  { key: 'sui', src: '/logos/sui-logo.png', alt: 'Sui', comingSoon: true },
  { key: 'near', src: '/logos/near.png', alt: 'NEAR', comingSoon: true },
  { key: 'starknet', src: '/logos/starknet-strk-logo.svg', alt: 'Starknet', comingSoon: true },
  { key: 'stellar', src: '/logos/stellar-xlm-logo.png', alt: 'Stellar', comingSoon: true },
  { key: 'tezos', src: '/logos/tezos-xtz-logo.png', alt: 'Tezos', comingSoon: true },
  { key: 'evm', src: '/logos/ethereum-eth-logo.png', alt: 'EVM', comingSoon: true },
  { key: 'bnb', src: '/logos/bnb-bnb-logo.png', alt: 'BNB Chain', comingSoon: true },
  { key: 'push', src: '/logos/push-logo.png', alt: 'Push Chain', comingSoon: true },
];

/** DEX & analytics partners */
export const ECOSYSTEM_DEX_LOGOS: EcosystemLogo[] = [
  { key: 'uniswap', src: '/logos/uniswap-uni-logo.png', alt: 'Uniswap' },
  { key: 'dexscreener', src: '/logos/dexscreener.png', alt: 'DexScreener' },
  { key: 'dextools', src: '/logos/dextools.png', alt: 'DexTools' },
  { key: 'coingecko', src: '/logos/coingecko-logo.png', alt: 'CoinGecko' },
  { key: 'cmc', src: '/logos/cmc.png', alt: 'CoinMarketCap' },
  { key: 'gecko', src: '/logos/gecko.png', alt: 'GeckoTerminal' },
  { key: 'axiom', src: '/logos/axiom.jpeg', alt: 'Axiom' },
  { key: 'jupiter', src: '/logos/jupiter.jpg', alt: 'Jupiter' },
  { key: 'bubblemaps', src: '/logos/bubblemaps.png', alt: 'Bubblemaps' },
];
