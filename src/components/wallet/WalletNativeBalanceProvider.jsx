'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSelector } from 'react-redux';
import { resolveActiveChain, getPlayChainConfig } from '@/lib/chains/registry';
import { DEMO_PLAY_WALLET } from '@/lib/play/demoPlay';
import { normalizeAuthWallet } from '@/lib/walletAuthMessage';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { aptosClient } from '@/lib/aptos';

/** Headroom reserved for network fees when using Max. */
export const WALLET_NATIVE_FEE_RESERVE = {
  solana: 0.01,
  aptos: 0.01,
};

const POLL_MS = 45_000;
const MIN_FETCH_GAP_MS = 5_000;

const empty = {
  balance: null,
  spendable: null,
  loading: false,
  refresh: () => {},
  feeReserve: 0.01,
  chain: null,
};

const WalletNativeBalanceContext = createContext(null);

export function WalletNativeBalanceProvider({ children }) {
  const activeChain = resolveActiveChain(useSelector((s) => s.balance.activeChain));
  const demoMode = useSelector((s) => s.balance.demoMode);
  const config = getPlayChainConfig(activeChain);
  const solana = useSolanaWallet();
  const aptos = useAptosWallet();
  const { connection } = useConnection();

  const playAddress = useMemo(() => {
    if (demoMode) return DEMO_PLAY_WALLET;
    if (config?.walletProvider === 'solana') {
      return solana.publicKey?.toBase58() || null;
    }
    if (config?.walletProvider === 'aptos') {
      const raw = aptos.account?.address ? String(aptos.account.address) : null;
      return raw ? normalizeAuthWallet(raw, 'aptos') : null;
    }
    return null;
  }, [demoMode, config?.walletProvider, solana.publicKey, aptos.account?.address]);

  const playConnected =
    !demoMode &&
    ((config?.walletProvider === 'solana' && solana.connected && !!playAddress) ||
      (config?.walletProvider === 'aptos' && aptos.connected && !!playAddress));

  const solanaAddress = solana.publicKey?.toBase58() ?? null;
  const solanaConnected = solana.connected && !!solanaAddress;

  const [playBalance, setPlayBalance] = useState(null);
  const [solanaBalance, setSolanaBalance] = useState(null);
  const [loadingPlay, setLoadingPlay] = useState(false);
  const [loadingSolana, setLoadingSolana] = useState(false);

  const lastPlayFetch = useRef(0);
  const lastSolanaFetch = useRef(0);
  const playInflight = useRef(null);
  const solanaInflight = useRef(null);

  const refreshPlay = useCallback(
    async (force = false) => {
      if (!playConnected || !playAddress) {
        setPlayBalance(null);
        setLoadingPlay(false);
        return;
      }
      const now = Date.now();
      if (!force && now - lastPlayFetch.current < MIN_FETCH_GAP_MS) return;
      if (playInflight.current) return playInflight.current;

      const task = (async () => {
        setLoadingPlay(true);
        try {
          if (config?.walletProvider === 'solana' && solana.publicKey && connection) {
            const lamports = await connection.getBalance(solana.publicKey, 'confirmed');
            const bal = lamports / LAMPORTS_PER_SOL;
            setPlayBalance(bal);
            if (playAddress === solanaAddress) setSolanaBalance(bal);
            lastPlayFetch.current = Date.now();
            if (playAddress === solanaAddress) lastSolanaFetch.current = Date.now();
            return;
          }
          if (config?.walletProvider === 'aptos') {
            const octas = await aptosClient.getAccountAPTAmount({ accountAddress: playAddress });
            setPlayBalance(Number(octas) / 1e8);
            lastPlayFetch.current = Date.now();
            return;
          }
          setPlayBalance(null);
        } catch {
          setPlayBalance(null);
        } finally {
          setLoadingPlay(false);
          playInflight.current = null;
        }
      })();
      playInflight.current = task;
      return task;
    },
    [playConnected, playAddress, solanaAddress, config?.walletProvider, solana.publicKey, connection],
  );

  const refreshSolana = useCallback(
    async (force = false) => {
      if (!solanaConnected || !solana.publicKey || !connection) {
        setSolanaBalance(null);
        setLoadingSolana(false);
        return;
      }
      if (playConnected && playAddress === solanaAddress && config?.walletProvider === 'solana') {
        return refreshPlay(force);
      }
      const now = Date.now();
      if (!force && now - lastSolanaFetch.current < MIN_FETCH_GAP_MS) return;
      if (solanaInflight.current) return solanaInflight.current;

      const task = (async () => {
        setLoadingSolana(true);
        try {
          const lamports = await connection.getBalance(solana.publicKey, 'confirmed');
          setSolanaBalance(lamports / LAMPORTS_PER_SOL);
          lastSolanaFetch.current = Date.now();
        } catch {
          setSolanaBalance(null);
        } finally {
          setLoadingSolana(false);
          solanaInflight.current = null;
        }
      })();
      solanaInflight.current = task;
      return task;
    },
    [
      solanaConnected,
      solana.publicKey,
      connection,
      playConnected,
      playAddress,
      solanaAddress,
      config?.walletProvider,
      refreshPlay,
    ],
  );

  const refreshPlayRef = useRef(() => {});
  const refreshSolanaRef = useRef(() => {});
  const refreshAllRef = useRef(() => {});
  refreshPlayRef.current = (force = false) => refreshPlay(force);
  refreshSolanaRef.current = (force = false) => refreshSolana(force);
  refreshAllRef.current = (force = false) => {
    void refreshPlay(force);
    if (!(playConnected && playAddress === solanaAddress && config?.walletProvider === 'solana')) {
      void refreshSolana(force);
    }
  };

  useEffect(() => {
    refreshAllRef.current(true);
    const t = setInterval(() => refreshAllRef.current(true), POLL_MS);
    return () => clearInterval(t);
  }, [playConnected, playAddress, solanaConnected, solanaAddress, activeChain, config?.walletProvider]);

  const playFeeReserve = WALLET_NATIVE_FEE_RESERVE[activeChain] ?? 0.01;
  const playSpendable =
    playBalance != null ? Math.max(0, playBalance - playFeeReserve) : null;
  const solFeeReserve = WALLET_NATIVE_FEE_RESERVE.solana;
  const solSpendable =
    solanaBalance != null ? Math.max(0, solanaBalance - solFeeReserve) : null;

  const value = useMemo(
    () => ({
      chain: activeChain,
      play: {
        balance: playBalance,
        spendable: playSpendable,
        loading: loadingPlay,
        feeReserve: playFeeReserve,
        refresh: () => refreshPlayRef.current(true),
      },
      solana: {
        balance: solanaBalance,
        spendable: solSpendable,
        loading: loadingSolana,
        feeReserve: solFeeReserve,
        refresh: () => refreshSolanaRef.current(true),
      },
      refreshAll: () => refreshAllRef.current(true),
    }),
    [
      activeChain,
      playBalance,
      playSpendable,
      loadingPlay,
      playFeeReserve,
      solanaBalance,
      solSpendable,
      loadingSolana,
      solFeeReserve,
    ],
  );

  return (
    <WalletNativeBalanceContext.Provider value={value}>
      {children}
    </WalletNativeBalanceContext.Provider>
  );
}

