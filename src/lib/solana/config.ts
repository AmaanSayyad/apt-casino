import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export function getSolanaTreasuryAddress(): string {
  return (
    process.env.NEXT_PUBLIC_SOL_TREASURY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_OTC_LOTTERY_SOL_WALLET?.trim() ||
    ''
  );
}

export function getSolanaRpcEndpoint(): string {
  const envRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim()?.replace(/\/+$/, '') || '';
  const isFlaky =
    envRpc === 'https://api.mainnet-beta.solana.com' ||
    envRpc === 'http://api.mainnet-beta.solana.com';
  if (envRpc && !isFlaky) return envRpc;
  return (
    process.env.SOLANA_RPC_URL?.trim() ||
    'https://solana-rpc.publicnode.com'
  );
}

/** JSON-RPC endpoint safe for browser wallet adapters (same-origin proxy). */
export function getBrowserSolanaRpcEndpoint(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/solana/rpc`;
  }
  return getSolanaRpcEndpoint();
}

export function getSolanaNetwork(): WalletAdapterNetwork {
  const n = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
  if (n === 'devnet') return WalletAdapterNetwork.Devnet;
  if (n === 'testnet') return WalletAdapterNetwork.Testnet;
  return WalletAdapterNetwork.Mainnet;
}

export function getAptcMintAddress(): string | null {
  const m = process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim();
  return m && !m.includes('<') ? m : null;
}

/** Server + client treasury/RPC bundle (Bynomo-compatible shape). */
export function getSolanaConfig() {
  return {
    network: getSolanaNetwork(),
    rpcEndpoint: getSolanaRpcEndpoint(),
    treasuryAddress: getSolanaTreasuryAddress(),
  };
}

export function getSolanaStakingVaultConfig() {
  const address =
    process.env.NEXT_PUBLIC_APTC_STAKING_VAULT?.trim() ||
    process.env.NEXT_PUBLIC_IPO_STAKING_VAULT?.trim() ||
    '2ei9VY2TtJ6GkvVMs1su5b348p98ajLaU45MzvE6gYaq';
  return { address };
}

/** Receives APTC entry fees (Volume Cup) and other platform fee SPL transfers on Solana. */
export function getSolanaPlatformFeeWallet(): string {
  return process.env.NEXT_PUBLIC_PLATFORM_FEE_WALLET_SOL?.trim() || '';
}

export { getAptCasinoProgramId } from './program';
