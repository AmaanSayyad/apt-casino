#!/usr/bin/env node
/**
 * Grind a vanity mint keypair whose base58 address starts with "aptc" (case-insensitive).
 * Usage: node scripts/aptc-launch/grind-vanity-mint.mjs [output.json]
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Keypair } from '@solana/web3.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out =
  process.argv[2] ||
  resolve(__dirname, '.keys/mint-single.json');
const PREFIX = 'aptc';

function matches(addr) {
  return addr.slice(0, 4).toLowerCase() === PREFIX;
}

const start = Date.now();
let attempts = 0;
const logEvery = 25_000;

while (true) {
  const kp = Keypair.generate();
  attempts += 1;
  const addr = kp.publicKey.toBase58();
  if (matches(addr)) {
    writeFileSync(out, JSON.stringify(Array.from(kp.secretKey)));
    const secs = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Found ${addr} after ${attempts.toLocaleString()} attempts (${secs}s)`);
    console.log(`Saved: ${out}`);
    process.exit(0);
  }
  if (attempts % logEvery === 0) {
    const rate = (attempts / ((Date.now() - start) / 1000)).toFixed(0);
    process.stdout.write(`\r${attempts.toLocaleString()} attempts (${rate}/s)...`);
  }
}
