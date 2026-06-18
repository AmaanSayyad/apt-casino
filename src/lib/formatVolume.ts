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

export type NativeAmountPart = { chain: string; amount: string; symbol: string };

const CHAIN_SORT_ORDER: Record<string, number> = {
  solana: 0,
  aptos: 1,
  sui: 2,
  near: 3,
  starknet: 4,
  stellar: 5,
  tezos: 6,
  evm: 7,
};

function sortChainEntries(entries: [string, number][]): [string, number][] {
  return [...entries].sort(([a], [b]) => (CHAIN_SORT_ORDER[a] ?? 99) - (CHAIN_SORT_ORDER[b] ?? 99));
}

/** Structured amounts for stacked UI (e.g. SOL on one line, APT on the next). */
export function getCombinedNativeParts(
  byChain: Record<string, number> | undefined | null,
): NativeAmountPart[] {
  if (!byChain) return [];
  return sortChainEntries(Object.entries(byChain))
    .filter(([, v]) => Number(v) > 0)
    .map(([chain, v]) => ({
      chain,
      amount: compact(Number(v)),
      symbol: SYMBOL_BY_CHAIN[chain] ?? chain.toUpperCase(),
    }));
}

/** e.g. "7.25 APT + 1.50 SOL" or "0" */
export function formatCombinedNative(byChain: Record<string, number> | undefined | null): string {
  const parts = getCombinedNativeParts(byChain);
  return parts.length ? parts.map((p) => `${p.amount} ${p.symbol}`).join(' + ') : '0';
}

export function formatSingleNative(amount: number, symbol: string): string {
  if (!Number.isFinite(amount) || amount <= 0) return `0 ${symbol}`;
  return `${compact(amount)} ${symbol}`;
}
