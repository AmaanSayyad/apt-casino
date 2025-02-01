/** Expected Aptos adapter errors — safe to ignore in global onError / UI. */
export function isBenignAptosWalletError(error) {
  const name = error?.name ?? '';
  const message =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : '';
  const text = `${name} ${message}`;
  return (
    /WalletNotConnectedError/i.test(text) ||
    /User rejected/i.test(text) ||
    /User has rejected/i.test(text) ||
    /Not connected/i.test(text)
  );
}

export function formatAptosWalletError(error) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}
