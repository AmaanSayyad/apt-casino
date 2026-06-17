import type { ChainId } from '@/lib/chains/registry';

const APTOS_NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta').toLowerCase();

function solanaClusterQuery(): string {
  return SOLANA_NETWORK === 'devnet'
    ? '?cluster=devnet'
    : SOLANA_NETWORK === 'testnet'
      ? '?cluster=testnet'
      : '';
}

/** Solscan account URL for Solana addresses. */
export function solanaExplorerAddressUrl(address: string | null | undefined): string | null {
  return explorerAddressUrl('solana', address);
}

export function explorerAddressUrl(chain: ChainId | string, address: string | null | undefined): string | null {
  if (!address) return null;
  if (chain === 'solana') {
    return `https://solscan.io/account/${address}${solanaClusterQuery()}`;
  }
  const net = APTOS_NETWORK !== 'mainnet' ? `?network=${APTOS_NETWORK}` : '';
  return `https://explorer.aptoslabs.com/account/${address}${net}`;
}

export function explorerTxUrl(chain: ChainId | string, hash: string | null | undefined): string | null {
  if (!hash) return null;
  if (chain === 'solana') {
    const cluster =
      SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : SOLANA_NETWORK === 'testnet' ? '?cluster=testnet' : '';
    return `https://solscan.io/tx/${hash}${cluster}`;
  }
  const net = APTOS_NETWORK !== 'mainnet' ? `?network=${APTOS_NETWORK}` : '';
  return `https://explorer.aptoslabs.com/txn/${hash}${net}`;
}
