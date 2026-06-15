#!/usr/bin/env node
/**
 * APTC SPL token launch on Solana mainnet.
 * Requires: APTC_LAUNCH_KEYPAIR, APTC_MINT_KEYPAIR (vanity grind), SOLANA_RPC_URL
 * @see scripts/aptc-launch/README.md
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  setAuthority,
  AuthorityType,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  APTC_LAUNCH,
  APTC_WALLET_DISTRIBUTION,
  amountForWallet,
  validateDistribution,
} from './config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

function loadKeypair(path) {
  if (!path || !existsSync(path)) {
    throw new Error(`Keypair not found: ${path}`);
  }
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

async function main() {
  loadEnv();
  validateDistribution();

  const rpc =
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com';
  const network = process.env.SOLANA_NETWORK || 'mainnet-beta';
  const payerPath = process.env.APTC_LAUNCH_KEYPAIR;
  const mintPath = process.env.APTC_MINT_KEYPAIR;

  console.log('\n=== APTC token launch ===');
  console.log('Network:', network);
  console.log('RPC:', rpc.replace(/api-key=[^&]+/, 'api-key=***'));
  console.log('Dry run:', DRY_RUN);
  console.log('Token:', APTC_LAUNCH.name, `(${APTC_LAUNCH.symbol})`);
  console.log('Supply:', APTC_LAUNCH.supplyHuman.toLocaleString(), '· decimals', APTC_LAUNCH.decimals);
  console.log('Metadata URI:', APTC_LAUNCH.uri);
  console.log('Revoke mint:', APTC_LAUNCH.revokeMint, '| freeze:', APTC_LAUNCH.revokeFreeze, '| update:', APTC_LAUNCH.revokeUpdate);

  if (!payerPath) {
    console.error('\nMissing APTC_LAUNCH_KEYPAIR — path to payer JSON keypair (pays SOL fees).');
    process.exit(1);
  }
  if (!mintPath) {
    console.error('\nMissing APTC_MINT_KEYPAIR — grind vanity mint first:');
    console.error(`  solana-keygen grind --starts-with ${APTC_LAUNCH.vanityPrefix}:1`);
    process.exit(1);
  }

  const payer = loadKeypair(payerPath);
  const mintKeypair = loadKeypair(mintPath);
  const mintPubkey = mintKeypair.publicKey;

  console.log('\nPayer:', payer.publicKey.toBase58());
  console.log('Mint (vanity):', mintPubkey.toBase58());

  if (!mintPubkey.toBase58().startsWith(APTC_LAUNCH.vanityPrefix) && !mintPubkey.toBase58().startsWith(APTC_LAUNCH.vanityFallbackPrefix)) {
    console.warn(
      `Warning: mint does not start with ${APTC_LAUNCH.vanityPrefix} or ${APTC_LAUNCH.vanityFallbackPrefix}`,
    );
  }

  console.log('\nDistribution:');
  for (const w of APTC_WALLET_DISTRIBUTION) {
    const amt = amountForWallet(w.pct, APTC_LAUNCH.decimals);
    console.log(`  ${w.pct}% ${w.label.padEnd(18)} ${w.address}  → ${amt.toString()} raw`);
  }

  if (DRY_RUN) {
    console.log('\nDry run complete — no transactions sent.');
    return;
  }

  const connection = new Connection(rpc, 'confirmed');
  const balance = await connection.getBalance(payer.publicKey);
  console.log('\nPayer balance:', (balance / 1e9).toFixed(4), 'SOL');
  if (balance < 50_000_000) {
    throw new Error('Payer needs at least ~0.05 SOL for mint + distribution');
  }

  console.log('\n1/5 Creating mint...');
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    APTC_LAUNCH.revokeFreeze ? null : payer.publicKey,
    APTC_LAUNCH.decimals,
    mintKeypair,
    undefined,
    TOKEN_PROGRAM_ID,
  );
  console.log('   Mint:', mint.toBase58());

  console.log('\n2/5 Creating Metaplex metadata...');
  const metadata = metadataPda(mint);
  const metaIx = createCreateMetadataAccountV3Instruction(
    {
      metadata,
      mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: APTC_LAUNCH.name,
          symbol: APTC_LAUNCH.symbol,
          uri: APTC_LAUNCH.uri,
          sellerFeeBasisPoints: 0,
          creators: [
            {
              address: payer.publicKey,
              verified: true,
              share: 100,
            },
          ],
          collection: null,
          uses: null,
        },
        isMutable: !APTC_LAUNCH.revokeUpdate,
        collectionDetails: null,
      },
    },
  );
  const metaTx = new Transaction().add(metaIx);
  await sendAndConfirmTransaction(connection, metaTx, [payer], { commitment: 'confirmed' });
  console.log('   Metadata:', metadata.toBase58());

  console.log('\n3/5 Minting full supply to payer ATA...');
  const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  const totalRaw =
    BigInt(APTC_LAUNCH.supplyHuman) * 10n ** BigInt(APTC_LAUNCH.decimals);
  await mintTo(connection, payer, mint, payerAta.address, payer, totalRaw);
  console.log('   Minted:', totalRaw.toString(), 'raw units');

  console.log('\n4/5 Distributing to nine wallets...');
  for (const w of APTC_WALLET_DISTRIBUTION) {
    const destOwner = new PublicKey(w.address);
    const amount = amountForWallet(w.pct, APTC_LAUNCH.decimals);
    const destAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, destOwner);
    await transfer(connection, payer, payerAta.address, destAta.address, payer, amount);
    console.log(`   ✓ ${w.label}: ${(Number(amount) / 10 ** APTC_LAUNCH.decimals).toLocaleString()} APTC`);
  }

  console.log('\n5/5 Revoking authorities...');
  if (APTC_LAUNCH.revokeMint) {
    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null);
    console.log('   ✓ Mint authority revoked');
  }
  if (APTC_LAUNCH.revokeFreeze) {
    await setAuthority(connection, payer, mint, payer, AuthorityType.FreezeAccount, null);
    console.log('   ✓ Freeze authority revoked');
  }
  if (APTC_LAUNCH.revokeUpdate) {
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
    await sendAndConfirmTransaction(connection, updateTx, [payer], { commitment: 'confirmed' });
    console.log('   ✓ Update authority revoked · metadata immutable');
  }

  console.log('\n=== LAUNCH COMPLETE ===');
  console.log('Mint:', mint.toBase58());
  console.log('Solscan:', `https://solscan.io/token/${mint.toBase58()}`);
  console.log('\nVercel env:');
  console.log(`NEXT_PUBLIC_APTC_SOLANA_MINT=${mint.toBase58()}`);
  console.log(`NEXT_PUBLIC_APTC_STAKING_VAULT=4Ka1vdinFUqhh3TtHaohj1MiKVUrvJBrgsVp1MfVnXFQ`);
  console.log(`APTC_STAKING_ENABLED=true`);
  console.log(`NEXT_PUBLIC_APTC_STAKING_ENABLED=true`);
}

main().catch((e) => {
  console.error('\nLaunch failed:', e.message || e);
  process.exit(1);
});
