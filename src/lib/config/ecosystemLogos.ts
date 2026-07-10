/**
 * Landing page — supported chains & DEX / tooling partners.
 * Logo files live in /public/logos (shared with chain connect modal).
 */

import {
  METAPLEX_LOGO_SRC,
  METADAO_LOGO_SRC,
  RAYDIUM_LOGO_SRC,
  APTC_LOGO_SRC,
  PINKSALE_LOGO_SRC,
  PYTH_LOGO_SRC,
} from './ipo';

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
  { key: 'sui', src: '/logos/sui-logo.png', alt: 'Sui', comingSoon: true },
  { key: 'near', src: '/logos/near.png', alt: 'NEAR', comingSoon: true },
  { key: 'starknet', src: '/logos/starknet-strk-logo.svg', alt: 'Starknet', comingSoon: true },
  { key: 'stellar', src: '/logos/stellar-xlm-logo.png', alt: 'Stellar', comingSoon: true },
  { key: 'tezos', src: '/logos/tezos-xtz-logo.png', alt: 'Tezos', comingSoon: true },
  { key: 'evm', src: '/logos/ethereum-eth-logo.png', alt: 'EVM', comingSoon: true },
  { key: 'bnb', src: '/logos/bnb-bnb-logo.png', alt: 'BNB Chain', comingSoon: true },
  { key: 'push', src: '/logos/push-logo.png', alt: 'Push Chain', comingSoon: true },
];

/** DEX, analytics & launch tooling */
export const ECOSYSTEM_DEX_LOGOS: EcosystemLogo[] = [
  { key: 'aptc', src: APTC_LOGO_SRC, alt: 'APTC' },
  { key: 'metaplex', src: METAPLEX_LOGO_SRC, alt: 'Metaplex Genesis' },
  { key: 'metadao', src: METADAO_LOGO_SRC, alt: 'MetaDAO' },
  { key: 'pinksale', src: PINKSALE_LOGO_SRC, alt: 'PinkSale' },
  { key: 'pyth', src: PYTH_LOGO_SRC, alt: 'Pyth Network' },
  { key: 'raydium', src: RAYDIUM_LOGO_SRC, alt: 'Raydium' },
  { key: 'jupiter', src: '/logos/jupiter.jpg', alt: 'Jupiter' },
  { key: 'meteora', src: '/logos/meteora-logo.png', alt: 'Meteora' },
  { key: 'pancakeswap', src: '/logos/pancakeswap-logo.png', alt: 'PancakeSwap' },
  { key: 'dexscreener', src: '/logos/dexscreener.png', alt: 'DexScreener' },
  { key: 'dextools', src: '/logos/dextools.png', alt: 'DexTools' },
  { key: 'birdeye', src: '/logos/birdeye.png', alt: 'Birdeye' },
  { key: 'coingecko', src: '/logos/coingecko-logo.png', alt: 'CoinGecko' },
  { key: 'cmc', src: '/logos/cmc.png', alt: 'CoinMarketCap' },
  { key: 'gecko', src: '/logos/gecko.png', alt: 'GeckoTerminal' },
  { key: 'axiom', src: '/logos/axiom.jpeg', alt: 'Axiom' },
  { key: 'photon', src: '/logos/photon.png', alt: 'Photon' },
  { key: 'gmgn', src: '/logos/gmgn.png', alt: 'GMGN' },
  { key: 'solscan', src: '/Solscan.png', alt: 'Solscan' },
  { key: 'bubblemaps', src: '/logos/bubblemaps.png', alt: 'Bubblemaps' },
  { key: 'rugcheck', src: '/logos/rugcheck.jpg', alt: 'RugCheck' },
];
