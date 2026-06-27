"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useSelector, useDispatch } from 'react-redux';
import { setBalance, setLoading, setDemoMode, refillDemoBalance } from '@/store/balanceSlice';
import { demoStartNativeAmount } from '@/lib/play/demoPlay';
import { toast } from 'react-toastify';
import PlayWalletConnect from "./wallet/PlayWalletConnect";
import HouseBalanceModal from "./wallet/HouseBalanceModal";
import HeroAnnouncementsMarquee from './HeroAnnouncementsMarquee';
import dynamic from 'next/dynamic';

const LiveChat = dynamic(() => import('./LiveChat'), { ssr: false });

import { useNotification } from './NotificationSystem';
import { UserBalanceSystem } from '@/lib/aptos';
import { usePlayDeposit } from '@/hooks/usePlayDeposit';
import { recoverPendingAptDeposit } from '@/hooks/useBackendDeposit';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { DEFAULT_PLAY_CHAIN, getPlayChainConfig, rawToDisplay, displayToRaw } from '@/lib/chains/registry';
import { fetchPlayBalance, postPlayWithdraw } from '@/lib/play/clientApi';
import { OPEN_BALANCE_MODAL_EVENT } from '@/hooks/useWalletStatus';
import { LITEPAPER_PATH } from '@/lib/siteMetadata';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userAddress, setUserAddress] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notification = useNotification();
  const isDev = process.env.NODE_ENV === 'development';
  const dispatch = useDispatch();
  const { userBalance, isLoading: isLoadingBalance, demoMode, activeChain } = useSelector((state) => state.balance);
  const playChain = activeChain || DEFAULT_PLAY_CHAIN;
  const playConfig = getPlayChainConfig(playChain);
  const playSymbol = playConfig?.nativeSymbol ?? 'SOL';

  // Aptos wallet (must be before usePlayDeposit — it passes signAndSubmitTransaction)
  const { connected: isConnected, account, signAndSubmitTransaction, wallet, disconnect: disconnectAptos } = useWallet();
  const { disconnect: disconnectSolana } = useSolanaWallet();
  const playWallet = usePlayWallet();
  const { deposit: playDeposit, isDepositing: isPlayDepositing } = usePlayDeposit({
    signAndSubmitTransaction,
  });
  const [walletNetworkName, setWalletNetworkName] = useState("");

  // User balance management
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const address = account?.address;
  const isWalletReady = isConnected && account && signAndSubmitTransaction;
  const isPlayWalletReady = playWallet.connected;
  const formatPlayBalance = () => rawToDisplay(userBalance, playChain).toFixed(3);

  const handleRefillDemo = () => {
    dispatch(refillDemoBalance());
    toast.success(`Demo balance refilled to ${demoStartNativeAmount()} ${playSymbol}`);
  };

  const handleMobileDisconnect = async () => {
    setShowMobileMenu(false);
    try { await disconnectSolana(); } catch { /* ignore */ }
    try { await disconnectAptos(); } catch { /* ignore */ }
  };

  const toggleDemoMode = () => {
    const next = !demoMode;
    dispatch(setDemoMode(next));
    if (next) {
      toast.success(`Demo mode enabled — ${demoStartNativeAmount()} ${playSymbol} play credits`);
    }
  };

  const loadServerPlayBalance = async (wallet, chainId) => {
    if (!wallet || demoMode) return;
    try {
      dispatch(setLoading(true));
      const result = await fetchPlayBalance(chainId, wallet);
      if (result.ok && result.balanceRaw != null) {
        dispatch(setBalance(String(result.balanceRaw)));
      }
    } catch (e) {
      console.error(`${chainId} balance load failed:`, e);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Load user balance from house account
  const loadUserBalance = async () => {
    if (!address || demoMode) return;

    try {
      dispatch(setLoading(true));
      const balance = await UserBalanceSystem.getBalance(address);
      dispatch(setBalance(balance));
    } catch (error) {
      console.error('Error loading user balance:', error);
      dispatch(setBalance("0"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Track unique wallet for the "Total Players" stat (best-effort, no PII).
  useEffect(() => {
    if (demoMode) return;
    if (!playWallet.address) return;
    fetch('/api/players/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: playWallet.address, chain: playChain }),
    }).catch(() => {});
  }, [demoMode, playChain, playWallet.address]);

  // Load balance when wallet connects (server-ledger chains sync globally via useServerBalanceSync)
  useEffect(() => {
    if (demoMode) return;
    if (playConfig?.balanceMode === 'server') return;
    if (playConfig?.walletProvider === 'aptos' && isWalletReady && address) {
      loadUserBalance();
    }
  }, [isWalletReady, address, demoMode, playChain, playConfig?.balanceMode, playConfig?.walletProvider]);

  // Recover a prior Aptos deposit if on-chain tx succeeded but server credit lagged.
  useEffect(() => {
    if (!showBalanceModal || demoMode || playChain !== 'aptos' || !playWallet.address) return;
    let cancelled = false;
    (async () => {
      const result = await recoverPendingAptDeposit(playWallet.address);
      if (cancelled || !result?.success) return;
      if (result.balanceRaw != null) {
        dispatch(setBalance(String(result.balanceRaw)));
      } else if (result.netCreditedOctas != null) {
        const currentBalance = BigInt(String(userBalance || '0'));
        dispatch(setBalance((currentBalance + BigInt(String(result.netCreditedOctas))).toString()));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showBalanceModal, demoMode, playChain, playWallet.address, dispatch, userBalance]);

  // Check if wallet was previously connected on page load
  useEffect(() => {
    const checkWalletConnection = async () => {
      // Check if Aptos wallet is connected
      if (isConnected && account) {
        console.log('Wallet already connected on page load');
        // The wallet adapter automatically handles reconnection
      }
    };

    checkWalletConnection();
  }, []);

  useEffect(() => {
    setIsClient(true);

    // Aptos wallet integration - simplified for mainnet only
    // In development mode, use mock data
    if (isDev) {
      setUserAddress('0x1234...dev');
    }
  }, [isDev]);

  useEffect(() => {
    const onOpenBalance = () => setShowBalanceModal(true);
    window.addEventListener(OPEN_BALANCE_MODAL_EVENT, onOpenBalance);
    return () => window.removeEventListener(OPEN_BALANCE_MODAL_EVENT, onOpenBalance);
  }, []);

  // Mobile menu: lock body scroll and close on Escape
  useEffect(() => {
    if (!showMobileMenu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowMobileMenu(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showMobileMenu]);

  // Poll for balance changes
  const pollForBalance = async (initialBalance, attempts = 10, interval = 2000) => {
    dispatch(setLoading(true));
    for (let i = 0; i < attempts; i++) {
      try {
        const newBalance = await UserBalanceSystem.getBalance(address);
        if (newBalance !== initialBalance) {
          dispatch(setBalance(newBalance));
          notification.success('Balance updated successfully!');
          dispatch(setLoading(false));
          return;
        }
      } catch (error) {
        console.error(`Polling attempt ${i + 1} failed:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    notification.error('Balance update timed out. Please refresh manually.');
    dispatch(setLoading(false));
  };

  const applyBalanceAfterWithdraw = (amountNative) => {
    const balanceNative = rawToDisplay(userBalance, playChain);
    const withdrawn = Math.min(amountNative, balanceNative);
    const remainingRaw = Math.max(0, Number(userBalance || '0') - displayToRaw(withdrawn, playChain));
    dispatch(setBalance(String(remainingRaw)));
    return withdrawn;
  };

  // Handle withdraw from house account (partial or full via withdrawAmount)
  const handleWithdraw = async (amountOverride) => {
    if (!isPlayWalletReady) {
      notification.error('Please connect your wallet first');
      return;
    }

    const requested =
      amountOverride != null ? Number(amountOverride) : parseFloat(withdrawAmount);
    if (!Number.isFinite(requested) || requested <= 0) {
      notification.error('Please enter a valid withdrawal amount');
      return;
    }

    try {
      setIsWithdrawing(true);
      const balanceNative = rawToDisplay(userBalance, playChain);
      if (balanceNative <= 0) {
        notification.error('No balance to withdraw');
        return;
      }

      const amountNative = Math.min(requested, balanceNative);

      if (demoMode) {
        const withdrawn = applyBalanceAfterWithdraw(amountNative);
        notification.success(
          `Demo mode: withdrew ${withdrawn.toFixed(4)} ${playSymbol} to your wallet.`,
        );
        if (balanceNative - withdrawn <= 1e-9) {
          setShowBalanceModal(false);
        }
        return;
      }

      if (playConfig?.balanceMode === 'server') {
        const result = await postPlayWithdraw(playChain, {
          wallet: playWallet.address,
          amountNative,
        });
        if (!result.ok) throw new Error(result.error || 'Withdrawal failed');

        if (result.pendingApproval) {
          if (result.balanceRaw != null) {
            dispatch(setBalance(String(result.balanceRaw)));
          } else {
            applyBalanceAfterWithdraw(amountNative);
          }
          notification.success(
            result.message ||
              'Withdrawal is queued for manual approval (over $50 USD). Payout runs after ops review.',
          );
          setShowBalanceModal(false);
          return;
        }

        if (result.balanceRaw != null) {
          dispatch(setBalance(String(result.balanceRaw)));
        } else {
          applyBalanceAfterWithdraw(amountNative);
        }
        notification.success(
          `Withdrew ${amountNative.toFixed(4)} ${playSymbol}. TX: ${String(result.txSignature || '').slice(0, 12)}…`,
        );
        if (Number(result.balanceRaw || 0) <= 0) {
          setShowBalanceModal(false);
        }
        return;
      }

      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: account.address,
          wallet: account.address,
          amount: amountNative,
          amountNative,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      if (result.pendingApproval) {
        applyBalanceAfterWithdraw(amountNative);
        notification.success(
          result.message ||
            'Withdrawal is queued for manual approval (large USD value). Your on-chain payout will execute after review.',
        );
        setShowBalanceModal(false);
        return;
      }

      applyBalanceAfterWithdraw(amountNative);

      const txHash = result.transactionHash || result.userTxHash || result.txnHash || 'N/A';
      const txDisplay = typeof txHash === 'string' && txHash.length > 8
        ? `${txHash.slice(0, 8)}...`
        : txHash;
      notification.success(`Withdrew ${amountNative.toFixed(4)} ${playSymbol}! TX: ${txDisplay}`);

      if (balanceNative - amountNative <= 1e-9) {
        setShowBalanceModal(false);
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      notification.error(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawAll = () => {
    const balanceNative = rawToDisplay(userBalance, playChain);
    setWithdrawAmount(balanceNative > 0 ? String(balanceNative) : '');
    handleWithdraw(balanceNative);
  };

  // Handle deposit to house balance

  // Handle deposit to house balance using backend hook
  const handleDeposit = async () => {
    if (!isPlayWalletReady) {
      notification.error('Please connect your wallet first');
      return;
    }

    if (demoMode) {
      notification.error('Turn off Demo mode to deposit real funds. Use Refill for demo credits.');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      notification.error('Please enter a valid deposit amount');
      return;
    }

    setIsDepositing(true);
    try {
      const result = await playDeposit(amount);

      if (result.success) {
        if (result.balanceRaw != null && result.balanceRaw !== '') {
          dispatch(setBalance(String(result.balanceRaw)));
        } else if (result.netCreditedOctas != null) {
          const currentBalance = BigInt(String(userBalance || '0'));
          const netOct = BigInt(String(result.netCreditedOctas));
          dispatch(setBalance((currentBalance + netOct).toString()));
        }
        if (playConfig?.balanceMode === 'server' && playWallet.address) {
          await loadServerPlayBalance(playWallet.address, playChain);
        }
        setDepositAmount('');
      } else {
        throw new Error(result.message || 'Deposit failed');
      }
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsDepositing(false);
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Litepaper", path: LITEPAPER_PATH },
    { name: "Games", path: "/game" },
    { name: "Live", path: "/live" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Volume Cup", path: "/competition" },
    { name: "Referrals", path: "/referral" },
    { name: "Stake", path: "/stake" },
    { name: "OTC Lottery", path: "/otc-lottery" },
    { name: "Profile", path: "/profile" },
  ];

  // Detect Aptos wallet network (best-effort)
  useEffect(() => {
    const readNetwork = async () => {
      try {
        if (typeof window !== 'undefined' && window.aptos?.network) {
          const n = await window.aptos.network();
          if (n?.name) setWalletNetworkName(String(n.name).toLowerCase());
        }
      } catch { }
    };
    readNetwork();
    const off = window?.aptos?.onNetworkChange?.((n) => {
      try { setWalletNetworkName(String(n?.name || '').toLowerCase()); } catch { }
    });
    return () => {
      try { off && off(); } catch { }
    };
  }, []);

  return (
    <nav className="site-header fixed w-full z-20 border-b border-white/5 bg-[#070005]">
      <div className="flex w-full items-center justify-between gap-4 py-4 px-5 sm:px-8 lg:px-10 max-w-[1600px] mx-auto min-h-[4.25rem]">
        <div className="flex items-center gap-4 min-w-0">
          <a href="/" className="logo shrink-0 max-w-[150px] sm:max-w-none">
            <Image
              src="/PowerPlay.png"
              alt="powerplay image"
              width={200}
              height={18}
              className="h-auto w-full max-w-[150px] sm:max-w-[200px]"
            />
          </a>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-white p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle mobile menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showMobileMenu ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>

        <div className="hidden lg:flex flex-1 justify-center min-w-0 mx-2">
          <div className="flex items-center gap-4 xl:gap-5 overflow-x-auto scrollbar-hide max-w-full px-2 font-display">
            {navLinks.map(({ name, path }) => (
              <Link
                key={path}
                href={path}
                className={`py-1 text-sm xl:text-base font-medium transition-colors whitespace-nowrap shrink-0 ${
                  path === pathname
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-magic to-blue-magic font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop demo toggle — small pill, xl+ only */}
          <button
            type="button"
            onClick={toggleDemoMode}
            className={`hidden xl:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-full border transition-colors ${
              demoMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
            }`}
          >
            <span className={`inline-flex h-1.5 w-1.5 rounded-full ${demoMode ? 'bg-amber-400' : 'bg-white/25'}`} />
            {demoMode ? 'Demo on' : 'Demo'}
          </button>

          <div className="md:hidden">
            <PlayWalletConnect
              layout="compact"
              onManageBalance={() => setShowBalanceModal(true)}
              balanceFormatted={formatPlayBalance()}
              balanceSymbol={playSymbol}
              isLoadingBalance={isLoadingBalance}
            />
          </div>

          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Live chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          <div className="hidden md:block">
            <PlayWalletConnect
              onManageBalance={() => setShowBalanceModal(true)}
              balanceFormatted={formatPlayBalance()}
              balanceSymbol={playSymbol}
              isLoadingBalance={isLoadingBalance}
            />
          </div>
        </div>
      </div>
      {chatOpen && (
        <LiveChat open={chatOpen} onClose={() => setChatOpen(false)} />
      )}

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div
          className="lg:hidden border-t border-purple-500/20 bg-[#0A0008]/98 backdrop-blur-md"
          role="dialog"
          aria-label="Navigation menu"
        >
          <div className="max-h-[min(75dvh,calc(100dvh-4.5rem))] overflow-y-auto overscroll-y-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-1">
            {navLinks.map(({ name, path }) => (
              <Link
                key={path}
                href={path}
                onClick={() => setShowMobileMenu(false)}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-base transition-colors ${
                  path === pathname
                    ? 'bg-white/10 font-semibold text-white'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                {name}
              </Link>
            ))}
          </div>

            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              <div className="md:hidden">
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Wallet</p>
                <PlayWalletConnect
                  layout="sheet"
                  onManageBalance={() => {
                    setShowBalanceModal(true);
                    setShowMobileMenu(false);
                  }}
                  balanceFormatted={formatPlayBalance()}
                  balanceSymbol={playSymbol}
                  isLoadingBalance={isLoadingBalance}
                />
              </div>
              {/* Demo mode toggle — always visible in mobile menu */}
              <button
                type="button"
                onClick={() => { dispatch(setDemoMode(!demoMode)); setShowMobileMenu(false); }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  demoMode
                    ? 'border-amber-500/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/18'
                    : 'border-white/10 bg-white/[0.04] text-white/55 hover:text-white/80 hover:bg-white/[0.07]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`inline-flex h-2 w-2 rounded-full shrink-0 ${demoMode ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]' : 'bg-white/20'}`} />
                  {demoMode ? 'Demo mode on' : 'Try demo mode'}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${demoMode ? 'text-amber-400/80' : 'text-white/30'}`}>
                  {demoMode ? 'Tap to exit' : 'Free play'}
                </span>
              </button>
              {/* Disconnect — always visible in mobile menu when connected */}
              {playWallet.connected && !demoMode && (
                <button
                  type="button"
                  onClick={handleMobileDisconnect}
                  className="flex w-full items-center gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 transition-colors"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <HouseBalanceModal
        open={isClient && showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        playChain={playChain}
        playSymbol={playSymbol}
        balanceLabel={formatPlayBalance()}
        isLoadingBalance={isLoadingBalance}
        depositAmount={depositAmount}
        onDepositAmountChange={setDepositAmount}
        withdrawAmount={withdrawAmount}
        onWithdrawAmountChange={setWithdrawAmount}
        balanceNative={rawToDisplay(userBalance, playChain)}
        onDeposit={handleDeposit}
        onWithdraw={() => handleWithdraw()}
        onWithdrawAll={handleWithdrawAll}
        onRefresh={() => {
          if (playConfig?.balanceMode === 'server' && playWallet.address) {
            loadServerPlayBalance(playWallet.address, playChain);
            return;
          }
          if (address) {
            loadUserBalance();
          }
        }}
        isDepositing={isDepositing}
        isPlayDepositing={isPlayDepositing}
        isWithdrawing={isWithdrawing}
        canWithdraw={parseFloat(userBalance || '0') > 0}
        isPlayWalletReady={isPlayWalletReady}
        demoMode={demoMode}
        onRefillDemo={demoMode ? handleRefillDemo : undefined}
      />

      <HeroAnnouncementsMarquee />

      <div className="w-full h-[2px] magic-gradient overflow-hidden"></div>
    </nav>
  );
}