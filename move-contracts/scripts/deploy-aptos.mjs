#!/usr/bin/env node
/**
 * Publish Move package to Aptos mainnet or testnet using the Aptos CLI.
 *
 * Prerequisites:
 *   - `aptos` CLI installed (https://aptos.dev/tools/aptos-cli)
 *   - Repo root `.env` with DEPLOYER_PRIVATE_KEY (hex with or without `0x`, or AIP-80 `ed25519-priv-0x…`)
 *   - Named address `apt_casino` must be `_` in Move.toml (resolved at publish time)
 *   - Deployer account funded with APT on the target network (mainnet needs real funds)
 *
 * Usage (from repo root):
 *   node move-contracts/scripts/deploy-aptos.mjs mainnet
 *   node move-contracts/scripts/deploy-aptos.mjs testnet
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(packageDir, '.env') });

const REST = {
  mainnet: 'https://fullnode.mainnet.aptoslabs.com/v1',
  testnet: 'https://fullnode.testnet.aptoslabs.com/v1',
};

function usage() {
  console.error('Usage: node move-contracts/scripts/deploy-aptos.mjs <mainnet|testnet>');
  process.exit(1);
}

function run(label, cmd, args, extraEnv = {}) {
  console.log(`\n→ ${label}\n  ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: packageDir,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) {
    console.error(`\nCommand failed: ${label}`);
    process.exit(r.status ?? 1);
  }
}

const net = (process.argv[2] || '').toLowerCase();
if (net !== 'mainnet' && net !== 'testnet') usage();

const restUrl = REST[net];
const rawPk = (process.env.DEPLOYER_PRIVATE_KEY || '').trim();
if (!rawPk) {
  console.error('Missing DEPLOYER_PRIVATE_KEY in .env (repo root).');
  process.exit(1);
}

function normalizeEd25519PrivateKeyHex(s) {
  let t = String(s || '').trim();
  const lower = t.toLowerCase();
  if (lower.startsWith('ed25519-priv-')) t = t.slice('ed25519-priv-'.length).trim();
  if (!t.startsWith('0x')) t = `0x${t}`;
  return t;
}

const pkHex = normalizeEd25519PrivateKeyHex(rawPk);
const privateKey = new Ed25519PrivateKey(pkHex);
const deployer = Account.fromPrivateKey({ privateKey });
const addrLong = deployer.accountAddress.toStringLong();
const named = `apt_casino=${addrLong}`;

console.log(`Network: ${net}`);
console.log(`REST:    ${restUrl}`);
console.log(`Publisher (apt_casino): ${addrLong}`);
console.log('\nEnsure this account has enough APT on this network for gas + publish.');

const tmpKey = path.join(os.tmpdir(), `aptos-deploy-${process.pid}.key`);
fs.writeFileSync(tmpKey, pkHex, { mode: 0o600 });

try {
  run(
    'Compile (named address = publisher)',
    'aptos',
    ['move', 'compile', '--skip-fetch-latest-git-deps', '--named-addresses', named],
  );

  const publishArgs = [
    'move',
    'publish',
    '--assume-yes',
    '--url',
    restUrl,
    '--private-key-file',
    tmpKey,
    '--named-addresses',
    named,
    '--skip-fetch-latest-git-deps',
  ];

  if (process.env.APTOS_CHUNKED_PUBLISH === '1') {
    publishArgs.push('--chunked-publish');
  }

  run('Publish', 'aptos', publishArgs);
} finally {
  try {
    fs.unlinkSync(tmpKey);
  } catch {
    /* ignore */
  }
}

console.log('\n---');
console.log('Update your app env to point at this module account:');
console.log(`NEXT_PUBLIC_CASINO_MODULE_ADDRESS=${addrLong}`);
console.log(`NEXT_PUBLIC_TREASURY_ADDRESS=${addrLong}`);
console.log(`NEXT_PUBLIC_APTOS_NETWORK=${net}`);
console.log('Then restart Next.js / redeploy Vercel.');