export function useWalletNativeBalance(playChain, { enabled = true } = {}) {
  const ctx = useContext(WalletNativeBalanceContext);
  if (!ctx || !enabled) {
    return {
      balance: null,
      spendable: null,
      loading: false,
      refresh: () => {},
      feeReserve: WALLET_NATIVE_FEE_RESERVE[playChain] ?? 0.01,
    };
  }
  if (playChain !== ctx.chain) {
    return {
      balance: null,
      spendable: null,
      loading: false,
      refresh: ctx.refreshAll,
      feeReserve: WALLET_NATIVE_FEE_RESERVE[playChain] ?? 0.01,
    };
  }
  return {
    balance: ctx.play.balance,
    spendable: ctx.play.spendable,
    loading: ctx.play.loading,
    refresh: ctx.play.refresh,
    feeReserve: ctx.play.feeReserve,
  };
}

/** Solana wallet native balance (IPO swap) — independent of active play chain. */
export function useWalletSolBalance({ enabled = true } = {}) {
  const ctx = useContext(WalletNativeBalanceContext);
  if (!ctx || !enabled) {
    return {
      balance: null,
      spendable: null,
      loading: false,
      refresh: () => {},
      feeReserve: WALLET_NATIVE_FEE_RESERVE.solana,
    };
  }
  return {
    balance: ctx.solana.balance,
    spendable: ctx.solana.spendable,
    loading: ctx.solana.loading,
    refresh: ctx.solana.refresh,
    feeReserve: ctx.solana.feeReserve,
  };
}

/** @deprecated use WALLET_NATIVE_FEE_RESERVE.solana */
export const IPO_SOL_FEE_RESERVE = WALLET_NATIVE_FEE_RESERVE.solana;

export { empty as walletNativeBalanceEmpty };
