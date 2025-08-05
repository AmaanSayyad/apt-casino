import { NextRequest, NextResponse } from 'next/server';
import { Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';
import { recordGamePlayEvent } from '@/lib/server/gamePlayEvents';
import { incrementRefereeVolumeUsd } from '@/lib/server/referralAptc';
import { getAptosForServer, normalizeEd25519PrivateKeyHex } from '@/lib/server/aptTreasury';
import type { ChainId } from '@/lib/chains/registry';
import {
  fairnessVerifyUrl,
  type SolanaFairnessProof,
} from '@/lib/provablyFair/solanaFairness';
import { isDemoPlayWallet } from '@/lib/play/demoPlay';

const aptos = getAptosForServer();

// Game types mapping
const GAME_TYPES = {
  plinko: 1,
  mines: 2,
  roulette: 3,
  wheel: 4,
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameType, playerAddress, betAmount, result, payout, fairnessProof } = body;
    const chain = (body.chain === 'solana' ? 'solana' : 'aptos') as ChainId;

    // Validate input
    if (!gameType || !playerAddress || !betAmount || !result || payout === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!GAME_TYPES[gameType as keyof typeof GAME_TYPES]) {
      return NextResponse.json(
        { error: 'Invalid game type' },
        { status: 400 }
      );
    }

    const betN = Number(betAmount);
    const proof = chain === 'solana' ? (fairnessProof as SolanaFairnessProof | undefined) : undefined;
    const proofReference = proof?.proofReference ?? null;
    const isDemo = isDemoPlayWallet(String(playerAddress));

    if (isDemo) {
      return NextResponse.json({
        success: true,
        gameLogged: true,
        chain,
        demo: true,
        message: 'Demo round — not logged to house ledger',
      });
    }

    await recordGamePlayEvent({
      chain,
      game: gameType,
      wallet: String(playerAddress),
      betNative: betN,
      payoutNative: Number(payout),
      result: String(result),
      fairnessProof: proof ?? null,
      proofReference,
    }).catch((e) => console.warn('[log-game] supabase event', e));

    const nativeUsd =
      chain === 'solana'
        ? Number(process.env.SOL_USD_PRICE_OVERRIDE) || 150
        : Number(process.env.APT_USD_PRICE_OVERRIDE) || 8;
    incrementRefereeVolumeUsd(String(playerAddress), betN, nativeUsd).catch(() => {});

    if (chain === 'solana') {
      return NextResponse.json({
        success: true,
        gameLogged: true,
        chain: 'solana',
        transactionHash: proofReference,
        proofReference,
        explorerUrl: proofReference ? fairnessVerifyUrl(proofReference, request.nextUrl.origin) : null,
        message: 'Solana fairness record stored',
      });
    }

    const rawPk = process.env.TREASURY_PRIVATE_KEY;
    if (!rawPk) {
      return NextResponse.json({ error: 'TREASURY_PRIVATE_KEY missing' }, { status: 500 });
    }
    const privateKey = new Ed25519PrivateKey(normalizeEd25519PrivateKeyHex(rawPk));
    const treasuryAccount = Account.fromPrivateKey({ privateKey });

    // Ensure GameLog resource exists for treasury; if not, initialize
    const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS!;
    try {
      await aptos.getAccountResource({
        accountAddress: String(treasuryAccount.accountAddress),
        resourceType: `${moduleAddr}::game_logger::GameLog`,
      });
    } catch {
      // Initialize logger
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

    // Normalize amounts to octas (u64) and player address to string
    const toOctas = (n: number) => Math.floor(Number(n) * 100000000);
    const betAmountOctas = toOctas(betAmount);
    const payoutOctas = toOctas(payout);
    const playerStr = String(playerAddress);

    // Build transaction
    const transaction = await aptos.transaction.build.simple({
      sender: treasuryAccount.accountAddress,
      data: {
        function: `${process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS}::game_logger::log_game`,
        functionArguments: [
          GAME_TYPES[gameType as keyof typeof GAME_TYPES], // game_type
          playerStr, // player_address
          betAmountOctas, // bet_amount
          result, // result
          payoutOctas, // payout
        ],
      },
      options: {
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      },
    });

    // Sign and submit transaction
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: treasuryAccount,
      transaction,
    });

    // Wait for transaction confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    // Console log for debugging
    console.log('🎮 GAME LOGGED TO BLOCKCHAIN:');
    console.log('├── Game Type:', gameType);
    console.log('├── Player:', playerAddress);
    console.log('├── Bet Amount:', betAmount, 'APT');
    console.log('├── Result:', result);
    console.log('├── Payout:', payout, 'APT');
    console.log('├── Transaction Hash:', committedTxn.hash);
    console.log('├── Treasury Address:', treasuryAccount.accountAddress.toString());
    console.log('├── Gas Used:', executedTransaction.gas_used);
    console.log('├── Gas Price:', executedTransaction.gas_unit_price);
    console.log('├── Sequence Number:', executedTransaction.sequence_number);
    console.log('├── VM Status:', executedTransaction.vm_status);
    console.log('├── Success:', executedTransaction.success);
    console.log('├── Timestamp:', new Date(Number(executedTransaction.timestamp) / 1000).toISOString());
    console.log('├── 🎲 Randomness generated on-chain by Aptos');
    console.log('├── 🔐 Transaction signed by Treasury wallet');
    console.log('└── 🌐 Explorer URL:', `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=mainnet`);

    return NextResponse.json({
      success: true,
      transactionHash: committedTxn.hash,
      gameLogged: true,
      explorerUrl: `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=mainnet`,
    });

  } catch (error: any) {
    console.error('Error logging game:', error);
    return NextResponse.json(
      { error: `Failed to log game to blockchain: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}