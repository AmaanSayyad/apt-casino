const { AptosAccount, AptosClient, CoinClient } = require('aptos');
require('dotenv').config();

const APTOS_NODE_URL = process.env.NEXT_PUBLIC_APTOS_NETWORK === 'mainnet' 
  ? 'https://fullnode.mainnet.aptoslabs.com/v1'
  : 'https://fullnode.testnet.aptoslabs.com/v1';

async function initTreasury() {
  try {
    console.log('🏦 Initializing Treasury Wallet...');
    
    const TREASURY_PRIVATE_KEY = "0x0e5070144da800e1528a09e39ee0f589a4feafb880968de6f0d5479f7258bd82";
    
    // Create treasury account from private key
    const treasuryAccount = new AptosAccount(
      new Uint8Array(Buffer.from(TREASURY_PRIVATE_KEY.slice(2), 'hex'))
    );
    
    console.log('📍 Treasury Address:', treasuryAccount.address().hex());
    
    const client = new AptosClient(APTOS_NODE_URL);
    const coinClient = new CoinClient(client);
    
    try {
      // Try to check balance to see if coin store exists
      const balance = await coinClient.checkBalance(treasuryAccount);
      console.log('✅ Treasury already initialized with balance:', (balance / 100000000).toFixed(4), 'APT');
    } catch (error) {
      console.log('🔧 Treasury needs initialization...');
      
      // Initialize coin store by making a small self-transfer
      try {
        const txnHash = await coinClient.transfer(
          treasuryAccount,
          treasuryAccount.address(),
          1 // 1 octa (smallest unit)
        );
        
        await client.waitForTransaction(txnHash);
        console.log('✅ Treasury initialized successfully! TX:', txnHash);
        
        // Check balance after initialization
        const balance = await coinClient.checkBalance(treasuryAccount);
        console.log('💰 Treasury balance:', (balance / 100000000).toFixed(4), 'APT');
        
      } catch (initError) {
        console.error('❌ Failed to initialize treasury:', initError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

initTreasury();