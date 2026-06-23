import type { ChainId } from '@/lib/chains/registry';
import { nativeToRaw, rawToNative } from '@/lib/server/play/amounts';
import {
  creditWithPendingStake,
  recordPendingStake,
  releasePendingStake,
  settlePlayRound,
} from '@/lib/server/play/pendingStakes';
import { beginGameRound } from '@/lib/server/play/gameRounds';
import {
  computeVerifiedPayout,
  isPayoutVerificationRequired,
  type GameRoundPayload,
} from '@/lib/server/play/gameSettlement';
import { findNewestOpenStakeBetRaw } from '@/lib/server/play/stakeLookup';

export type BetActionBody = {
  action?: string;
  amountNative?: number;
  betAmountNative?: number;
  payoutAmountNative?: number;
  game?: string | null;
  gameRound?: GameRoundPayload;
  roundId?: string;
  gameData?: Record<string, unknown>;
};

export async function handlePlayBetAction(input: {
  wallet: string;
  chain: ChainId;
  currency: string;
  body: BetActionBody;
  debitHouseBalance: (amountRaw: bigint) => Promise<bigint>;
  creditHouseBalance: (amountRaw: bigint) => Promise<bigint>;
  getHouseBalance: () => Promise<bigint>;
}): Promise<{
  balanceRaw: string;
  balanceNative: string;
  roundId?: string;
  serverSeedHash?: string;
  payoutAmountNative?: number;
}> {
  const body = input.body;
  const action =
    body.action === 'credit'
      ? 'credit'
      : body.action === 'release_stake'
        ? 'release_stake'
        : body.action === 'settle'
          ? 'settle'
          : 'debit';

  const game = typeof body.game === 'string' ? body.game.trim().slice(0, 32) : null;
  const verify = isPayoutVerificationRequired();

  if (action === 'release_stake') {
    await releasePendingStake({ wallet: input.wallet, chain: input.chain });
    const balanceRaw = await input.getHouseBalance();
    return {
      balanceRaw: balanceRaw.toString(),
      balanceNative: rawToNative(input.chain, balanceRaw),
    };
  }

  if (action === 'settle') {
    const betAmountNative = parseFloat(
      String(body.betAmountNative ?? body.amountNative ?? ''),
    );
    if (!Number.isFinite(betAmountNative) || betAmountNative <= 0) {
      throw new Error('wallet and positive betAmountNative required');
    }
    if (!game) throw new Error('game required for settle');

    let payoutAmountNative = 0;
    if (verify) {
      if (!body.gameRound) throw new Error('gameRound required for verified settlement');
      const verified = await computeVerifiedPayout({
        wallet: input.wallet,
        chain: input.chain,
        game,
        betAmountNative,
        gameRound: body.gameRound,
        roundId: body.roundId,
      });
      payoutAmountNative = verified.payoutAmountNative;
    } else {
      const clientPayout = parseFloat(String(body.payoutAmountNative ?? '0'));
      payoutAmountNative =
        Number.isFinite(clientPayout) && clientPayout > 0 ? clientPayout : 0;
    }

    const betRaw = nativeToRaw(input.chain, betAmountNative);
    const payoutRaw =
      payoutAmountNative > 0 ? nativeToRaw(input.chain, payoutAmountNative) : 0n;

    const newBalance = await settlePlayRound({
      wallet: input.wallet,
      chain: input.chain,
      currency: input.currency,
      betAmountRaw: betRaw,
      payoutAmountRaw: payoutRaw,
      game,
      debitHouseBalance: input.debitHouseBalance,
      creditHouseBalance: input.creditHouseBalance,
    });

    return {
      balanceRaw: newBalance.toString(),
      balanceNative: rawToNative(input.chain, newBalance),
      payoutAmountNative,
    };
  }

  const amountNative = parseFloat(String(body.amountNative ?? ''));
  if (!Number.isFinite(amountNative) || amountNative <= 0) {
    throw new Error('wallet and positive amountNative required');
  }
  const amountRaw = nativeToRaw(input.chain, amountNative);

  if (action === 'credit') {
    let payoutAmountNative = amountNative;

    if (verify) {
      if (!game || !body.gameRound) {
        throw new Error('game and gameRound required for verified credit');
      }
      const stakeBetRaw = await findNewestOpenStakeBetRaw(input.wallet, input.chain);
      if (!stakeBetRaw || stakeBetRaw <= 0n) {
        throw new Error('No open bet stake found — credits require a recent debit first');
      }
      const betAmountNative = parseFloat(rawToNative(input.chain, stakeBetRaw));
      const verified = await computeVerifiedPayout({
        wallet: input.wallet,
        chain: input.chain,
        game,
        betAmountNative,
        gameRound: body.gameRound,
        roundId: body.roundId,
      });
      payoutAmountNative = verified.payoutAmountNative;
    }

    const payoutRaw = nativeToRaw(input.chain, payoutAmountNative);

    if (payoutAmountNative <= 0) {
      await releasePendingStake({ wallet: input.wallet, chain: input.chain });
      const balanceRaw = await input.getHouseBalance();
      return {
        balanceRaw: balanceRaw.toString(),
        balanceNative: rawToNative(input.chain, balanceRaw),
        payoutAmountNative: 0,
      };
    }

    const newBalance = await creditWithPendingStake({
      wallet: input.wallet,
      chain: input.chain,
      currency: input.currency,
      creditRaw: payoutRaw,
      creditHouseBalance: input.creditHouseBalance,
    });

    return {
      balanceRaw: newBalance.toString(),
      balanceNative: rawToNative(input.chain, newBalance),
      payoutAmountNative,
    };
  }

  const newBalance = await input.debitHouseBalance(amountRaw);

  let roundId: string | undefined;
  let serverSeedHash: string | undefined;
  if (verify && game) {
    const round = await beginGameRound({
      wallet: input.wallet,
      chain: input.chain,
      game,
      betRaw: amountRaw,
      gameData: body.gameData,
    });
    roundId = round.roundId;
    serverSeedHash = round.serverSeedHash;
  }

  await recordPendingStake({
    wallet: input.wallet,
    chain: input.chain,
    betRaw: amountRaw,
    game,
  });

  return {
    balanceRaw: newBalance.toString(),
    balanceNative: rawToNative(input.chain, newBalance),
    roundId,
    serverSeedHash,
  };
}
