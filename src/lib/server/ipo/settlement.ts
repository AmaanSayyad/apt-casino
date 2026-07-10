import {
  transferTokenFromSigner,
  verifySolanaDepositTx,
} from '@/lib/solana/backend-client';
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

/** Send APTC from the IPO distributor wallet (never from the SOL collector). */
export async function sendAptcToBuyer(
  buyerWallet: string,
  aptcAmount: number,
  mint: string,
): Promise<string> {
  return transferTokenFromSigner(getIpoTreasuryKeypair(), buyerWallet, aptcAmount, mint);
}
