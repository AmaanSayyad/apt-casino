'use client';

import { useCallback, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';
import {
  buildIpoSolPurchaseTransaction,
  waitForSolanaSignatureConfirmed,
  formatSolanaError,
} from '@/lib/solana/client';

const PENDING_KEY = 'aptcasino_pending_ipo_purchase';

async function settleOnServer(wallet, solAmount, txHash, referrerWallet) {
  const res = await fetch('/api/ipo/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, solAmount, txHash, referrerWallet }),
  });
  let data = await res.json();
  if (!res.ok) {
    for (let i = 0; i < 4 && !data.success; i++) {
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
      const retry = await fetch('/api/ipo/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, solAmount, txHash, referrerWallet }),
      });
      data = await retry.json();
      if (retry.ok && data.success) break;
    }
  }
  return { ok: res.ok || data.success, data };
}

export function useIpoPurchase(treasuryAddress, referrerWallet) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const purchase = useCallback(
    async (solAmount) => {
      if (!publicKey || !sendTransaction) {
        toast.error('Connect your Solana wallet first');
        return { success: false };
      }
      if (!Number.isFinite(solAmount) || solAmount <= 0) {
        toast.error('Enter a valid SOL amount');
        return { success: false };
      }

      const wallet = publicKey.toBase58();
      setIsPurchasing(true);
      try {
        if (typeof window !== 'undefined') {
          try {
            const raw = window.sessionStorage.getItem(PENDING_KEY);
            if (raw) {
              const pending = JSON.parse(raw);
              if (pending?.wallet === wallet && pending?.txHash) {
                const { ok, data } = await settleOnServer(
                  wallet,
                  pending.solAmount,
                  pending.txHash,
                  pending.referrerWallet ?? null,
                );
                if (ok && data.success) {
                  window.sessionStorage.removeItem(PENDING_KEY);
                  toast.success(
                    data.message ||
                      `Buy complete — ${Number(data.aptcAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} APTC locked in staking vault`,
                  );
                  return { success: true, ...data };
                }
              }
            }
          } catch {
            /* ignore */
          }
        }

        const tx = await buildIpoSolPurchaseTransaction(solAmount, wallet, treasuryAddress || undefined);
        const sig = await sendTransaction(tx, connection);
        await waitForSolanaSignatureConfirmed(connection, sig);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            PENDING_KEY,
            JSON.stringify({
              wallet,
              solAmount,
              txHash: sig,
              referrerWallet: referrerWallet || null,
            }),
          );
        }

        const { ok, data } = await settleOnServer(wallet, solAmount, sig, referrerWallet || null);
        if (!ok || !data.success) {
          throw new Error(data.error || 'Failed to settle IPO purchase');
        }

        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(PENDING_KEY);
        }

        if (data.queued) {
          toast.info(
            data.message ||
              'SOL received — APTC queued to lock in the staking vault when supply is added.',
          );
        } else {
          toast.success(
            data.message ||
              `Buy complete — ${Number(data.aptcAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} APTC locked in staking vault`,
          );
        }
        return { success: true, ...data };
      } catch (e) {
        toast.error(formatSolanaError(e));
        return { success: false, error: formatSolanaError(e) };
      } finally {
        setIsPurchasing(false);
      }
    },
    [publicKey, sendTransaction, connection, treasuryAddress, referrerWallet],
  );

  return { purchase, isPurchasing };
}
