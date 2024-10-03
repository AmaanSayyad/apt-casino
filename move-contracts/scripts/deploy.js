/**
 * @deprecated Use the Aptos CLI flow instead (current @aptos-labs/ts-sdk no longer supports
 * publishPackageTransaction from a package directory).
 *
 *   node move-contracts/scripts/deploy-aptos.mjs mainnet
 *   node move-contracts/scripts/deploy-aptos.mjs testnet
 *
 * Or: npm run deploy:aptos -- mainnet
 */
console.error(`
deploy.js is deprecated.

Publish with:
  npm run deploy:aptos -- mainnet
  npm run deploy:aptos -- testnet

Requires: aptos CLI, repo root .env with DEPLOYER_PRIVATE_KEY, and APT on the target network.
`);
process.exit(1);
