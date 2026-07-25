'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { setUserActiveChain, setBalance } from '@/store/balanceSlice';
import { PLAY_CHAINS } from '@/lib/chains/registry';
import { CHAIN_UI } from '@/lib/chains/chainUi';
import { isBenignAptosWalletError } from '@/lib/wallet/aptosWalletErrors';

export default function ChainConnectModal({ open, onClose }) {
  const dispatch = useDispatch();
  const [view, setView] = useState('chains');
  const [mounted, setMounted] = useState(false);
  const { wallets: aptosWallets, connect: connectAptos } = useAptosWallet();
  const { disconnect: disconnectSolana } = useSolanaWallet();
  const { disconnect: disconnectAptos } = useAptosWallet();
  const { setVisible: setSolanaModalVisible } = useWalletModal();

  const chains = [...PLAY_CHAINS].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const disconnectAll = async () => {
    try {
      await disconnectSolana();
    } catch {
      /* ignore */
    }
    try {
      await disconnectAptos();
    } catch {
      /* ignore */
    }
  };

  const selectChain = async (chainId) => {
    const chain = chains.find((c) => c.id === chainId);
    if (!chain || chain.status !== 'live') return;

    await disconnectAll();
    dispatch(setUserActiveChain(chainId));
    dispatch(setBalance('0'));

    if (chainId === 'solana') {
      onClose();
      setView('chains');
      setTimeout(() => setSolanaModalVisible(true), 120);
      return;
    }

    if (chainId === 'aptos') {
      setView('aptos');
    }
  };

  const handleAptosWallet = async (walletName) => {
    try {
      await connectAptos(walletName);
      onClose();
      setView('chains');
    } catch (err) {
      const msg = String(err?.message || err || '');
      if (msg.includes('already connected') || isBenignAptosWalletError(err)) {
        onClose();
        setView('chains');
      }
    }
  };

  const handleClose = () => {
    onClose();
    setView('chains');
  };

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chain-connect-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-[1] flex w-full max-w-md max-h-[min(90vh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-transparent p-5 sm:p-6">
              <div>
                <h2
                  id="chain-connect-title"
                  className="text-lg font-bold tracking-tight text-white sm:text-xl"
                >
                  {view === 'aptos' ? 'Select Aptos Wallet' : 'Connect Wallet'}
                </h2>
                <p className="mt-1 text-[11px] text-gray-400 sm:text-sm">
                  {view === 'aptos'
                    ? 'Aptos Mainnet'
                    : 'Solana & Aptos live · Robinhood under construction'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {view === 'aptos' && (
                  <button
                    type="button"
                    onClick={() => setView('chains')}
                    className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-gray-500 hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 sm:space-y-3 sm:p-6">
              {view === 'chains' ? (
                chains.map((chain) => {
                  const ui = CHAIN_UI[chain.id] || CHAIN_UI.solana;
                  const live = chain.status === 'live';
                  const badgeLabel = live
                    ? chain.nativeSymbol || ui.badge
                    : ui.badge || 'Soon';
                  const badgeClass = live
                    ? ui.badgeClass
                    : ui.badgeClass || 'bg-blue-500/20 text-blue-400';
                  return (
                    <button
                      key={chain.id}
                      type="button"
                      disabled={!live}
                      onClick={() => selectChain(chain.id)}
                      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all sm:gap-4 sm:p-4 ${
                        live
                          ? 'cursor-pointer border-white/10 bg-white/5 hover:bg-white/10'
                          : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50'
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${ui.hoverGradient} opacity-0 transition-opacity group-hover:opacity-100`}
                      />
                      <Image
                        src={ui.logo}
                        alt={chain.label}
                        width={48}
                        height={48}
                        className="relative z-10 h-10 w-10 shrink-0 object-contain transition-transform group-hover:scale-105 sm:h-12 sm:w-12"
                      />
                      <div className="relative z-10 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white sm:text-base">{chain.label}</span>
                          {badgeLabel && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider sm:text-[10px] ${badgeClass}`}
                            >
                              {badgeLabel}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-gray-400 sm:text-xs">{ui.walletHint}</p>
                      </div>
                      {live ? (
                        <svg
                          className="relative z-10 h-4 w-4 shrink-0 text-gray-600 group-hover:text-white/70 sm:h-5 sm:w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="space-y-2">
                  {aptosWallets?.length ? (
                    aptosWallets.map((w) => (
                      <button
                        key={w.name}
                        type="button"
                        onClick={() => handleAptosWallet(w.name)}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10 sm:p-4"
                      >
                        {w.icon && (
                          <Image src={w.icon} alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
                        )}
                        <span className="text-sm font-medium text-white">{w.name}</span>
                      </button>
                    ))
                  ) : (
                    <p className="py-4 text-center text-sm text-gray-400">
                      No Aptos wallets detected in your browser.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
