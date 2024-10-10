#!/usr/bin/env node
/**
 * Build + deploy apt_casino Anchor program.
 *
 * Usage (repo root):
 *   node solana-programs/scripts/deploy-solana.mjs devnet
 *   node solana-programs/scripts/deploy-solana.mjs mainnet
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const programsDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(repoRoot, '.env') });

const CLUSTER_MAP = {
  devnet: 'devnet',
  mainnet: 'mainnet-beta',
  'mainnet-beta': 'mainnet-beta',
  localnet: 'localnet',
};

function usage() {
  console.error('Usage: node solana-programs/scripts/deploy-solana.mjs <devnet|mainnet|localnet>');
  process.exit(1);
}

function run(label, cmd, args, cwd = programsDir) {
  console.log(`\n→ ${label}\n  ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  if (r.status !== 0) {
    console.error(`\nCommand failed: ${label}`);
    process.exit(r.status ?? 1);
  }
}

function readProgramId() {
  const keypairPath = path.join(programsDir, 'target', 'deploy', 'apt_casino-keypair.json');
  if (!fs.existsSync(keypairPath)) {
    console.error('Missing', keypairPath, '— run anchor build first.');
    process.exit(1);
  }
  const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  // eslint-disable-next-line no-undef
  const { Keypair } = require('@solana/web3.js');
  return Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey.toBase58();
}

const clusterArg = (process.argv[2] || 'devnet').toLowerCase();
const solanaCluster = CLUSTER_MAP[clusterArg];
if (!solanaCluster) usage();

if (!process.env.ANCHOR_WALLET && process.env.SOL_TREASURY_SECRET_KEY) {
  console.log('Tip: export ANCHOR_WALLET or use default ~/.config/solana/id.json');
}

run('anchor build', 'anchor', ['build']);

const programId = readProgramId();
console.log('\nProgram ID:', programId);

run(`solana config set --url ${solanaCluster}`, 'solana', ['config', 'set', '--url', solanaCluster]);
run('anchor deploy', 'anchor', ['deploy', '--program-name', 'apt_casino']);

const idlPath = path.join(programsDir, 'target', 'idl', 'apt_casino.json');
const idlDest = path.join(repoRoot, 'src', 'lib', 'solana', 'idl', 'apt_casino.json');
if (fs.existsSync(idlPath)) {
  fs.mkdirSync(path.dirname(idlDest), { recursive: true });
  fs.copyFileSync(idlPath, idlDest);
  console.log('Copied IDL →', idlDest);
}

console.log('\n--- Add to .env ---');
console.log(`NEXT_PUBLIC_APT_CASINO_PROGRAM_ID=${programId}`);
console.log(`NEXT_PUBLIC_SOLANA_NETWORK=${clusterArg === 'mainnet' ? 'mainnet-beta' : clusterArg}`);
console.log('\nThen: npm run bootstrap:solana');
