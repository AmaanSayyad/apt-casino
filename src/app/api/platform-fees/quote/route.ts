import { NextRequest, NextResponse } from 'next/server';
import type { ChainId } from '@/lib/chains/registry';
import { getFeeTiersPublicPayload, quoteDepositFees } from '@/lib/server/feeTiers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const chainParam = (req.nextUrl.searchParams.get('chain') || 'solana').toLowerCase();
  const chain: ChainId = chainParam === 'aptos' ? 'aptos' : 'solana';
  const amount = parseFloat(req.nextUrl.searchParams.get('amount') || '0');

  const payload = getFeeTiersPublicPayload();

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({
      ...payload,
      quote: null,
    });
  }

  const quote = await quoteDepositFees(chain, amount);

  return NextResponse.json({
    ...payload,
    quote: {
      chain,
      amountNative: amount,
      depositUsd: quote.depositUsd,
      nativeUsd: quote.nativeUsd,
      tierId: quote.tier.id,
      tierLabel: quote.tier.label,
      depositFeeBps: quote.depositFeeBps,
      depositFeePct: quote.tier.depositPct,
      withdrawFeeBps: quote.withdrawFeeBps,
      withdrawFeePct: quote.tier.withdrawPct,
      feeNative: quote.feeNative,
      netNative: quote.netNative,
    },
  });
}
