'use client';

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { getSolanaRpcEndpoint, getSolanaTreasuryAddress } from './config';

let connection: Connection | null = null;

export function getSolanaConnection(): Connection {
  const rpc = getSolanaRpcEndpoint();
  if (!connection) {
    connection = new Connection(rpc, 'confirmed');
  }
  return connection;
}

async function latestBlockhash(): Promise<string> {
  const rpcs = [
    getSolanaRpcEndpoint(),
    'https://solana-rpc.publicnode.com',
    'https://rpc.ankr.com/solana',
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  for (const rpc of rpcs) {
    try {
      const conn = new Connection(rpc, 'confirmed');
      const { blockhash } = await conn.getLatestBlockhash();
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
  return new Error(error instanceof Error ? error.message : 'Solana transaction failed.');
}
