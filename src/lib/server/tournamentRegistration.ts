import { verifySolanaStakeToVaultTx, APTC_SPL_MINT } from '@/lib/solana/backend-client';
import { getSolanaPlatformFeeWallet } from '@/lib/solana/config';

export function getTournamentEntryFeeWallet(): string {
  return getSolanaPlatformFeeWallet();
}

export function isAptcTournamentReady(): boolean {
  return Boolean(APTC_SPL_MINT && getTournamentEntryFeeWallet());
}

async function verifyEntryFeeWithRetries(
  txHash: string,
  userAddress: string,
  amountAptc: number,
): Promise<boolean> {
  const feeWallet = getTournamentEntryFeeWallet();
  if (!feeWallet || !APTC_SPL_MINT) return false;

  const attempts = 10;
  for (let i = 0; i < attempts; i++) {
    const ok = await verifySolanaStakeToVaultTx(txHash, userAddress, amountAptc, feeWallet);
    if (ok) return true;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export async function verifyTournamentEntryFeeTx(
  txHash: string,
  userAddress: string,
  expectedAmountAptc: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!APTC_SPL_MINT) {
    return { ok: false, error: 'APTC is not configured on the server.' };
  }
  if (!getTournamentEntryFeeWallet()) {
    return { ok: false, error: 'Platform fee wallet is not configured.' };
  }
  if (!txHash?.trim()) {
    return { ok: false, error: 'txHash is required for paid registration.' };
  }

  const verified = await verifyEntryFeeWithRetries(txHash.trim(), userAddress.trim(), expectedAmountAptc);
  if (!verified) {
    return {
      ok: false,
      error:
        'Could not verify APTC transfer to the platform fee wallet. Wait a few seconds and try again, or check the transaction on Solscan.',
    };
  }
  return { ok: true };
}
