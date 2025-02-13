'use client';

import { usePlayBalance } from '@/hooks/usePlayBalance';
import { CHAIN_UI } from '@/lib/chains/chainUi';

/** Active play chain currency for labels, bet inputs, and balance display. */
export function usePlayCurrency() {
  const play = usePlayBalance();
  const chainUi = CHAIN_UI[play.chain];
  return {
    chain: play.chain,
    chainLabel: play.chainLabel,
    symbol: play.symbol,
    chainLogo: chainUi?.logo ?? CHAIN_UI.solana.logo,
    balanceNative: play.balanceNative,
    balanceRaw: play.balanceRaw,
    unit: play.unit,
    demoMode: play.demoMode,
    debitNative: play.debitNative,
    creditNative: play.creditNative,
    toRaw: play.toRaw,
    fromRaw: play.fromRaw,
  };
}
