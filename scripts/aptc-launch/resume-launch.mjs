#!/usr/bin/env node
/**
 * Resume APTC launch: finish wallet distribution + revoke mint/update authorities.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  setAuthority,
  AuthorityType,
  getAccount,
} from '@solana/spl-token';
import {
  createUpdateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  APTC_LAUNCH,
  APTC_WALLET_DISTRIBUTION,
  amountForWallet,
} from './config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MINT = new PublicKey(process.env.APTC_MINT || 'ApTCoJG15om8W9gRpJJbdmG9JDBdF5ZJmiCf9F1RBRg');

function loadKeypair(path) {
  const secret = JSON.parse(readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function loadEnv() {
  const envPath = resolve(__dirname, '../../.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function metadataPda(mint) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

async function tokenBalance(connection, owner, mint) {
  const res = await connection.getParsedTokenAccountsByOwner(owner, { mint });
  return res.value.reduce(
    (s, a) => s + Number(a.account.data.parsed.info.tokenAmount.uiAmount || 0),
    0,
  );
}

async function waitForSignature(connection, sig, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await connection.getSignatureStatus(sig);
    const value = status?.value;
    if (value?.err) throw new Error(`Transaction failed: ${JSON.stringify(value.err)}`);
    if (value?.confirmationStatus === 'confirmed' || value?.confirmationStatus === 'finalized') {
      return;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  const status = await connection.getSignatureStatus(sig);
  if (status?.value?.err) throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
  if (status?.value?.confirmationStatus) return;
  throw new Error(`Signature ${sig} not confirmed within ${timeoutMs}ms`);
}

async function transferWithRetry(connection, payer, source, destOwner, amount, label) {
  const destAta = await getOrCreateAssociatedTokenAccount(connection, payer, MINT, destOwner);
  const sig = await transfer(connection, payer, source, destAta.address, payer, amount, [], {
    skipPreflight: false,
    maxRetries: 3,
  });
  try {
    await waitForSignature(connection, sig);
  } catch (e) {
    const bal = await tokenBalance(connection, destOwner, MINT);
    const expected = Number(amount) / 1e6;
    if (bal >= expected) {
      console.log(`   ✓ ${label}: ${expected.toLocaleString()} APTC (confirmed on-chain despite timeout)`);
      return;
    }
    throw e;
  }
  console.log(`   ✓ ${label}: ${(Number(amount) / 1e6).toLocaleString()} APTC (${sig})`);
}

async function main() {
  loadEnv();
  const rpc =
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    'https://solana-rpc.publicnode.com';
  const payerPath =
    process.env.APTC_LAUNCH_KEYPAIR || resolve(__dirname, '.keys/payer.json');

  const connection = new Connection(rpc, { commitment: 'confirmed', confirmTransactionInitialTimeout: 120_000 });
  const payer = loadKeypair(payerPath);
  const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, MINT, payer.publicKey);

  console.log('\n=== APTC launch resume ===');
  console.log('Mint:', MINT.toBase58());
  console.log('Payer:', payer.publicKey.toBase58());
  console.log('RPC:', rpc);

  console.log('\nCurrent balances:');
  for (const w of APTC_WALLET_DISTRIBUTION) {
    const bal = await tokenBalance(connection, new PublicKey(w.address), MINT);
    const expected = (APTC_LAUNCH.supplyHuman * w.pct) / 100;
    const ok = bal >= expected ? '✓' : '…';
    console.log(`  ${ok} ${w.label}: ${bal.toLocaleString()} / ${expected.toLocaleString()}`);
  }

  console.log('\n1/2 Distributing missing allocations...');
  for (const w of APTC_WALLET_DISTRIBUTION) {
    const owner = new PublicKey(w.address);
    const expected = amountForWallet(w.pct);
    const balRaw = (await getAccount(connection, (await getOrCreateAssociatedTokenAccount(connection, payer, MINT, owner)).address)).amount;
    const need = expected - balRaw;
    if (need <= 0n) continue;
    await transferWithRetry(connection, payer, payerAta.address, owner, need, w.label);
  }

  const payerBal = await getAccount(connection, payerAta.address);
  const liquidityExpected = amountForWallet(12);
  console.log(
    `\n   Payer ATA: ${(Number(payerBal.amount) / 1e6).toLocaleString()} APTC (target ${(Number(liquidityExpected) / 1e6).toLocaleString()})`,
  );

  console.log('\n2/2 Revoking authorities...');
  const mintInfo = await connection.getParsedAccountInfo(MINT);
  const mintAuthority = mintInfo.value?.data?.parsed?.info?.mintAuthority;
  if (mintAuthority) {
    await setAuthority(connection, payer, MINT, payer, AuthorityType.MintTokens, null);
    console.log('   ✓ Mint authority revoked');
  } else {
    console.log('   · Mint authority already null');
  }

  const metadata = metadataPda(MINT);
  const metaAccount = await connection.getAccountInfo(metadata);
  if (metaAccount && APTC_LAUNCH.revokeUpdate) {
    const updateIx = createUpdateMetadataAccountV2Instruction(
      { metadata, updateAuthority: payer.publicKey },
      {
        updateMetadataAccountArgsV2: {
          data: null,
          updateAuthority: PublicKey.default,
          primarySaleHappened: null,
          isMutable: false,
        },
      },
    );
    const updateTx = new Transaction().add(updateIx);
    await sendAndConfirmTransaction(connection, updateTx, [payer], {
      commitment: 'confirmed',
      maxRetries: 5,
    });
    console.log('   ✓ Update authority revoked · metadata immutable');
  }

  console.log('\n=== RESUME COMPLETE ===');
  console.log(`NEXT_PUBLIC_APTC_SOLANA_MINT=${MINT.toBase58()}`);
  console.log('NEXT_PUBLIC_APTC_STAKING_VAULT=4Ka1vdinFUqhh3TtHaohj1MiKVUrvJBrgsVp1MfVnXFQ');
}

main().catch((e) => {
  console.error('\nResume failed:', e.message || e);
  process.exit(1);
});
