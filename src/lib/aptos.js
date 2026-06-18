import { Aptos, AptosConfig, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import {
  WalletCore,
  NetworkInfo,
  WalletInfo,
  WalletReadyState,
  WalletAdapter
} from "@aptos-labs/wallet-adapter-core";

// Aptos network configurations
export const APTOS_NETWORKS = {
  mainnet: {
    name: "Aptos Mainnet",
    chainId: 1,
    url: "https://fullnode.mainnet.aptoslabs.com",
    faucetUrl: null
  },
  testnet: {
    name: "Aptos Testnet",
    chainId: 2,
    url: "https://fullnode.testnet.aptoslabs.com",
    faucetUrl: "https://faucet.testnet.aptoslabs.com"
  },
  devnet: {
    name: "Aptos Devnet",
    chainId: 0,
    url: "https://fullnode.devnet.aptoslabs.com",
    faucetUrl: "https://faucet.devnet.aptoslabs.com"
  }
};

// Default network (can be changed via environment variable)
export const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet';

// Aptos client instance (ts-sdk v3+)
const NETWORK_ENUM_MAP = {
  mainnet: NetworkToNetworkName.MAINNET,
  testnet: NetworkToNetworkName.TESTNET,
  devnet: NetworkToNetworkName.DEVNET,
};

const aptosConfig = new AptosConfig({
  network: NETWORK_ENUM_MAP[DEFAULT_NETWORK] || NetworkToNetworkName.MAINNET,
});

export const aptosClient = new Aptos(aptosConfig);

// Module addresses for our casino contracts
export const CASINO_MODULE_ADDRESS = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS ||
  "0xcad18bc68f2f890a21fdfbec9e6c7c72985a223e95a19d667881ea9fceba3f4b";

// Treasury receive address (can be same as module or a separate EOA)
export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || CASINO_MODULE_ADDRESS;

// Token module address (APT token)
export const APT_TOKEN_MODULE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";

// Casino game module names
export const CASINO_MODULES = {
  roulette: `${CASINO_MODULE_ADDRESS}::roulette`,
  mines: `${CASINO_MODULE_ADDRESS}::mines`,
  wheel: `${CASINO_MODULE_ADDRESS}::wheel`
};

// Helper function to get account balance
export async function getAccountBalance(address) {
  try {
    const resources = await aptosClient.getAccountResources({ accountAddress: address });
    const aptCoinResource = resources.find(r => r.type === APT_TOKEN_MODULE);

    if (aptCoinResource) {
      return aptCoinResource.data.coin.value;
    }
    return "0";
  } catch (error) {
    console.error("Error getting account balance:", error);
    return "0";
  }
}

// Helper function to format APT amount
export function formatAptAmount(amount) {
  return (parseInt(amount) / 100000000).toFixed(8);
}

// Helper function to parse APT amount
export function parseAptAmount(amount) {
  return Math.floor(parseFloat(amount) * 100000000).toString();
}

// Helper function to check if wallet is connected
export function isWalletConnected(wallet) {
  return wallet && wallet.connected;
}

// Helper function to get connected account
export function getConnectedAccount(wallet) {
  if (!isWalletConnected(wallet)) {
    return null;
  }
  return wallet.account;
}

// Helper function to sign and submit transaction
export async function signAndSubmitTransaction(wallet, payload) {
  if (!isWalletConnected(wallet)) {
    throw new Error("Wallet not connected");
  }

  try {
    // Wrap payload in an object with a 'payload' property if it's a direct payload
    // and doesn't already have one. Most wallet adapters expect this shape.
    const transaction = (payload && !payload.payload && !payload.data)
      ? { payload }
      : payload;

    const response = await wallet.signAndSubmitTransaction(transaction);
    return response;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

// Helper function to wait for transaction
export async function waitForTransaction(hash) {
  try {
    const transaction = await aptosClient.waitForTransaction({ transactionHash: hash });
    return transaction;
  } catch (error) {
    console.error("Error waiting for transaction:", error);
    throw error;
  }
}

// Create a transaction payload for an entry function (new SDK format)
export const createEntryFunctionPayload = (moduleAddress, moduleName, functionName, typeArgs, args) => {
  console.log("createEntryFunctionPayload called with:", { moduleAddress, moduleName, functionName, typeArgs, args });

  const payload = {
    data: {
      function: `${moduleAddress}::${moduleName}::${functionName}`,
      typeArguments: typeArgs || [],
      functionArguments: args || [],
    },
  };

  console.log("createEntryFunctionPayload returning:", payload);
  return payload;
};

// Helper function to create coin transfer payload
export function createCoinTransferPayload(to, amount) {
  return {
    function: "0x1::coin::transfer",
    type_arguments: ["0x1::aptos_coin::AptosCoin"],
    arguments: [to, amount]
  };
}

// Helper function to get random number from blockchain
export async function getRandomNumber(seed) {
  // This would typically call a randomness oracle or VRF
  // For now, we'll use a simple hash-based approach
  const timestamp = Date.now();
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  return {
    randomNumber: Array.from(randomBytes).reduce((acc, byte) => acc + byte, 0),
    timestamp
  };
}

// Casino game helper functions
export const CasinoGames = {
  // Roulette game functions
  roulette: {
    deposit: (amountOctas, houseAddr) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "roulette",
        "deposit",
        [],
        [amountOctas, houseAddr]
      );
    },
    userPlaceBet: (amountOctas, betKind, betValue) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "roulette",
        "user_place_bet",
        [],
        [amountOctas, betKind, betValue]
      );
    },
    userPlaceBetsMultiple: (amounts, kinds, values) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "roulette",
        "user_place_bets_multiple",
        [],
        [amounts, kinds, values]
      );
    },
    housePlaceBet: (player, amount, betKind, betValue) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "roulette",
        "house_place_bet",
        [],
        [player, amount, betKind, betValue]
      );
    },
    requestWithdraw: (amount) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "roulette",
        "request_withdraw",
        [],
        [amount]
      );
    },

    getGameState: async () => {
      try {
        const resource = await aptosClient.getAccountResource({
          accountAddress: CASINO_MODULE_ADDRESS,
          resourceType: `${CASINO_MODULE_ADDRESS}::roulette::GameState`
        });
        return resource.data;
      } catch (error) {
        console.error("Error getting roulette game state:", error);
        return null;
      }
    }
  },

  // Mines game functions  
  mines: {
    deposit: (amountOctas) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "mines",
        "deposit",
        [],
        [amountOctas, CASINO_MODULE_ADDRESS]
      );
    },

    userPlay: (amountOctas, pick) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "mines",
        "user_play",
        [],
        [amountOctas, pick]
      );
    },

    getGameState: async () => {
      try {
        const resource = await aptosClient.getAccountResource({
          accountAddress: CASINO_MODULE_ADDRESS,
          resourceType: `${CASINO_MODULE_ADDRESS}::mines::GameState`
        });
        return resource.data;
      } catch (error) {
        console.error("Error getting mines game state:", error);
        return null;
      }
    }
  },

  // Wheel game functions
  wheel: {
    userSpin: (amountOctas, sectors) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "wheel",
        "user_spin",
        [],
        [amountOctas, sectors]
      );
    },
    deposit: (amountOctas) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "wheel",
        "deposit",
        [],
        [amountOctas, CASINO_MODULE_ADDRESS]
      );
    },

    getGameState: async () => {
      try {
        const resource = await aptosClient.getAccountResource({
          accountAddress: CASINO_MODULE_ADDRESS,
          resourceType: `${CASINO_MODULE_ADDRESS}::wheel::GameState`
        });
        return resource.data;
      } catch (error) {
        console.error("Error getting wheel game state:", error);
        return null;
      }
    }
  },

  // Roulette game functions
  roulette: {
    userPlaceBet: (amountOctas, betKind, betValue) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "roulette",
        "user_place_bet",
        [],
        [amountOctas, betKind, betValue]
      );
    },
    deposit: (amountOctas) => {
      return createEntryFunctionPayload(
        CASINO_MODULE_ADDRESS,
        "wheel",
        "deposit",
        [],
        [amountOctas, CASINO_MODULE_ADDRESS]
      );
    },

    getGameState: async () => {
      try {
        const resource = await aptosClient.getAccountResource({
          accountAddress: CASINO_MODULE_ADDRESS,
          resourceType: `${CASINO_MODULE_ADDRESS}::roulette::GameState`
        });
        return resource.data;
      } catch (error) {
        console.error("Error getting roulette game state:", error);
        return null;
      }
    }
  }
};

