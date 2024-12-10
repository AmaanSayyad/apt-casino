import { displayToRaw, rawToDisplay } from '@/lib/chainUnits';

/** @deprecated Prefer usePlayBalance() in components. */
export function balanceFromRedux(userBalance, chain = 'aptos') {
  return rawToDisplay(userBalance, chain);
}

export function amountToRedux(amountNative, chain = 'aptos') {
  return displayToRaw(amountNative, chain);
}
