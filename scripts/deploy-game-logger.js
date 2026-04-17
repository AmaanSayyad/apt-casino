const { Aptos, AptosConfig, Network, Ed25519PrivateKey, Account } = require('@aptos-labs/ts-sdk');
const dotenv = require('dotenv');

dotenv.config();

async function deployGameLogger() {
  try {
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    // Create treasury account from private key
    const privateKey = new Ed25519PrivateKey(process.env.TREASURY_PRIVATE_KEY);
    const treasuryAccount = Account.fromPrivateKey({ privateKey });

    console.log('Treasury Address:', treasuryAccount.accountAddress.toString());
    console.log('Deploying game logger...');

    // Initialize the game logger
    const transaction = await aptos.transaction.build.simple({
      sender: treasuryAccount.accountAddress,
      data: {
        function: `${process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS}::game_logger::initialize`,
        functionArguments: [],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: treasuryAccount,
      transaction,
    });

    console.log('Transaction Hash:', committedTxn.hash);

    // Wait for transaction confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    console.log('Game logger initialized successfully!');
    console.log('Explorer URL:', `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`);

  } catch (error) {
    console.error('Error deploying game logger:', error);
    process.exit(1);
  }
}

deployGameLogger();