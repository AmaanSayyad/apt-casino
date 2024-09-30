#!/usr/bin/env node
/**
 * Idempotent on-chain bootstrap after `npm run deploy:aptos -- mainnet`:
 * - user_balance::init (House + APT coin store on module account)
 * - plinko, mines, roulette, wheel ::init
 *
 * Requires repo root .env: TREASURY_PRIVATE_KEY, NEXT_PUBLIC_CASINO_MODULE_ADDRESS
 * (publisher / treasury should be the same account as apt_casino.)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Aptos, AptosConfig, Network, Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

function normalizeEd25519PrivateKeyHex(s) {
  let t = String(s || '').trim();
  const lower = t.toLowerCase();
  if (lower.startsWith('ed25519-priv-')) t = t.slice('ed25519-priv-'.length).trim();
  if (!t.startsWith('0x')) t = `0x${t}`;
  return t;
}

const rawPk = (process.env.TREASURY_PRIVATE_KEY || '').trim();
const moduleAddr = (process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || '').trim();
if (!rawPk || !moduleAddr) {
  console.error('Need TREASURY_PRIVATE_KEY and NEXT_PUBLIC_CASINO_MODULE_ADDRESS in .env');
  process.exit(1);
}

const signer = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(normalizeEd25519PrivateKeyHex(rawPk)),
});

const net = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
const network =
  net === 'testnet' ? Network.TESTNET : net === 'devnet' ? Network.DEVNET : Network.MAINNET;
const aptos = new Aptos(new AptosConfig({ network }));

async function resourceExists(resourceType) {
  try {
    await aptos.getAccountResource({ accountAddress: moduleAddr, resourceType });
    return true;
  } catch {
    return false;
  }
}

const steps = [
  { label: 'user_balance::init', resource: `${moduleAddr}::user_balance::House`, fn: `${moduleAddr}::user_balance::init` },
  { label: 'plinko::init', resource: `${moduleAddr}::plinko::House`, fn: `${moduleAddr}::plinko::init` },
  { label: 'mines::init', resource: `${moduleAddr}::mines::House`, fn: `${moduleAddr}::mines::init` },
  { label: 'roulette::init', resource: `${moduleAddr}::roulette::House`, fn: `${moduleAddr}::roulette::init` },
  { label: 'wheel::init', resource: `${moduleAddr}::wheel::House`, fn: `${moduleAddr}::wheel::init` },
];

for (const { label, resource, fn } of steps) {
  if (await resourceExists(resource)) {
    console.log(`skip ${label} (resource present)`);
    continue;
  }
  const tx = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: { function: fn, functionArguments: [] },
    options: { maxGasAmount: 200000, gasUnitPrice: 100 },
  });
  const committed = await aptos.signAndSubmitTransaction({ signer, transaction: tx });
  await aptos.waitForTransaction({ transactionHash: committed.hash });
  console.log(`${label} -> ${committed.hash}`);
}

console.log('Bootstrap done. game_logger::GameLog is created on first /api/log-game (aptos) if missing.');
