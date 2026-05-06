// Aptos Network Configuration
export const APTOS_NETWORKS = {
  TESTNET: 'testnet',
  MAINNET: 'mainnet',
  DEVNET: 'devnet'
};

// Aptos Network URLs
export const APTOS_NETWORK_URLS = {
  [APTOS_NETWORKS.TESTNET]: "https://fullnode.testnet.aptoslabs.com",
  [APTOS_NETWORKS.MAINNET]: "https://fullnode.mainnet.aptoslabs.com",
  [APTOS_NETWORKS.DEVNET]: "https://fullnode.devnet.aptoslabs.com"
};

// Aptos Faucet URLs
export const APTOS_FAUCET_URLS = {
  [APTOS_NETWORKS.TESTNET]: "https://faucet.testnet.aptoslabs.com",
  [APTOS_NETWORKS.DEVNET]: "https://faucet.devnet.aptoslabs.com"
};

// Aptos Explorer URLs
export const APTOS_EXPLORER_URLS = {
  [APTOS_NETWORKS.TESTNET]: "https://explorer.aptoslabs.com/account",
  [APTOS_NETWORKS.MAINNET]: "https://explorer.aptoslabs.com/account",
  [APTOS_NETWORKS.DEVNET]: "https://explorer.aptoslabs.com/account"
};

// Default network (can be changed via environment variable)
export const DEFAULT_NETWORK = APTOS_NETWORKS.MAINNET;

// Casino Module Configuration
export const CASINO_MODULE_CONFIG = {
  [APTOS_NETWORKS.TESTNET]: {
    moduleAddress: process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || "0x1234567890123456789012345678901234567890123456789012345678901234",
    moduleName: "casino",
    rouletteModule: "roulette",
    minesModule: "mines",
    wheelModule: "wheel"
  },
  [APTOS_NETWORKS.MAINNET]: {
    moduleAddress: process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || "0x1234567890123456789012345678901234567890123456789012345678901234",
    moduleName: "casino",
    rouletteModule: "roulette",
    minesModule: "mines",
    wheelModule: "wheel"
  },
  [APTOS_NETWORKS.DEVNET]: {
    moduleAddress: process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || "0x1234567890123456789012345678901234567890123456789012345678901234",
    moduleName: "casino",
    rouletteModule: "roulette",
    minesModule: "mines",
    wheelModule: "wheel"
  }
};

// Token Configuration
export const TOKEN_CONFIG = {
  APT: {
    name: "Aptos Coin",
    symbol: "APT",
    decimals: 8,
    type: "0x1::aptos_coin::AptosCoin"
  },
  APTC: {
    name: "APT Casino Token",
    symbol: "APTC",
    decimals: 8,
    type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
  }
};

// Network Information
export const NETWORK_INFO = {
  [APTOS_NETWORKS.TESTNET]: {
    name: "Aptos Testnet",
    chainId: 2,
    nativeCurrency: TOKEN_CONFIG.APT,
    explorer: APTOS_EXPLORER_URLS[APTOS_NETWORKS.TESTNET],
    faucet: APTOS_FAUCET_URLS[APTOS_NETWORKS.TESTNET]
  },
  [APTOS_NETWORKS.MAINNET]: {
    name: "Aptos Mainnet",
    chainId: 1,
    nativeCurrency: TOKEN_CONFIG.APT,
    explorer: APTOS_EXPLORER_URLS[APTOS_NETWORKS.MAINNET]
  },
  [APTOS_NETWORKS.DEVNET]: {
    name: "Aptos Devnet",
    chainId: 0,
    nativeCurrency: TOKEN_CONFIG.APT,
    explorer: APTOS_EXPLORER_URLS[APTOS_NETWORKS.DEVNET],
    faucet: APTOS_FAUCET_URLS[APTOS_NETWORKS.DEVNET]
  }
};

// Export default configuration
export default {
  APTOS_NETWORKS,
  APTOS_NETWORK_URLS,
  APTOS_FAUCET_URLS,
  APTOS_EXPLORER_URLS,
  DEFAULT_NETWORK,
  CASINO_MODULE_CONFIG,
  TOKEN_CONFIG,
  NETWORK_INFO
}; 