import { NextRequest, NextResponse } from 'next/server';
import type { ChainId } from '@/lib/chains/registry';
import {
  computeDepositAptcBonus,
  fetchNativeUsdPrice,
  getDepositBonusBps,
  getDepositBonusLockDays,
} from '@/lib/server/depositAptcBonus';
import { aptcPriceUsd } from '@/lib/server/referralAptc';

export const dynamic = 'force-dynamic';

/** Public deposit-bonus economics for deposit UI previews. */
export async function GET(req: NextRequest) {
  const chainParam = (req.nextUrl.searchParams.get('chain') || 'solana').toLowerCase();
  const chain: ChainId = chainParam === 'aptos' ? 'aptos' : 'solana';
  const amount = parseFloat(req.nextUrl.searchParams.get('amount') || '0');

  const [nativeUsd, aptcUsd] = await Promise.all([
    fetchNativeUsdPrice(chain),
    aptcPriceUsd(),
  ]);

  const bonusBps = getDepositBonusBps();
  const lockDays = getDepositBonusLockDays();
  const estimatedAptc =
    Number.isFinite(amount) && amount > 0
      ? await computeDepositAptcBonus(amount, nativeUsd)
      : 0;

  const bonusPct = bonusBps / 100;

  return NextResponse.json({
    enabled: aptcUsd != null && aptcUsd > 0,
    bonusBps,
    bonusPct,
    lockDays,
    chain,
    nativeUsd,
    aptcPriceUsd: aptcUsd,
    estimatedAptc,
    estimatedUsd: Number.isFinite(amount) && amount > 0 ? amount * nativeUsd * (bonusBps / 10_000) : 0,
  });
}
