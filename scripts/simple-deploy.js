const { Aptos, AptosConfig, Network, Ed25519PrivateKey, Account } = require('@aptos-labs/ts-sdk');
const dotenv = require('dotenv');

dotenv.config();

async function deployContract() {
  try {
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);

    // Create deployer account from private key
    const privateKey = new Ed25519PrivateKey(process.env.DEPLOYER_PRIVATE_KEY);
    const deployer = Account.fromPrivateKey({ privateKey });

    console.log('Deployer Address:', deployer.accountAddress.toString());
    console.log('Deploying contracts...');

    // Build and publish the package
    const transaction = await aptos.transaction.build.publishPackage({
      account: deployer.accountAddress,
      packageDirectoryPath: './move-contracts',
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: deployer,
      transaction,
    });

    console.log('Transaction Hash:', committedTxn.hash);

    // Wait for transaction confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    console.log('Contracts deployed successfully!');
    console.log('Explorer URL:', `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=mainnet`);

  } catch (error) {
    console.error('Error deploying contracts:', error);
    process.exit(1);
  }
}

deployContract();