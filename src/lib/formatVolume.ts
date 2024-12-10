import { PLAY_CHAINS } from '@/lib/chains/registry';

function compact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(4);
}

const SYMBOL_BY_CHAIN = Object.fromEntries(PLAY_CHAINS.map((c) => [c.id, c.nativeSymbol]));

/** e.g. "7.25 APT + 1.50 SOL" or "0" */
export function formatCombinedNative(byChain: Record<string, number> | undefined | null): string {
  if (!byChain) return '0';
  const parts = Object.entries(byChain)
    .filter(([, v]) => Number(v) > 0)
    .sort(([a], [b]) => {
      const order = {
        solana: 0,
        aptos: 1,
        sui: 2,
        near: 3,
        starknet: 4,
        stellar: 5,
        tezos: 6,
        evm: 7,
      };
      return (order[a] ?? 99) - (order[b] ?? 99);
    })
    .map(([chain, v]) => `${compact(Number(v))} ${SYMBOL_BY_CHAIN[chain] ?? chain.toUpperCase()}`);

  return parts.length ? parts.join(' + ') : '0';
}

export function formatSingleNative(amount: number, symbol: string): string {
  if (!Number.isFinite(amount) || amount <= 0) return `0 ${symbol}`;
  return `${compact(amount)} ${symbol}`;
}
