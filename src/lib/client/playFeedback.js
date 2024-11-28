import { formatNativeAmount } from '@/lib/chains/registry';

export const INSUFFICIENT_BALANCE_KIND = 'insufficient_balance';

/**
 * Structured payload for PlayBalanceAlert (snackbar / notification).
 */
export function buildInsufficientBalanceAlert({
  balance,
  required,
  symbol,
  chainId = 'solana',
}) {
  const have = formatNativeAmount(balance, chainId);
  const need = formatNativeAmount(required, chainId);
  const shortfall = Math.max(0, Number(required) - Number(balance));
  const more = formatNativeAmount(shortfall, chainId);

  return {
    kind: INSUFFICIENT_BALANCE_KIND,
    have,
    need,
    more: shortfall > 0 ? more : null,
    symbol,
    hint:
      shortfall > 0
        ? 'Use Undo / Clear on the table, or deposit from your wallet menu.'
        : 'Reduce chips on the table or deposit more.',
  };
}

/** @deprecated Use buildInsufficientBalanceAlert + PlayBalanceAlert */
export function formatInsufficientBalanceMessage(opts) {
  const a = buildInsufficientBalanceAlert(opts);
  if (a.more) {
    return `Not enough ${a.symbol} — you have ${a.have} ${a.symbol}, but this bet needs ${a.need} ${a.symbol}. Add at least ${a.more} ${a.symbol} or lower your chips.`;
  }
  return `Not enough ${a.symbol} — you have ${a.have} ${a.symbol}, but this bet needs ${a.need} ${a.symbol}. Lower your chips or deposit more.`;
}

export function isInsufficientBalanceAlert(payload) {
  return payload && typeof payload === 'object' && payload.kind === INSUFFICIENT_BALANCE_KIND;
}
