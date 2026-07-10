'use client';

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getSolanaRpcEndpoint,
  getSolanaTreasuryAddress,
  getAptcMintAddress,
  getSolanaStakingVaultConfig,
  getSolanaPlatformFeeWallet,
  getBrowserSolanaRpcEndpoint,
} from './config';

let connection: Connection | null = null;

export function getSolanaConnection(): Connection {
  const rpc =
    typeof window !== 'undefined' ? getBrowserSolanaRpcEndpoint() : getSolanaRpcEndpoint();
  if (!connection || connection.rpcEndpoint !== rpc) {
    connection = new Connection(rpc, 'confirmed');
  }
  return connection;
}

async function latestBlockhash(connection?: Connection): Promise<string> {
  const conn = connection ?? getSolanaConnection();
  try {
    const { blockhash } = await conn.getLatestBlockhash('confirmed');
    return blockhash;
  } catch {
    /* fall through to multi-RPC retry */
  }

  const rpcs = [
    typeof window !== 'undefined' ? getBrowserSolanaRpcEndpoint() : getSolanaRpcEndpoint(),
    getSolanaRpcEndpoint(),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  for (const rpc of rpcs) {
    try {
      const connTry = new Connection(rpc, 'confirmed');
      const { blockhash } = await connTry.getLatestBlockhash('confirmed');
      return blockhash;
    } catch {
      /* try next */
    }
  }
  throw new Error('Could not fetch Solana blockhash. Try again.');
}

export async function buildSolTransferTransaction(
  amountSol: number,
  userAddress: string,
  treasuryAddress: string,
): Promise<Transaction> {
  if (!treasuryAddress) throw new Error('Treasury address is not configured.');
  const userPk = new PublicKey(userAddress);
  const treasuryPk = new PublicKey(treasuryAddress);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: userPk,
      toPubkey: treasuryPk,
      lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
    }),
  );
  tx.recentBlockhash = await latestBlockhash();
  tx.feePayer = userPk;
  return tx;
}

export async function buildSolDepositTransaction(
  amountSol: number,
  userAddress: string,
): Promise<Transaction> {
  const treasury = getSolanaTreasuryAddress();
  if (!treasury) throw new Error('Solana lottery escrow / treasury is not configured.');
  return buildSolTransferTransaction(amountSol, userAddress, treasury);
}

/** SOL transfer to IPO presale treasury (fixed-price swap rail). */
export async function buildIpoSolPurchaseTransaction(
  amountSol: number,
  userAddress: string,
  treasuryAddress?: string,
): Promise<Transaction> {
  const treasury =
    treasuryAddress?.trim() ||
    process.env.NEXT_PUBLIC_IPO_SOL_TREASURY?.trim() ||
    '';
  if (!treasury) throw new Error('IPO SOL treasury is not configured.');
  return buildSolTransferTransaction(amountSol, userAddress, treasury);
}

/**
 * Build SPL transfer of APTC from user wallet to a recipient (staking vault, fee wallet, etc.).
 * Creates the recipient ATA in the same transaction when missing (user pays rent).
 */
export async function buildAptcTransferTransaction(
  amountAptc: number,
  userAddress: string,
  recipientAddress: string,
  connectionOverride?: Connection,
): Promise<Transaction> {
  const mintStr = getAptcMintAddress();
  if (!mintStr) throw new Error('APTC mint is not configured.');
  const recipient = recipientAddress?.trim();
  if (!recipient) throw new Error('Recipient wallet is not configured.');
  if (userAddress.trim() === recipient) {
    throw new Error('Use a personal wallet — not the recipient wallet.');
  }

  const {
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getMint,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
  } = await import('@solana/spl-token');

  const connection = connectionOverride ?? getSolanaConnection();
  const userPk = new PublicKey(userAddress);
  const recipientPk = new PublicKey(recipient);
  const mintPk = new PublicKey(mintStr);

  let tokenProgramId = TOKEN_PROGRAM_ID;
  let decimals = 9;
  try {
    const mintInfo = await getMint(connection, mintPk, 'confirmed', TOKEN_PROGRAM_ID);
    decimals = mintInfo.decimals;
  } catch {
    const mintInfo = await getMint(connection, mintPk, 'confirmed', TOKEN_2022_PROGRAM_ID);
    tokenProgramId = TOKEN_2022_PROGRAM_ID;
    decimals = mintInfo.decimals;
  }

  const rawAmount = BigInt(Math.floor(amountAptc * 10 ** decimals));
  if (rawAmount <= BigInt(0)) throw new Error('Invalid stake amount.');

  const fromAta = getAssociatedTokenAddressSync(mintPk, userPk, false, tokenProgramId);
  const toAta = getAssociatedTokenAddressSync(mintPk, recipientPk, false, tokenProgramId);

  const tx = new Transaction();

  const toAtaInfo = await connection.getAccountInfo(toAta);
  if (!toAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(userPk, toAta, recipientPk, mintPk, tokenProgramId),
    );
  }

  tx.add(createTransferInstruction(fromAta, toAta, userPk, rawAmount, [], tokenProgramId));

  tx.recentBlockhash = await latestBlockhash(connection);
  tx.feePayer = userPk;
  return tx;
}

/** Build SPL transfer of APTC from user wallet to the configured staking vault. */
export async function buildAptcStakeTransaction(
  amountAptc: number,
  userAddress: string,
  vaultAddress?: string,
  connectionOverride?: Connection,
): Promise<Transaction> {
  const vault = vaultAddress?.trim() || getSolanaStakingVaultConfig().address;
  if (!vault) throw new Error('Staking vault address is not configured.');
  return buildAptcTransferTransaction(amountAptc, userAddress, vault, connectionOverride);
}

/** Build SPL transfer of APTC entry fee to the platform fee wallet (Volume Cup). */
export async function buildAptcEntryFeeTransaction(
  amountAptc: number,
  userAddress: string,
  connectionOverride?: Connection,
): Promise<Transaction> {
  const feeWallet = getSolanaPlatformFeeWallet();
  if (!feeWallet) throw new Error('Platform fee wallet is not configured.');
  return buildAptcTransferTransaction(amountAptc, userAddress, feeWallet, connectionOverride);
}

export async function waitForSolanaSignatureConfirmed(
  connection: Connection,
  signature: string,
  maxMs = 90_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const { value } = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const v = value[0];
    if (v?.err) throw new Error(`Transaction failed: ${JSON.stringify(v.err)}`);
    const cs = v?.confirmationStatus;
    if (cs === 'confirmed' || cs === 'finalized') return;
    await new Promise((r) => setTimeout(r, 450));
  }
  throw new Error('Timed out waiting for Solana confirmation');
}

export function formatSolanaError(error: unknown): string {
  return handleSolanaTxError(error).message;
}

export function handleSolanaTxError(error: unknown): Error {
  const msg =
    error && typeof error === 'object' && 'message' in error
      ? String((error as Error).message).toLowerCase()
      : '';
  if (msg.includes('reject') || msg.includes('denied') || msg.includes('cancel')) {
    return new Error('Transaction cancelled.');
  }
  if (msg.includes('insufficient')) {
    return new Error('Insufficient SOL balance.');
  }
  if (msg.includes('token account') || msg.includes('0x1')) {
    return new Error('Insufficient APTC balance or token account missing.');
  }
  return new Error(error instanceof Error ? error.message : 'Solana transaction failed.');
}
