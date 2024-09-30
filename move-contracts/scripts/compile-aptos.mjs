#!/usr/bin/env node
/** Compile Move package with apt_casino = deployer address (required when Move.toml uses `_`). */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

const rawPk = (process.env.DEPLOYER_PRIVATE_KEY || '').trim();
if (!rawPk) {
  console.error('DEPLOYER_PRIVATE_KEY missing in .env');
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
const addr = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(pkHex),
}).accountAddress.toStringLong();
const named = `apt_casino=${addr}`;

const r = spawnSync(
  'aptos',
  ['move', 'compile', '--skip-fetch-latest-git-deps', '--named-addresses', named],
  { cwd: packageDir, stdio: 'inherit' },
);
process.exit(r.status ?? 1);
