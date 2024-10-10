#!/usr/bin/env node
/**
 * Call apt_casino::initialize on-chain (idempotent check via config PDA).
 *
 * Requires NEXT_PUBLIC_APT_CASINO_PROGRAM_ID and SOL_TREASURY_SECRET_KEY in .env
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import bs58 from 'bs58';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

const PROGRAM_ID = process.env.NEXT_PUBLIC_APT_CASINO_PROGRAM_ID?.trim();
const RPC =
  process.env.SOLANA_RPC_URL?.trim() ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
  'https://api.devnet.solana.com';

const CONFIG_SEED = Buffer.from('config');
const VAULT_SEED = Buffer.from('vault');

const idlPath = path.join(repoRoot, 'src', 'lib', 'solana', 'idl', 'apt_casino.json');

function loadAdminKeypair() {
  const raw = process.env.SOL_TREASURY_SECRET_KEY?.trim();
  if (!raw) throw new Error('Missing SOL_TREASURY_SECRET_KEY in .env');
  if (raw.startsWith('[')) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  }
  return Keypair.fromSecretKey(bs58.decode(raw));
}

function findPda(programId, seeds) {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

function initializeDiscriminator() {
  if (fs.existsSync(idlPath)) {
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    const ix = idl.instructions?.find((i) => i.name === 'initialize');
    if (ix?.discriminator) return Buffer.from(ix.discriminator);
  }
  // Anchor sighash global:initialize
  return Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
}

async function main() {
  if (!PROGRAM_ID) {
    console.error('Set NEXT_PUBLIC_APT_CASINO_PROGRAM_ID in .env (run deploy:solana first).');
    process.exit(1);
  }

  const programId = new PublicKey(PROGRAM_ID);
  const admin = loadAdminKeypair();
  const connection = new Connection(RPC, 'confirmed');

  const [config] = findPda(programId, [CONFIG_SEED]);
  const [vault] = findPda(programId, [VAULT_SEED]);

  const existing = await connection.getAccountInfo(config);
  if (existing) {
    console.log('CasinoConfig already exists:', config.toBase58());
    console.log('Vault PDA:', vault.toBase58());
    return;
  }

  const ix = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      { pubkey: config, isSigner: false, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: initializeDiscriminator(),
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = admin.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(admin);

  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, 'confirmed');

  console.log('initialize tx:', sig);
  console.log('Config PDA:', config.toBase58());
  console.log('Vault PDA:', vault.toBase58());
  console.log('Admin:', admin.publicKey.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
