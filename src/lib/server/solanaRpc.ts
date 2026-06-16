/**
 * Solana JSON-RPC helpers for OTC lottery deposit detection.
 * Uses multi-endpoint polling — public RPCs often lag after wallet confirmation.
 */

import { Connection, PublicKey, type ParsedTransactionWithMeta } from '@solana/web3.js';
import { getSolanaRpcEndpoint } from '@/lib/solana/config';

const LAMPORTS_PER_SOL = 1_000_000_000;

function verificationRpcEndpoints(): string[] {
  const primary = getSolanaRpcEndpoint().replace(/\/+$/, '');
  return [
    ...new Set(
      [
        primary,
        'https://solana-rpc.publicnode.com',
        'https://rpc.ankr.com/solana',
        'https://api.mainnet-beta.solana.com',
      ].filter(Boolean),
    ),
  ];
}

function messageAccountKeysBase58(parsed: ParsedTransactionWithMeta): string[] {
  const meta = parsed.meta;
  const message = parsed.transaction.message as {
    accountKeys?: unknown[];
    getAccountKeys?: (args: {
      accountKeysFromLookups?: ParsedTransactionWithMeta['meta'] extends infer M
        ? M extends { loadedAddresses?: infer L }
          ? L
          : never
        : never;
    }) => { keySegments: () => PublicKey[][] };
  };

  if (typeof message.getAccountKeys === 'function') {
    try {
      const keys = message.getAccountKeys({
        accountKeysFromLookups: meta?.loadedAddresses,
      });
      return keys.keySegments().flat().map((k) => k.toBase58());
    } catch {
      /* fall through */
    }
  }

  const keys = message.accountKeys ?? [];
  return keys.map((k) => {
    if (typeof k === 'string') return k;
    const obj = k as { pubkey?: PublicKey; toBase58?: () => string };
    if (obj.pubkey) return obj.pubkey.toBase58();
    if (obj.toBase58) return obj.toBase58();
    return '';
  });
}

type SigInfo = { signature: string; blockTime: number | null; err: unknown };

export async function getRecentSignaturesForAddress(address: string, limit = 40): Promise<SigInfo[]> {
  for (const rpc of verificationRpcEndpoints()) {
    try {
      const connection = new Connection(rpc, {
        commitment: 'confirmed',
        disableRetryOnRateLimit: true,
      });
      const result = await connection.getSignaturesForAddress(new PublicKey(address), { limit });
      return result.map((s) => ({
        signature: s.signature,
        blockTime: s.blockTime ?? null,
        err: s.err,
      }));
    } catch {
      /* try next RPC */
    }
  }
  return [];
}

/** Poll multiple RPCs until a confirmed tx is indexed (up to ~30s). */
export async function fetchTransactionWithRetries(
  signature: string,
  maxMs = 30_000,
): Promise<ParsedTransactionWithMeta | null> {
  const endpoints = verificationRpcEndpoints();
  const deadline = Date.now() + maxMs;
  let delayMs = 400;

  while (Date.now() < deadline) {
    for (const rpc of endpoints) {
      try {
        const connection = new Connection(rpc, {
          commitment: 'confirmed',
          disableRetryOnRateLimit: true,
        });
        const parsed = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        });
        if (parsed?.meta && !parsed.meta.err) {
          return parsed;
        }
      } catch {
        /* try next endpoint */
      }
    }
    await new Promise((r) => setTimeout(r, delayMs));
    delayMs = Math.min(delayMs + 150, 2000);
  }

  return null;
}

/** @deprecated Use fetchTransactionWithRetries — single-shot often returns null on fresh txs. */
export async function getTransaction(signature: string): Promise<ParsedTransactionWithMeta | null> {
  return fetchTransactionWithRetries(signature, 8_000);
}

/** Find inbound SOL transfer from sender to treasury in a confirmed tx. */
export function parseSolTransferToTreasury(
  tx: ParsedTransactionWithMeta,
  treasury: string,
  expectedSender?: string,
): { sender: string; lamports: number; blockTime: Date } | null {
  if (!tx?.meta || tx.meta.err) return null;

  const keys = messageAccountKeysBase58(tx);
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

  const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();

  return { sender, lamports: treasuryGain, blockTime };
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}
