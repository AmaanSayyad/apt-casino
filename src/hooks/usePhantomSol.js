'use client';

import { useCallback, useEffect, useState } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

const RPC =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    : 'https://api.mainnet-beta.solana.com';

export function usePhantomSol() {
  const [publicKey, setPublicKey] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.phantom?.solana ?? null;
  }, []);

  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const onConnect = (pk) => {
      const key = pk?.toString?.() || provider.publicKey?.toString?.();
      if (key) setPublicKey(key);
    };
    const onDisconnect = () => setPublicKey(null);

    if (provider.publicKey) {
      setPublicKey(provider.publicKey.toString());
    }

    provider.on?.('connect', onConnect);
    provider.on?.('disconnect', onDisconnect);

    return () => {
      provider.off?.('connect', onConnect);
      provider.off?.('disconnect', onDisconnect);
    };
  }, [getProvider]);

  const connect = useCallback(async () => {
    setError(null);
    const provider = getProvider();
    if (!provider) {
      setError('Phantom wallet not found. Install Phantom or open this page in Phantom browser.');
      return null;
    }
    setConnecting(true);
    try {
      const resp = await provider.connect();
      const key = resp?.publicKey?.toString?.() || provider.publicKey?.toString?.();
      setPublicKey(key || null);
      return key;
    } catch (e) {
      setError(e?.message || 'Failed to connect Phantom');
      return null;
    } finally {
      setConnecting(false);
    }
  }, [getProvider]);

  const disconnect = useCallback(async () => {
    const provider = getProvider();
    try {
      await provider?.disconnect?.();
    } catch {
      /* ignore */
    }
    setPublicKey(null);
  }, [getProvider]);

  /** Send SOL to treasury; returns { signature, solAmount, sender } */
  const sendSol = useCallback(
    async (treasuryAddress, solAmount) => {
      setError(null);
      const provider = getProvider();
      if (!provider?.publicKey) {
        throw new Error('Connect Phantom first');
      }
      if (!treasuryAddress) {
        throw new Error('Treasury address not configured');
      }
      const amount = Number(solAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Enter a valid SOL amount');
      }

      setSending(true);
      try {
        const connection = new Connection(RPC, 'confirmed');
        const from = new PublicKey(provider.publicKey.toString());
        const to = new PublicKey(treasuryAddress);
        const lamports = Math.round(amount * LAMPORTS_PER_SOL);

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        const transaction = new Transaction({
          feePayer: from,
          blockhash,
          lastValidBlockHeight,
        }).add(
          SystemProgram.transfer({
            fromPubkey: from,
            toPubkey: to,
            lamports,
          }),
        );

        const { signature } = await provider.signAndSendTransaction(transaction);
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

        return {
          signature,
          solAmount: amount,
          sender: from.toString(),
        };
      } catch (e) {
        const msg = e?.message || 'Transaction failed';
        setError(msg);
        throw new Error(msg);
      } finally {
        setSending(false);
      }
    },
    [getProvider],
  );

  return {
    publicKey,
    connecting,
    sending,
    error,
    hasPhantom: typeof window !== 'undefined' && Boolean(window.phantom?.solana),
    connect,
    disconnect,
    sendSol,
    setError,
  };
}
