#!/usr/bin/env node
/**
 * Find wallets that withdrew without any verified deposit and ban them.
 * Usage: node scripts/ban-fraud-withdrawers.mjs [--dry-run]
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(url, key);

/** Known treasury / launch wallets — never auto-ban */
const ALLOWLIST = new Set(
  [
    process.env.NEXT_PUBLIC_APTC_STAKING_VAULT,
    process.env.SOLANA_TREASURY_WALLET,
    process.env.SOLANA_ESCROW_WALLET,
    'CAVLQyCEycrok3Mbv5mdCbE3epGQW3ibQ447fwTLweYx',
  ]
    .filter(Boolean)
    .map((w) => String(w).trim()),
);

function normalizeBanKey(address) {
  const t = String(address || '').trim();
  if (t.startsWith('0x')) {
    return `0x${t.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
  }
  return t;
}

async function main() {
  const [{ data: withdrawals }, { data: deposits }] = await Promise.all([
    db
      .from('withdrawal_requests')
      .select('wallet, chain, gross_apt, status, usd_estimate, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    db.from('deposits_log').select('wallet, chain'),
  ]);

  const depositedWallets = new Set(
    (deposits ?? []).map((d) => `${d.chain}:${String(d.wallet).trim()}`),
  );

  const fraudByWallet = new Map();

  for (const w of withdrawals ?? []) {
    const wallet = String(w.wallet || '').trim();
    if (!wallet || ALLOWLIST.has(wallet)) continue;

    const key = `${w.chain}:${wallet}`;
    if (depositedWallets.has(key)) continue;

    const prev = fraudByWallet.get(wallet) || {
      wallet,
      chain: w.chain,
      withdrawals: 0,
      totalGross: 0,
      statuses: new Set(),
    };
    prev.withdrawals += 1;
    prev.totalGross += Number(w.gross_apt ?? 0);
    prev.statuses.add(w.status);
    fraudByWallet.set(wallet, prev);
  }

  const fraudList = [...fraudByWallet.values()].sort((a, b) => b.totalGross - a.totalGross);

  if (!fraudList.length) {
    console.log('No fraud wallets found (all withdrawers have deposits).');
    return;
  }

  console.log(`Found ${fraudList.length} wallet(s) with withdrawals but zero deposits:\n`);
  for (const f of fraudList) {
    console.log(
      `  ${f.wallet} | ${f.withdrawals} wd | ${f.totalGross.toFixed(4)} gross | statuses: ${[...f.statuses].join(', ')}`,
    );
  }

  if (dryRun) {
    console.log('\nDry run — no bans written.');
    return;
  }

  for (const f of fraudList) {
    const banKey = normalizeBanKey(f.wallet);
    const reason = `Auto-ban: ${f.withdrawals} withdrawal(s) (${f.totalGross} gross) with zero verified deposits`;

    const { error: banErr } = await db
      .from('banned_wallets')
      .upsert({ wallet_address: banKey, reason }, { onConflict: 'wallet_address' });
    if (banErr) {
      console.error(`Failed to ban ${banKey}:`, banErr.message);
      continue;
    }

    await db.from('wallet_account_status').upsert(
      { wallet: banKey, status: 'banned', reason, updated_at: new Date().toISOString() },
      { onConflict: 'wallet' },
    );

    await db
      .from('user_house_balances')
      .update({ balance_raw: '0', updated_at: new Date().toISOString() })
      .eq('user_address', f.wallet)
      .eq('chain', f.chain);

    console.log(`Banned + zeroed balance: ${banKey}`);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
