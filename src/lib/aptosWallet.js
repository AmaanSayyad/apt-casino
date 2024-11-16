import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletReadyState } from "@aptos-labs/wallet-adapter-core";

// Import Aptos network configuration
import { APTOS_NETWORKS, DEFAULT_NETWORK } from './aptos';

// Configure wallets - for now we'll use a simplified approach
// In a real implementation, you would import and configure each wallet adapter
const wallets = [
  // These would be actual wallet adapters
  // For now, we'll create a basic structure
];

// Network configuration
const networks = [
  APTOS_NETWORKS.mainnet,
  APTOS_NETWORKS.testnet,
  APTOS_NETWORKS.devnet,
];

// Auto-connect configuration
const autoConnect = true;

// Export the wallet adapter provider configuration
export const AptosWalletProvider = ({ children }) => {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={autoConnect}
      onError={(error) => {
        console.error("Aptos wallet error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};

// Export wallet utilities
export const useAptosWallet = () => {
  const { wallet, connected, disconnect, select, wallets } = useWallet();
  
  return {
    wallet,
    connected,
    disconnect,
    select,
    wallets,
    account: wallet?.account,
    network: wallet?.network,
    signAndSubmitTransaction: wallet?.signAndSubmitTransaction,
    signTransaction: wallet?.signTransaction,
    signMessage: wallet?.signMessage,
  };
};

// Helper function to get wallet by name
export const getWalletByName = (name) => {
  return wallets.find(wallet => wallet.name === name);
};

// Helper function to check if wallet is available
export const isWalletAvailable = (name) => {
  const wallet = getWalletByName(name);
  return wallet && wallet.readyState === WalletReadyState.Installed;
};

// Helper function to get installed wallets
export const getInstalledWallets = () => {
  return wallets.filter(wallet => wallet.readyState === WalletReadyState.Installed);
};

// Helper function to get all available wallets
export const getAvailableWallets = () => {
  return wallets.filter(wallet => wallet.readyState !== WalletReadyState.Unsupported);
};

// Export default configuration
export default {
  wallets,
  networks,
  autoConnect,
  AptosWalletProvider,
  useAptosWallet,
  getWalletByName,
  isWalletAvailable,
  getInstalledWallets,
  getAvailableWallets,
}; 