import { ChainId, getPlayChainConfig } from '@/lib/chains/registry';

export function nativeToRaw(chainId: ChainId, amountNative: number): bigint {
  const units = getPlayChainConfig(chainId)?.units ?? 1;
  return BigInt(Math.floor(amountNative * units));
}

export function rawToNative(chainId: ChainId, raw: bigint | number): number {
  const units = getPlayChainConfig(chainId)?.units ?? 1;
  return Number(raw) / units;
}