// User balance management system
export const UserBalanceSystem = {
  // Deposit APT to house account
  deposit: (amountOctas) => {
    return createEntryFunctionPayload(
      CASINO_MODULE_ADDRESS,
      "user_balance",
      "deposit",
      [],
      [amountOctas]
    );
  },

  // Withdraw APT from house account
  withdraw: (amountOctas) => {
    return createEntryFunctionPayload(
      CASINO_MODULE_ADDRESS,
      "user_balance",
      "withdraw",
      [],
      [amountOctas]
    );
  },

  // Get user balance
  getBalance: async (userAddress) => {
    try {
      const resource = await aptosClient.getAccountResource({
        accountAddress: userAddress,
        resourceType: `${CASINO_MODULE_ADDRESS}::user_balance::UserBalance`,
      });
      return resource.data.balance;
    } catch (error) {
      if (error.message.includes("Resource not found")) {
        return "0";
      }
      console.error("Error getting user balance:", error);
      return "0";
    }
  },

  // Check if user has sufficient balance
  hasSufficientBalance: async (userAddress, requiredAmount) => {
    const balance = await UserBalanceSystem.getBalance(userAddress);
    return parseInt(balance) >= parseInt(requiredAmount);
  }
};

// Export default configuration
export default {
  aptosClient,
  APTOS_NETWORKS,
  DEFAULT_NETWORK,
  CASINO_MODULE_ADDRESS,
  CASINO_MODULES,
  CasinoGames,
  UserBalanceSystem
}; 