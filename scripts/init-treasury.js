const { AptosAccount, AptosClient, CoinClient } = require('aptos');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const APTOS_NODE_URL = process.env.NEXT_PUBLIC_APTOS_NETWORK === 'mainnet'
  ? 'https://fullnode.mainnet.aptoslabs.com/v1'
  : 'https://fullnode.testnet.aptoslabs.com/v1';

function loadTreasuryPrivateKeyHex() {
  const raw = (process.env.TREASURY_PRIVATE_KEY || '').trim();
  if (!raw) {
    throw new Error('TREASURY_PRIVATE_KEY is not set. Add it to .env (never commit this value).');
  }
  let hex = raw;
  if (hex.toLowerCase().startsWith('ed25519-priv-')) {
    hex = hex.slice('ed25519-priv-'.length).trim();
  }
  if (!hex.startsWith('0x')) hex = `0x${hex}`;
  return hex;
}

async function initTreasury() {
  try {
    console.log('🏦 Initializing Treasury Wallet...');

    const TREASURY_PRIVATE_KEY = loadTreasuryPrivateKeyHex();
    const treasuryAccount = new AptosAccount(
      new Uint8Array(Buffer.from(TREASURY_PRIVATE_KEY.slice(2), 'hex')),
    );

    console.log('📍 Treasury Address:', treasuryAccount.address().hex());

    const client = new AptosClient(APTOS_NODE_URL);
    const coinClient = new CoinClient(client);

    try {
      const balance = await coinClient.checkBalance(treasuryAccount);
      console.log('✅ Treasury already initialized with balance:', (balance / 100000000).toFixed(4), 'APT');
    } catch {
      console.log('🔧 Treasury needs initialization...');

      try {
        const txnHash = await coinClient.transfer(treasuryAccount, treasuryAccount.address(), 1);
        await client.waitForTransaction(txnHash);
        console.log('✅ Treasury initialized successfully! TX:', txnHash);

        const balance = await coinClient.checkBalance(treasuryAccount);
        console.log('💰 Treasury balance:', (balance / 100000000).toFixed(4), 'APT');
      } catch (initError) {
        console.error('❌ Failed to initialize treasury:', initError.message);
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  }
}

initTreasury();
