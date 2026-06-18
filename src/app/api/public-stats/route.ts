import { NextResponse } from 'next/server';
import { getAptUsdPrice } from '@/lib/server/aptPrice';
import { getAptosForServer, getTreasurySignerFromEnv } from '@/lib/server/aptTreasury';
import { getDepositFeeBps, getWithdrawFeeBps, getManualWithdrawUsdThreshold } from '@/lib/server/platformFees';
import { getFeeTiersPublicPayload } from '@/lib/server/feeTiers';

/** Aggregated non-sensitive stats for landing / dashboard (live data where configured). */
export async function GET() {
  let aptUsd: number | null = null;
  try {
    aptUsd = await getAptUsdPrice();
  } catch (e) {
    console.warn('[public-stats] APT/USD unavailable', e);
  }

  let treasuryAddress: string | null = null;
  let treasuryApt: number | null = null;

  try {
    const signer = getTreasurySignerFromEnv();
    treasuryAddress = signer.accountAddress.toString();
    const aptos = getAptosForServer();
    const resource = await aptos.getAccountResource({
      accountAddress: signer.accountAddress,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
    });
    const raw = (resource.data as { coin?: { value?: string } })?.coin?.value ?? '0';
    treasuryApt = Number(BigInt(raw)) / 1e8;
  } catch {
    // TREASURY_PRIVATE_KEY may be unset in local dev
  }

  return NextResponse.json({
    aptUsd,
    treasuryAddress,
    treasuryApt,
    platformFeeDepositBps: getDepositFeeBps(),
    platformFeeWithdrawBps: getWithdrawFeeBps(),
    feeTiers: getFeeTiersPublicPayload(),
    manualWithdrawUsdThreshold: getManualWithdrawUsdThreshold(),
    chainsEnabled: ['solana', 'aptos'],
  });
}
