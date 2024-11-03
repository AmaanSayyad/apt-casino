import { NextResponse } from 'next/server';
import { ChainId, getPlayChainConfig, isPlayableChainId } from '@/lib/chains/registry';
import {
  solanaBalanceGET,
  solanaBetPOST,
  solanaDepositPOST,
  solanaWithdrawPOST,
} from './solana';

export function assertPlayChain(chainId: string): chainId is ChainId {
  if (!isPlayableChainId(chainId)) {
    return false;
  }
  return true;
}

export function chainNotSupported(chainId: string) {
  return NextResponse.json(
    { error: `Chain "${chainId}" is not enabled for play yet` },
    { status: 404 },
  );
}

export async function handleChainBalanceGET(chainId: string, request: Request) {
  if (!assertPlayChain(chainId)) return chainNotSupported(chainId);
  const cfg = getPlayChainConfig(chainId)!;
  if (cfg.balanceMode !== 'server') {
    return NextResponse.json({ error: 'Chain uses client-side balance only' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.trim();
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

  switch (chainId) {
    case 'solana':
      return solanaBalanceGET(wallet);
    default:
      return chainNotSupported(chainId);
  }
}

export async function handleChainBetPOST(chainId: string, request: Request) {
  if (!assertPlayChain(chainId)) return chainNotSupported(chainId);
  switch (chainId) {
    case 'solana':
      return solanaBetPOST(request);
    default:
      return chainNotSupported(chainId);
  }
}

export async function handleChainDepositPOST(chainId: string, request: Request) {
  if (!assertPlayChain(chainId)) return chainNotSupported(chainId);
  switch (chainId) {
    case 'solana':
      return solanaDepositPOST(request);
    default:
      return chainNotSupported(chainId);
  }
}

export async function handleChainWithdrawPOST(chainId: string, request: Request) {
  if (!assertPlayChain(chainId)) return chainNotSupported(chainId);
  switch (chainId) {
    case 'solana':
      return solanaWithdrawPOST(request);
    default:
      return chainNotSupported(chainId);
  }
}
