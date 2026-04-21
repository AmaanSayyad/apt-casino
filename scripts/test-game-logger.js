const { Aptos, AptosConfig, Network, Ed25519PrivateKey, Account } = require('@aptos-labs/ts-sdk');
const dotenv = require('dotenv');

dotenv.config();

async function testGameLogger() {
  try {
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    // Create treasury account from private key
    const privateKey = new Ed25519PrivateKey(process.env.TREASURY_PRIVATE_KEY);
    const treasuryAccount = Account.fromPrivateKey({ privateKey });

    console.log('🧪 TESTING GAME LOGGER');
    console.log('├── Treasury Address:', treasuryAccount.accountAddress.toString());
    console.log('├── Module Address:', process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS);
    console.log('└── Network: Testnet');
    console.log('');

    // Test logging a game
    console.log('📝 Logging test game...');
    
    const transaction = await aptos.transaction.build.simple({
      sender: treasuryAccount.accountAddress,
      data: {
        function: `${process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS}::game_logger::log_game`,
        functionArguments: [
          1, // game_type (plinko)
          "0x1234567890abcdef1234567890abcdef12345678", // player_address
          100, // bet_amount (1 APT in smallest unit)
          "16rows_Medium_bin8_5.6x", // result
          560, // payout (5.6 APT in smallest unit)
        ],
      },
      options: {
        maxGasAmount: 10000,
        gasUnitPrice: 100,
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: treasuryAccount,
      transaction,
    });

    console.log('✅ Game logged successfully!');
    console.log('├── Transaction Hash:', committedTxn.hash);
    console.log('└── Explorer URL:', `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`);
    console.log('');

    // Wait for transaction confirmation
    await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    // Test reading game history
    console.log('📖 Reading game history...');
    
    const historyData = await aptos.view({
      payload: {
        function: `${process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS}::game_logger::get_game_history`,
        functionArguments: [treasuryAccount.accountAddress.toString()],
      },
    });

    const games = historyData[0] || [];
    console.log('✅ Game history retrieved!');
    console.log('├── Total games:', games.length);
    
    if (games.length > 0) {
      const lastGame = games[games.length - 1];
      console.log('├── Last game ID:', lastGame.game_id);
      console.log('├── Game type:', lastGame.game_type);
      console.log('├── Player:', lastGame.player_address);
      console.log('├── Bet amount:', lastGame.bet_amount);
      console.log('├── Result:', lastGame.result);
      console.log('├── Payout:', lastGame.payout);
      console.log('├── Timestamp:', new Date(lastGame.timestamp * 1000).toISOString());
      console.log('└── Random seed:', lastGame.random_seed);
    }

    console.log('');
    console.log('🎉 ALL TESTS PASSED!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  }
}

testGameLogger();