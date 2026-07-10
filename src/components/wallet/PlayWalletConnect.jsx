'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import { refillDemoBalance } from '@/store/balanceSlice';
import { demoStartNativeAmount } from '@/lib/play/demoPlay';
import { getPlayChainConfig } from '@/lib/chains/registry';
import { CHAIN_UI } from '@/lib/chains/chainUi';
import { explorerAddressUrl, solanaExplorerAddressUrl } from '@/lib/chains/explorer';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { useWalletNativeBalance } from '@/hooks/useWalletSolBalance';
import PlayerAvatar from '@/components/PlayerAvatar';
import ChainConnectModal from './ChainConnectModal';

function shorten(addr) {
  if (!addr || addr.length < 10) return addr || '…';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function walletExplorerHref(chain, address) {
  if (!address) return null;
  return chain === 'solana' ? solanaExplorerAddressUrl(address) : explorerAddressUrl(chain, address);
}

/**
 * @param {'dropdown' | 'sheet' | 'compact'} layout
 * — `sheet` = full-width inline panel (mobile nav)
 * — `compact` = icon button in mobile header (left of chat)
 */
export default function PlayWalletConnect({
  onManageBalance,
  balanceFormatted,
  balanceSymbol,
  isLoadingBalance,
  layout = 'dropdown',
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const dispatch = useDispatch();
  const play = usePlayWallet();
  const { disconnect: disconnectSolana } = useSolanaWallet();
  const { disconnect: disconnectAptos } = useAptosWallet();
  const config = getPlayChainConfig(play.chain);
  const ui = CHAIN_UI[play.chain];
  const playerProfile = usePlayerProfile();
  const symbol = balanceSymbol ?? config?.nativeSymbol ?? play.chain;
  const houseBalanceText = isLoadingBalance ? '…' : (balanceFormatted ?? '0.000');
  const {
    balance: walletNativeBalance,
    loading: walletBalanceLoading,
    refresh: refreshWalletBalance,
  } = useWalletNativeBalance(play.chain, { enabled: play.connected && !play.isDemo });
  const walletBalanceText =
    play.isDemo || !play.connected
      ? null
      : walletBalanceLoading && walletNativeBalance == null
        ? '…'
        : walletNativeBalance != null
          ? walletNativeBalance.toFixed(4)
          : '—';
  const primaryBalanceText = play.isDemo ? houseBalanceText : walletBalanceText ?? houseBalanceText;
  const secondaryLine = play.isDemo
    ? playerProfile.hasX
      ? playerProfile.displayName
      : shorten(play.address)
    : `Play · ${houseBalanceText}`;
  const isSheet = layout === 'sheet';
  const isCompact = layout === 'compact';
  const explorerHref = walletExplorerHref(play.chain, play.address);

  useEffect(() => {
    if (!menuOpen || isSheet) return;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, isSheet]);

  const handleDisconnect = async () => {
    setMenuOpen(false);
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

  const handleRefillDemo = () => {
    dispatch(refillDemoBalance());
    setMenuOpen(false);
    const amount = demoStartNativeAmount();
    toast.success(`Demo balance refilled to ${amount} ${symbol}`);
  };

  if (!play.connected) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={
            isSheet
              ? 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors'
              : isCompact
                ? 'p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors'
                : 'px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest border border-white/10 transition-all active:scale-95 whitespace-nowrap'
          }
          aria-label="Connect wallet"
          title="Connect wallet"
        >
          {isCompact ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
            </svg>
          ) : (
            'Connect wallet'
          )}
        </button>
        <ChainConnectModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const triggerClass = isSheet
    ? 'flex w-full items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-3 py-3 text-left transition-colors hover:border-violet-500/30'
    : isCompact
      ? 'relative flex items-center justify-center p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors'
      : 'flex max-w-[min(100%,11rem)] sm:max-w-[13.5rem] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 hover:bg-white/10 transition-colors';

  const menuPanel = (
    <div
      role="menu"
      className={
        isSheet
          ? 'mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#12000e] shadow-lg shadow-black/40'
          : 'absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[12.5rem] overflow-hidden rounded-xl border border-white/10 bg-[#0A0008] py-1 shadow-xl shadow-black/50'
      }
    >
      <div className={`flex items-center justify-between gap-2 border-b border-white/10 ${isSheet ? 'px-4 py-3' : 'px-3 py-2'}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Connected</p>
          {playerProfile.displayName && playerProfile.displayName !== shorten(play.address) ? (
            <p className="mt-0.5 truncate text-xs font-semibold text-white">{playerProfile.displayName}</p>
          ) : null}
          {explorerHref ? (
            <a
              href={explorerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate font-mono text-xs text-cyan-400/90 hover:text-cyan-300 hover:underline"
              title={play.address}
              onClick={() => setMenuOpen(false)}
            >
              {shorten(play.address)} ↗
            </a>
          ) : (
            <p className="mt-0.5 truncate font-mono text-xs text-white/55" title={play.address}>
              {shorten(play.address)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {!play.isDemo ? (
            <span className="rounded-lg bg-white/[0.06] px-2 py-1 font-mono text-[10px] tabular-nums text-white/75">
              Wallet {walletBalanceText} {symbol}
            </span>
          ) : null}
          <span className="rounded-lg bg-emerald-500/10 px-2 py-1 font-mono text-xs tabular-nums text-emerald-300">
            {play.isDemo ? `${symbol} ${houseBalanceText}` : `Play ${houseBalanceText} ${symbol}`}
          </span>
        </div>
      </div>

      {onManageBalance && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setMenuOpen(false);
            onManageBalance();
          }}
          className={
            isSheet
              ? 'flex w-full items-center justify-between gap-2 border-b border-white/10 px-4 py-3.5 text-left text-sm font-semibold text-white hover:bg-violet-500/10 transition-colors'
              : 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white/90 hover:bg-white/5 transition-colors'
          }
        >
          <span>Manage balance</span>
          <span className="text-white/35" aria-hidden>
            →
          </span>
        </button>
      )}

      {play.isDemo && (
        <button
          type="button"
          role="menuitem"
          onClick={handleRefillDemo}
          className={
            isSheet
              ? 'flex w-full items-center justify-between gap-2 border-b border-white/10 px-4 py-3.5 text-left text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 transition-colors'
              : 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-emerald-300 hover:bg-emerald-500/10 transition-colors'
          }
        >
          <span>Refill demo balance</span>
          <span className="font-mono text-[11px] text-emerald-400/80">
            {demoStartNativeAmount()} {symbol}
          </span>
        </button>
      )}

      <button
        type="button"
        role="menuitem"
        onClick={handleDisconnect}
        className={
          isSheet
            ? 'flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10 transition-colors'
            : 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors'
        }
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Disconnect
      </button>
    </div>
  );

  return (
    <>
      <div className={isSheet ? 'w-full' : 'relative'} ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={triggerClass}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={isCompact ? `Wallet · ${symbol} ${primaryBalanceText}` : undefined}
          title={
            play.isDemo
              ? `${symbol} ${houseBalanceText} · ${play.address}`
              : `Wallet ${walletBalanceText} ${symbol} · Play ${houseBalanceText} ${symbol} · ${play.address}`
          }
        >
          <div className={`relative shrink-0 ${isSheet ? 'h-9 w-9' : isCompact ? 'h-5 w-5' : 'h-5 w-5'}`}>
            {playerProfile.avatarUrl ? (
              <PlayerAvatar
                avatarUrl={playerProfile.avatarUrl}
                twitterHandle={playerProfile.twitterHandle}
                handle={playerProfile.handle}
                wallet={play.address}
                size={isSheet ? 36 : 20}
              />
            ) : (
              <Image src={ui.logo} alt="" fill className="object-contain" sizes={isSheet ? '36px' : '20px'} />
            )}
          </div>
          {!isCompact && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <span
                  className={`block truncate font-mono tabular-nums text-emerald-300/95 ${isSheet ? 'text-sm font-semibold' : 'text-[11px]'}`}
                >
                  {symbol} {primaryBalanceText}
                </span>
                <span className={`block truncate text-white/55 ${isSheet ? 'text-xs' : 'text-[10px]'}`}>
                  {secondaryLine}
                </span>
              </div>
              <svg
                className={`shrink-0 text-white/40 transition-transform ${menuOpen ? 'rotate-180' : ''} ${isSheet ? 'h-5 w-5' : 'h-3.5 w-3.5'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
          {isCompact && (
            <span
              className="absolute -bottom-0.5 -right-0.5 min-w-[2.25rem] rounded-md bg-emerald-500/20 px-1 py-px text-[9px] font-mono font-semibold tabular-nums text-emerald-300 ring-1 ring-emerald-500/30"
              aria-hidden
            >
              {primaryBalanceText}
            </span>
          )}
        </button>

        {menuOpen && menuPanel}
      </div>
      <ChainConnectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
