/**
 * @deprecated Import from @/lib/chains/registry instead.
 * Re-exports for backward compatibility.
 */
import {
  PLAY_CHAINS,
  DEFAULT_PLAY_CHAIN,
  rawToDisplay,
  displayToRaw,
  getChainSymbol,
  getChainUnits,
} from '@/lib/chains/registry';

export const CHAIN_UNITS = Object.fromEntries(PLAY_CHAINS.map((c) => [c.id, c.units]));
export const CHAIN_NATIVE_SYMBOL = Object.fromEntries(
  PLAY_CHAINS.map((c) => [c.id, c.nativeSymbol]),
);

export { DEFAULT_PLAY_CHAIN, rawToDisplay, displayToRaw, getChainSymbol, getChainUnits };
