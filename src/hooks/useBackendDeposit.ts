import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';
import { normalizeAuthWallet } from '@/lib/walletAuthMessage';

export interface DepositResult {
  success: boolean;
  transactionHash?: string;
  explorerUrl?: string;
  message?: string;
  netCreditedOctas?: string;
  balanceRaw?: string;
  balanceNative?: number;
  platformFeeApt?: number;
  grossApt?: number;
}

interface UseBackendDepositProps {
  signAndSubmitTransaction?: (payload: unknown) => Promise<{ hash?: string }>;
  isDemo?: boolean;
}

const PENDING_APT_DEPOSIT_KEY = 'aptcasino_pending_apt_deposit';

export async function recoverPendingAptDeposit(
  wallet: string,
  referralCode: string | null = readReferralCode(),
): Promise<DepositResult | null> {
  if (typeof window === 'undefined') return null;
  try {
    const rawPending = window.sessionStorage.getItem(PENDING_APT_DEPOSIT_KEY);
    if (!rawPending) return null;
    const pending = JSON.parse(rawPending);
    if (
      !pending?.txSignature ||
      normalizeAuthWallet(String(pending?.wallet || ''), 'aptos') !== wallet
    ) {
      return null;
    }
    const recovered = await creditAptDepositOnServer(
      wallet,
      pending.amountNative,
      pending.txSignature,
      referralCode,
      null,
    );
    if (!recovered.success) return null;
    window.sessionStorage.removeItem(PENDING_APT_DEPOSIT_KEY);
    const credited =
      recovered.netCreditedNative ??
      recovered.creditedNative ??
      recovered.balanceNative ??
      pending.amountNative;
    toast.success(`Previous deposit credited — ${Number(credited).toFixed(4)} APT in play balance`);
    return {
      success: true,
      transactionHash: pending.txSignature,
      balanceRaw: recovered.balanceRaw,
      balanceNative: recovered.balanceNative,
      netCreditedOctas: recovered.netCreditedOctas,
      grossApt: pending.amountNative,
      message: recovered.alreadyProcessed ? 'Deposit already credited' : 'Deposit recovered',
    };
  } catch {
    return null;
  }
}

async function creditAptDepositOnServer(
  wallet: string,
  amountNative: number,
  txHash: string,
  referralCode: string | null,
  walletAuth: { message: string; signature: string; publicKey?: string | null; timestamp?: number } | null,
) {
  const payload = {
    wallet,
    amountNative,
    txSignature: txHash,
    referralCode,
    walletAuth,
  };
  const res = await fetch('/api/chains/aptos/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data = await res.json();
  if (!res.ok) {
    for (let attempt = 0; attempt < 3 && !data.success; attempt++) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      const retryRes = await fetch('/api/chains/aptos/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      data = await retryRes.json();
      if (retryRes.ok && data.success) break;
    }
  }
  return data;
}

function readReferralCode(): string | null {
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage.getItem('apt_casino_ref') : null;
    if (ls && /^[A-Z2-9]{8}$/.test(ls.trim().toUpperCase())) {
      return ls.trim().toUpperCase();
    }
    if (typeof document !== 'undefined') {
      const m = document.cookie.match(/(?:^|; )apt_casino_ref=([^;]*)/);
      if (m?.[1]) {
        const v = decodeURIComponent(m[1]).trim().toUpperCase();
        if (/^[A-Z2-9]{8}$/.test(v)) return v;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const useBackendDeposit = (props?: UseBackendDepositProps) => {
  const [isDepositing, setIsDepositing] = useState(false);
  const { account, signAndSubmitTransaction: walletSignAndSubmit } = useWallet();

  const signAndSubmitTransaction = props?.signAndSubmitTransaction || walletSignAndSubmit;

  const deposit = async (amount: number): Promise<DepositResult> => {
    if (!account?.address || !signAndSubmitTransaction) {
      toast.error('Please connect your wallet first');
      return { success: false, message: 'Wallet not connected' };
    }

    if (amount <= 0) {
      toast.error('Please enter a valid deposit amount');
      return { success: false, message: 'Invalid amount' };
    }

    const minDeposit = Number(process.env.NEXT_PUBLIC_APTOS_MIN_DEPOSIT_APT || 1);
    if (amount < minDeposit) {
      toast.error(`Minimum deposit is ${minDeposit} APT`);
      return { success: false, message: `Minimum deposit is ${minDeposit} APT` };
    }

    if (props?.isDemo) {
      toast.error('Turn off Demo mode in the navbar to deposit real APT.');
      return { success: false, message: 'Demo mode active — use Refill demo credits instead.' };
    }

    setIsDepositing(true);

    try {
      const treasuryAddress =
        process.env.NEXT_PUBLIC_TREASURY_ADDRESS || process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;
      if (!treasuryAddress) {
        toast.error('Treasury address is not configured (NEXT_PUBLIC_TREASURY_ADDRESS).');
        return { success: false, message: 'Treasury not configured' };
      }

      const wallet = normalizeAuthWallet(String(account.address), 'aptos');
      const referralCode = readReferralCode();

      const amountOctas = Math.floor(amount * 100_000_000);
      let transferResponse: { hash?: string };

      try {
        transferResponse = await signAndSubmitTransaction({
          data: {
            function: '0x1::aptos_account::transfer',
            typeArguments: [],
            functionArguments: [treasuryAddress, amountOctas.toString()],
          },
        });
      } catch {
        try {
          transferResponse = await signAndSubmitTransaction({
            payload: {
              function: '0x1::aptos_account::transfer',
              type_arguments: [],
              arguments: [treasuryAddress, amountOctas.toString()],
            },
          } as never);
        } catch {
          transferResponse = await signAndSubmitTransaction({
            function: '0x1::aptos_account::transfer',
            type_arguments: [],
            arguments: [treasuryAddress, amountOctas.toString()],
          } as never);
        }
      }

      if (!transferResponse?.hash) {
        throw new Error('Transfer transaction failed');
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          PENDING_APT_DEPOSIT_KEY,
          JSON.stringify({ wallet, amountNative: amount, txSignature: transferResponse.hash }),
        );
      }

      const backendData = await creditAptDepositOnServer(
        wallet,
        amount,
        transferResponse.hash,
        referralCode,
        null,
      );

      if (!backendData.success) {
        throw new Error(backendData.error || 'Backend deposit failed');
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(PENDING_APT_DEPOSIT_KEY);
      }

      const credited =
        backendData.netCreditedNative ??
        backendData.creditedNative ??
        backendData.balanceNative ??
        amount;
      toast.success(
        `Deposited ${amount} APT. Credited ${Number(credited).toFixed(4)} APT after platform fee.`,
      );
      if (backendData.depositBonus?.rewardAptc > 0) {
        toast.info(
          `+${Number(backendData.depositBonus.rewardAptc).toLocaleString(undefined, { maximumFractionDigits: 4 })} APTC bonus locked for ${backendData.depositBonus.lockDays ?? 14} days — claim in Profile`,
          { autoClose: 8000 },
        );
      }

      return {
        success: true,
        transactionHash: transferResponse.hash,
        message: backendData.message,
        netCreditedOctas: backendData.netCreditedOctas,
        balanceRaw: backendData.balanceRaw,
        balanceNative: backendData.balanceNative,
        platformFeeApt: backendData.platformFeeNative ?? backendData.platformFeeApt,
        grossApt: amount,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Deposit failed';
      console.error('DEPOSIT FAILED:', error);
      toast.error(`Deposit failed: ${message}`);
      return { success: false, message };
    } finally {
      setIsDepositing(false);
    }
  };

  return { deposit, isDepositing };
};
