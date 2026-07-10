import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getIpoAptcDistributor } from '@/lib/config/ipo';

function keypairFromSecret(secretKeyStr: string, envName: string): Keypair {
  if (!secretKeyStr) {
    throw new Error(`${envName} is not configured`);
  }
  try {
    if (secretKeyStr.startsWith('[')) {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKeyStr)));
    }
    return Keypair.fromSecretKey(bs58.decode(secretKeyStr));
  } catch {
    throw new Error(`Invalid ${envName} format. Must be JSON array or base58.`);
  }
}

/**
 * Hot key for IPO APTC distribution only.
 * Must NOT be the SOL collector wallet — raise SOL stays on a receive-only address.
 */
export function getIpoTreasuryKeypair(): Keypair {
  const ipoSecret = process.env.IPO_TREASURY_SECRET_KEY?.trim();
  if (!ipoSecret) {
    throw new Error(
      'IPO_TREASURY_SECRET_KEY is not configured (APTC distributor hot wallet).',
    );
  }
  const kp = keypairFromSecret(ipoSecret, 'IPO_TREASURY_SECRET_KEY');
  const expected = getIpoAptcDistributor();
  if (expected && kp.publicKey.toBase58() !== expected) {
    throw new Error(
      `IPO_TREASURY_SECRET_KEY controls ${kp.publicKey.toBase58()} but NEXT_PUBLIC_IPO_APTC_DISTRIBUTOR is ${expected}`,
    );
  }
  return kp;
}
