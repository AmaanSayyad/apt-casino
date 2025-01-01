import { Aptos, AptosConfig, Network, Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';

const OCT = 100_000_000;

/** Accept raw hex or AIP-80 `ed25519-priv-0x...` from wallets / Supabase. */
export function normalizeEd25519PrivateKeyHex(raw: string): string {
  let s = String(raw || '').trim();
  const lower = s.toLowerCase();
  if (lower.startsWith('ed25519-priv-')) {
    s = s.slice('ed25519-priv-'.length).trim();
  }
  if (!s.startsWith('0x')) s = `0x${s}`;
  return s;
}

function networkFromEnv(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  if (n === 'testnet') return Network.TESTNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.MAINNET;
}

export function getAptosForServer(): Aptos {
  return new Aptos(new AptosConfig({ network: networkFromEnv() }));
}

const APT_DECIMALS = 1e8;

/** Native APT balance (human units) — FA + legacy coin via indexer, with CoinStore fallback. */
export async function getAptBalanceNative(accountAddress: string): Promise<number> {
  const aptos = getAptosForServer();
  try {
    const octas = await aptos.getAccountAPTAmount({ accountAddress });
    return Number(octas) / APT_DECIMALS;
  } catch {
    try {
      const resource = await aptos.getAccountResource({
        accountAddress,
        resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
      });
      const raw = (resource.data as { coin?: { value?: string } })?.coin?.value ?? '0';
      return Number(BigInt(raw)) / APT_DECIMALS;
    } catch {
      return 0;
    }
  }
}

export function getTreasurySignerFromEnv(): Account {
  const rawPk = process.env.TREASURY_PRIVATE_KEY;
  if (!rawPk?.trim()) {
    throw new Error('TREASURY_PRIVATE_KEY is not configured');
  }
  const pk = normalizeEd25519PrivateKeyHex(rawPk);
  const privateKey = new Ed25519PrivateKey(pk);
  return Account.fromPrivateKey({ privateKey });
}

function normalizeAddr(addr: string): string {
  let hex = addr.trim().toLowerCase();
  hex = hex.startsWith('0x') ? hex.slice(2) : hex;
  hex = hex.padStart(64, '0');
  return `0x${hex}`;
}

/**
 * Transfer native APT from treasury EOA to recipient (octas).
 */
export async function transferAptFromTreasury(
  recipient: string,
  amountOctas: number,
): Promise<string> {
  if (!Number.isFinite(amountOctas) || amountOctas <= 0) {
    throw new Error('Invalid transfer amount');
  }
  const aptos = getAptosForServer();
  const signer = getTreasurySignerFromEnv();
  const to = normalizeAddr(recipient);

  const txn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: '0x1::aptos_account::transfer',
      functionArguments: [to, amountOctas.toString()],
    },
    options: { maxGasAmount: 200000, gasUnitPrice: 100 },
  });

  const committed = await aptos.signAndSubmitTransaction({ signer, transaction: txn });
  await aptos.waitForTransaction({ transactionHash: committed.hash });
  return committed.hash;
}

export function aptToOctas(apt: number): number {
  return Math.floor(apt * OCT);
}

export function octasToApt(octas: number): number {
  return octas / OCT;
}
