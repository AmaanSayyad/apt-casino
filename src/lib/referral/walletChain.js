/** Client-safe chain inference from wallet address (mirrors server referrals.ts). */
export function inferWalletChain(wallet) {
  const t = String(wallet || '').trim();
  if (/^0x[0-9a-f]+$/i.test(t)) return 'aptos';
  if (t.length >= 32 && t.length <= 44) return 'solana';
  return 'aptos';
}

/** Prefer wallet shape over UI active chain when they disagree (fixes Solana referral lookups). */
export function referralChainForWallet(wallet, activeChain) {
  if (!wallet) return activeChain === 'solana' ? 'solana' : 'aptos';
  return inferWalletChain(wallet);
}
