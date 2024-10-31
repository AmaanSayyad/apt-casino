import { fairnessVerifyPath } from '@/lib/provablyFair/solanaFairness';

/** Link shown in game history for proof / tx hash. */
export function gameHistoryProofHref({ chain, txHash, explorerUrl }) {
  if (explorerUrl) return explorerUrl;
  if (chain === 'solana' && txHash) return fairnessVerifyPath(txHash);
  if (chain === 'aptos' && txHash) {
    return `https://explorer.aptoslabs.com/txn/${txHash}?network=mainnet`;
  }
  return null;
}

export function gameHistoryProofLabel(chain) {
  return chain === 'solana' ? 'Verify VRF record' : 'View on explorer';
}
