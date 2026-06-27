import { NextRequest, NextResponse } from 'next/server';
import { recordGamePlayEvent } from '@/lib/server/gamePlayEvents';
import { getAptosForServer, getTreasurySignerFromEnv } from '@/lib/server/aptTreasury';
import type { ChainId } from '@/lib/chains/registry';
import {
  fairnessVerifyUrl,
  verifySolanaFairnessProof,
  type SolanaFairnessProof,
} from '@/lib/provablyFair/solanaFairness';
import { isDemoPlayWallet } from '@/lib/play/demoPlay';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { rateLimitRequest } from '@/lib/server/requestRateLimit';

const MAX_LOG_BET_NATIVE = 1_000_000;
const MAX_LOG_PAYOUT_NATIVE = 1_000_000;

const aptos = getAptosForServer();

const GAME_TYPES = {
  plinko: 1,
  mines: 2,
  roulette: 3,
  wheel: 4,
} as const;

function aptosOnChainGameLogEnabled(): boolean {
  const raw = process.env.APTOS_ONCHAIN_GAME_LOG_ENABLED?.trim().toLowerCase();
  return raw === '1' || raw === 'true';
}

export async function POST(request: NextRequest) {
  try {
    if (rateLimitRequest(request, { key: 'log-game', limit: 60, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }
    const body = await request.json();
    const { gameType, playerAddress, betAmount, result, payout, fairnessProof } = body;
    const chain = (body.chain === 'solana' ? 'solana' : 'aptos') as ChainId;
    const wallet = normalizeWalletForChain(String(playerAddress || ''), chain);
    if (!wallet) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    if (!gameType || betAmount == null || !result || payout === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!GAME_TYPES[gameType as keyof typeof GAME_TYPES]) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const betN = Number(betAmount);
    const payoutN = Number(payout);
    if (!Number.isFinite(betN) || betN < 0 || betN > MAX_LOG_BET_NATIVE) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }
    if (!Number.isFinite(payoutN) || payoutN < 0 || payoutN > MAX_LOG_PAYOUT_NATIVE) {
      return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 });
    }
    const proof = chain === 'solana' ? (fairnessProof as SolanaFairnessProof | undefined) : undefined;
    const proofReference = proof?.proofReference ?? null;

    if (chain === 'solana') {
      if (!proof) {
        return NextResponse.json({ error: 'fairnessProof required for Solana game logs' }, { status: 400 });
      }
      const validProof = await verifySolanaFairnessProof(proof).catch(() => false);
      if (!validProof || proof.wallet !== wallet) {
        return NextResponse.json({ error: 'Invalid fairness proof' }, { status: 400 });
      }
    }

    if (isDemoPlayWallet(wallet)) {
      return NextResponse.json({
        success: true,
        gameLogged: true,
        chain,
        demo: true,
        message: 'Demo round — not logged to house ledger',
      });
    }

    // Display/audit only — no referral volume, cashback, or contest credit from client logs.
    await recordGamePlayEvent({
      chain,
      game: gameType,
      wallet,
      betNative: betN,
      payoutNative: payoutN,
      result: String(result),
      fairnessProof: proof ?? null,
      proofReference,
      trusted: false,
    }).catch((e) => console.warn('[log-game] supabase event', e));

    if (chain === 'solana') {
      return NextResponse.json({
        success: true,
        gameLogged: true,
        chain: 'solana',
        transactionHash: proofReference,
        proofReference,
        explorerUrl: proofReference ? fairnessVerifyUrl(proofReference, request.nextUrl.origin) : null,
        message: 'Solana fairness record stored (display only)',
      });
    }

    if (!aptosOnChainGameLogEnabled()) {
      return NextResponse.json({
        success: true,
        gameLogged: true,
        chain: 'aptos',
        message: 'Aptos on-chain game log disabled — stored in platform history only',
      });
    }

    const treasuryAccount = getTreasurySignerFromEnv();
    const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS!;
    try {
      await aptos.getAccountResource({
        accountAddress: String(treasuryAccount.accountAddress),
        resourceType: `${moduleAddr}::game_logger::GameLog`,
      });
    } catch {
      const initTx = await aptos.transaction.build.simple({
        sender: treasuryAccount.accountAddress,
        data: {
          function: `${moduleAddr}::game_logger::initialize`,
          functionArguments: [],
        },
        options: { maxGasAmount: 200000, gasUnitPrice: 100 },
      });
      await aptos.signAndSubmitTransaction({ signer: treasuryAccount, transaction: initTx });
    }

    const toOctas = (n: number) => Math.floor(Number(n) * 100000000);
    const transaction = await aptos.transaction.build.simple({
      sender: treasuryAccount.accountAddress,
      data: {
        function: `${moduleAddr}::game_logger::log_game`,
        functionArguments: [
          GAME_TYPES[gameType as keyof typeof GAME_TYPES],
          wallet,
          toOctas(betAmount),
          result,
          toOctas(payout),
        ],
      },
      options: { maxGasAmount: 200000, gasUnitPrice: 100 },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: treasuryAccount,
      transaction,
    });

    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    return NextResponse.json({
      success: true,
      transactionHash: committedTxn.hash,
      gameLogged: true,
      explorerUrl: `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=${process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet'}`,
    });
  } catch (error: unknown) {
    console.error('Error logging game:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to log game: ${msg}` }, { status: 500 });
  }
}
