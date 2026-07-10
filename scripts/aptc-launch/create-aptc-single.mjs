#!/usr/bin/env node
/**
 * APTC single-wallet launch — full 1B supply minted to payer, all authorities revoked.
 * Payer receives 100% of supply (legacy manual mint — use IPO launch for production).
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
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
  createMint,
  getOrCreateAssociatedTokenAccount,
  getMint,
  mintTo,
  setAuthority,
  AuthorityType,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import bs58 from 'bs58';
import { APTC_LAUNCH } from './config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

function loadKeypair(path) {
  if (!path || !existsSync(path)) throw new Error(`Keypair not found: ${path}`);
  const secret = JSON.parse(readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function loadPayerKeypair() {
  const path = process.env.APTC_LAUNCH_KEYPAIR;
  if (path && existsSync(path)) return loadKeypair(path);
  const b58 = process.env.APTC_LAUNCH_SECRET?.trim();
  if (b58) return Keypair.fromSecretKey(bs58.decode(b58));
  throw new Error('Set APTC_LAUNCH_KEYPAIR or APTC_LAUNCH_SECRET');
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

function writeLaunchResult(mint, payer) {
  const resultPath = resolve(__dirname, '.keys/launch-result.json');
  const payload = {
    mint,
    payer: payer.publicKey.toBase58(),
    launchedAt: new Date().toISOString(),
    network: 'mainnet-beta',
    supplyHuman: APTC_LAUNCH.supplyHuman,
    decimals: APTC_LAUNCH.decimals,
    metadataUri: APTC_LAUNCH.uri,
  };
  writeFileSync(resultPath, JSON.stringify(payload, null, 2));
  console.log('\nSaved launch result:', resultPath);
}

async function main() {
  loadEnv();

  const rpc =
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com';

  const mintPath =
    process.env.APTC_MINT_KEYPAIR || resolve(__dirname, '.keys/mint-single.json');

  console.log('\n=== APTC single-wallet launch ===');
  console.log('Network: mainnet-beta');
  console.log('RPC:', rpc);
  console.log('Dry run:', DRY_RUN);
  console.log('Token:', APTC_LAUNCH.name, `(${APTC_LAUNCH.symbol})`);
  console.log('Supply:', APTC_LAUNCH.supplyHuman.toLocaleString(), '→ payer wallet only');

  const payer = loadPayerKeypair();
  const mintKeypair = loadKeypair(mintPath);
  const mintPubkey = mintKeypair.publicKey;

  console.log('\nPayer / recipient:', payer.publicKey.toBase58());
  console.log('Mint (vanity):', mintPubkey.toBase58());

  if (!mintPubkey.toBase58().slice(0, 4).toLowerCase().startsWith('aptc')) {
    console.warn('Warning: mint does not start with aptc (case-insensitive)');
  }

  if (DRY_RUN) {
    console.log('\nDry run complete — no transactions sent.');
    return;
  }

  const connection = new Connection(rpc, 'confirmed');
  const balance = await connection.getBalance(payer.publicKey);
  console.log('\nPayer balance:', (balance / 1e9).toFixed(4), 'SOL');
  if (balance < 30_000_000) {
    throw new Error('Payer needs at least ~0.03 SOL for mint + metadata + revokes');
  }

  console.log('\n1/4 Creating mint...');
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

  console.log('\n2/4 Creating Metaplex metadata...');
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
          creators: [{ address: payer.publicKey, verified: true, share: 100 }],
          collection: null,
          uses: null,
        },
        isMutable: !APTC_LAUNCH.revokeUpdate,
        collectionDetails: null,
      },
    },
  );
  await sendAndConfirmTransaction(connection, new Transaction().add(metaIx), [payer], {
    commitment: 'confirmed',
  });
  console.log('   Metadata:', metadata.toBase58());

  console.log('\n3/4 Minting full supply to payer...');
  const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  const totalRaw = BigInt(APTC_LAUNCH.supplyHuman) * BigInt(10) ** BigInt(APTC_LAUNCH.decimals);
  await mintTo(connection, payer, mint, payerAta.address, payer, totalRaw);
  console.log('   Minted:', APTC_LAUNCH.supplyHuman.toLocaleString(), 'APTC');
  console.log('   ATA:', payerAta.address.toBase58());

  console.log('\n4/4 Revoking authorities...');
  const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_PROGRAM_ID);
  if (APTC_LAUNCH.revokeMint && mintInfo.mintAuthority) {
    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null);
    console.log('   ✓ Mint authority revoked');
  } else if (APTC_LAUNCH.revokeMint) {
    console.log('   ✓ Mint authority already revoked');
  }
  if (APTC_LAUNCH.revokeFreeze && mintInfo.freezeAuthority) {
    await setAuthority(connection, payer, mint, payer, AuthorityType.FreezeAccount, null);
    console.log('   ✓ Freeze authority revoked');
  } else if (APTC_LAUNCH.revokeFreeze) {
    console.log('   ✓ Freeze authority already null at mint creation');
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
    await sendAndConfirmTransaction(connection, new Transaction().add(updateIx), [payer], {
      commitment: 'confirmed',
    });
    console.log('   ✓ Update authority revoked');
  }

  writeLaunchResult(mint.toBase58(), payer);

  console.log('\n=== LAUNCH COMPLETE ===');
  console.log('Mint:', mint.toBase58());
  console.log('Holder:', payer.publicKey.toBase58());
  console.log('Solscan:', `https://solscan.io/token/${mint.toBase58()}`);
  console.log('\nAdd to .env / Vercel:');
  console.log(`NEXT_PUBLIC_APTC_SOLANA_MINT=${mint.toBase58()}`);
  console.log(`SOLANA_RPC_URL=${rpc}`);
}

main().catch((e) => {
  console.error('\nLaunch failed:', e.message || e);
  process.exit(1);
});
