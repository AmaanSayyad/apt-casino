'use client';

import { playApiPath, isPlayableChainId, getPlayChainConfig } from '@/lib/chains/registry';
import { normalizeAuthWallet } from '@/lib/walletAuthMessage';

function canonicalPlayWallet(chainId, wallet) {
  if (!wallet) return wallet;
  return chainId === 'aptos' ? normalizeAuthWallet(wallet, 'aptos') : wallet;
}

/**
 * Client helpers for multichain play balance APIs (/api/chains/[chain]/…).
 */

export async function fetchPlayBalance(chainId, wallet) {
  if (!isPlayableChainId(chainId)) {
    return { ok: false, error: 'Chain not available for play' };
  }
  const config = getPlayChainConfig(chainId);
  if (config?.balanceMode !== 'server') {
    return { ok: false, error: 'Chain uses local balance only' };
  }
  const w = canonicalPlayWallet(chainId, wallet);
  const res = await fetch(`${playApiPath(chainId, 'balance')}?wallet=${encodeURIComponent(w)}`);
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || 'Failed to load balance' };
  return { ok: true, balanceRaw: data.balanceRaw, balanceNative: data.balanceNative };
}

export async function postPlayBet(
  chainId,
  {
    wallet,
    action,
    amountNative,
    betAmountNative,
    payoutAmountNative,
    game,
    gameRound,
    roundId,
    gameData,
    walletAuth,
  },
) {
  const w = canonicalPlayWallet(chainId, wallet);
  const res = await fetch(playApiPath(chainId, 'bet'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: w,
      action,
      amountNative,
      betAmountNative,
      payoutAmountNative,
      game,
      gameRound,
      roundId,
      gameData,
      walletAuth,
    }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || 'Bet update failed' };
  return {
    ok: true,
    balanceRaw: data.balanceRaw,
    balanceNative: data.balanceNative,
    roundId: data.roundId,
    serverSeedHash: data.serverSeedHash,
    payoutAmountNative: data.payoutAmountNative,
  };
}

export async function postPlayDeposit(chainId, body) {
  const res = await fetch(playApiPath(chainId, 'deposit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || 'Deposit failed' };
  return { ok: true, ...data };
}

export async function postPlayWithdraw(chainId, { wallet, amountNative, walletAuth }) {
  const w = canonicalPlayWallet(chainId, wallet);
  const res = await fetch(playApiPath(chainId, 'withdraw'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet: w, amountNative, walletAuth }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || 'Withdrawal failed' };
  return { ok: true, ...data };
}
