import {
  transferTokenFromSigner,
  verifySolanaDepositTx,
} from '@/lib/solana/backend-client';
import { getIpoStakingVault } from '@/lib/config/ipo';
import { getIpoServerConfig } from './config';
import { getIpoTreasuryKeypair } from './treasury-keypair';

export { getIpoTreasuryKeypair } from './treasury-keypair';

export async function verifyIpoSolDeposit(
  signature: string,
  userAddress: string,
  expectedSol: number,
): Promise<boolean> {
  const { treasury } = getIpoServerConfig();
  if (!treasury) return false;
  return verifySolanaDepositTx(signature, userAddress, expectedSol, undefined, treasury);
}

/**
 * Send IPO APTC from the distributor into the staking vault (locked allocation).
 * Buyer ownership is recorded in staking_positions — tokens do not go to the buyer wallet until unlock/claim.
 */
export async function sendIpoAptcToStakingVault(
  aptcAmount: number,
  mint: string,
): Promise<{ signature: string; stakingVault: string }> {
  const stakingVault = getIpoStakingVault();
  if (!stakingVault) {
    throw new Error('IPO staking vault is not configured (NEXT_PUBLIC_APTC_STAKING_VAULT).');
  }
  const signature = await transferTokenFromSigner(
    getIpoTreasuryKeypair(),
    stakingVault,
    aptcAmount,
    mint,
  );
  return { signature, stakingVault };
}

/** @deprecated Use sendIpoAptcToStakingVault — IPO APTC must not go to the buyer wallet. */
export async function sendAptcToBuyer(
  _buyerWallet: string,
  aptcAmount: number,
  mint: string,
): Promise<string> {
  const { signature } = await sendIpoAptcToStakingVault(aptcAmount, mint);
  return signature;
}
