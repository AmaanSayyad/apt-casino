'use client';

import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';
import {
  buildSolDepositTransaction,
  waitForSolanaSignatureConfirmed,
  formatSolanaError,
} from '@/lib/solana/client';
import { useWalletAuth } from '@/hooks/useWalletAuth';

const PENDING_SOL_DEPOSIT_KEY = 'aptcasino_pending_sol_deposit';

async function creditSolDepositOnServer(wallet, amountSol, txSignature, walletAuth) {
  const payload = { wallet, amountNative: amountSol, txSignature, walletAuth };
  const res = await fetch('/api/chains/solana/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data = await res.json();
  if (!res.ok) {
    for (let attempt = 0; attempt < 3 && !data.success; attempt++) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      const retryRes = await fetch('/api/chains/solana/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      data = await retryRes.json();
      if (retryRes.ok && data.success) break;
    }
  }
  return data;
}

export function useSolanaDeposit() {
  const [isDepositing, setIsDepositing] = useState(false);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { getWalletAuth } = useWalletAuth();

  const deposit = useCallback(
    async (amountSol) => {
      if (!publicKey || !sendTransaction) {
        toast.error('Connect a Solana wallet first');
        return { success: false, message: 'Wallet not connected' };
      }
      if (!Number.isFinite(amountSol) || amountSol <= 0) {
        toast.error('Enter a valid SOL amount');
        return { success: false, message: 'Invalid amount' };
      }

      setIsDepositing(true);
      try {
        const wallet = publicKey.toBase58();

        if (typeof window !== 'undefined') {
          try {
            const rawPending = window.sessionStorage.getItem(PENDING_SOL_DEPOSIT_KEY);
            if (rawPending) {
              const pending = JSON.parse(rawPending);
              if (pending?.wallet === wallet && pending?.txSignature) {
                const walletAuth = await getWalletAuth(wallet, 'solana');
                const recovered = await creditSolDepositOnServer(
                  wallet,
                  pending.amountNative,
                  pending.txSignature,
                  walletAuth,
                );
                if (recovered.success) {
                  window.sessionStorage.removeItem(PENDING_SOL_DEPOSIT_KEY);
                  const credited =
                    recovered.netCreditedNative ??
                    recovered.creditedNative ??
                    recovered.balanceNative ??
                    pending.amountNative;
                  toast.success(`Deposit credited — ${Number(credited).toFixed(4)} SOL in play balance`);
                  return {
                    success: true,
                    txSignature: pending.txSignature,
                    balanceRaw: recovered.balanceRaw,
                    balanceNative: recovered.balanceNative,
                    grossNative: pending.amountNative,
                    creditedNative: credited,
                    platformFeeNative: recovered.platformFeeNative,
                    platformFeeBps: recovered.platformFeeBps,
                  };
                }
              }
            }
          } catch {
            /* ignore stale pending state */
          }
        }

        const tx = await buildSolDepositTransaction(amountSol, wallet);
        const sig = await sendTransaction(tx, connection);
        await waitForSolanaSignatureConfirmed(connection, sig);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            PENDING_SOL_DEPOSIT_KEY,
            JSON.stringify({ wallet, amountNative: amountSol, txSignature: sig }),
          );
        }

        const walletAuth = await getWalletAuth(wallet, 'solana');
        if (!walletAuth) {
          throw new Error('Sign the wallet auth message to credit your deposit.');
        }

        const data = await creditSolDepositOnServer(wallet, amountSol, sig, walletAuth);
        if (!data.success) {
          const detail = data.detail ? ` ${data.detail}` : '';
          throw new Error(`${data.error || 'Failed to credit play balance'}${detail}`);
        }

        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(PENDING_SOL_DEPOSIT_KEY);
        }

        const credited =
          data.netCreditedNative ?? data.creditedNative ?? data.balanceNative ?? amountSol;
        const fee = data.platformFeeNative;
        const feeBps = data.platformFeeBps;
        if (data.alreadyProcessed) {
          toast.success(`Deposit already credited — ${Number(credited).toFixed(4)} SOL in play balance`);
        } else if (fee != null && Number(fee) > 0) {
          toast.success(
            `Deposited ${amountSol} SOL — ${Number(credited).toFixed(4)} SOL credited (${(feeBps ?? 1000) / 100}% platform fee: ${Number(fee).toFixed(4)} SOL)`,
          );
        } else {
          toast.success(`Deposited ${amountSol} SOL — ${Number(credited).toFixed(4)} SOL credited`);
        }
        if (data.depositBonus?.rewardAptc > 0) {
          toast.info(
            `+${Number(data.depositBonus.rewardAptc).toLocaleString(undefined, { maximumFractionDigits: 4 })} APTC bonus locked for ${data.depositBonus.lockDays ?? 14} days — claim in Profile`,
            { autoClose: 8000 },
          );
        }
        return {
          success: true,
          txSignature: sig,
          balanceRaw: data.balanceRaw,
          balanceNative: data.balanceNative ?? data.balanceSol,
          grossNative: amountSol,
          creditedNative: credited,
          platformFeeNative: fee,
          platformFeeBps: feeBps,
        };
      } catch (e) {
        const msg = formatSolanaError(e);
        toast.error(msg);
        return { success: false, message: msg };
      } finally {
        setIsDepositing(false);
      }
    },
    [publicKey, sendTransaction, connection, getWalletAuth],
  );

  return { deposit, isDepositing };
}
