/**
 * Minimal Solana JSON-RPC helpers for OTC lottery deposit detection.
 */

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

export function getSolanaRpcUrl(): string {
  return process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || DEFAULT_RPC;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(getSolanaRpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || 'Solana RPC error');
  }
  return json.result as T;
}

type SigInfo = { signature: string; blockTime: number | null; err: unknown };

export async function getRecentSignaturesForAddress(address: string, limit = 40): Promise<SigInfo[]> {
  const result = await rpc<SigInfo[] | null>('getSignaturesForAddress', [
    address,
    { limit },
  ]);
  return result || [];
}

type TxResult = {
  blockTime: number | null;
  meta: {
    err: unknown;
    preBalances: number[];
    postBalances: number[];
  } | null;
  transaction: {
    message: {
      accountKeys: string[];
    };
  };
};

export async function getTransaction(signature: string): Promise<TxResult | null> {
  const result = await rpc<TxResult | null>('getTransaction', [
    signature,
    { encoding: 'json', maxSupportedTransactionVersion: 0 },
  ]);
  return result;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Find inbound SOL transfer from sender to treasury in a confirmed tx. */
export function parseSolTransferToTreasury(
  tx: TxResult,
  treasury: string,
  expectedSender?: string,
): { sender: string; lamports: number; blockTime: Date } | null {
  if (!tx?.meta || tx.meta.err) return null;
  const keys = tx.transaction?.message?.accountKeys || [];
  const treasuryIdx = keys.findIndex((k) => k === treasury);
  if (treasuryIdx < 0) return null;

  const treasuryGain = tx.meta.postBalances[treasuryIdx] - tx.meta.preBalances[treasuryIdx];
  if (treasuryGain <= 0) return null;

  let sender: string | null = null;
  if (expectedSender) {
    const senderIdx = keys.findIndex((k) => k === expectedSender);
    if (senderIdx >= 0) {
      const senderLoss = tx.meta.preBalances[senderIdx] - tx.meta.postBalances[senderIdx];
      if (senderLoss > 0) sender = expectedSender;
    }
  }
  if (!sender) {
    for (let i = 0; i < keys.length; i++) {
      const loss = tx.meta.preBalances[i] - tx.meta.postBalances[i];
      if (loss >= treasuryGain - 10_000 && keys[i] !== treasury) {
        sender = keys[i];
        break;
      }
    }
  }
  if (!sender) return null;

  const blockTime = tx.blockTime
    ? new Date(tx.blockTime * 1000)
    : new Date();

  return { sender, lamports: treasuryGain, blockTime };
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}
