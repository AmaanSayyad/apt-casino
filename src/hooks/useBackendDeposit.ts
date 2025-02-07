import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';

export interface DepositResult {
  success: boolean;
  transactionHash?: string;
  explorerUrl?: string;
  message?: string;
  netCreditedOctas?: string;
  platformFeeApt?: number;
  grossApt?: number;
}

interface UseBackendDepositProps {
  signAndSubmitTransaction?: (payload: unknown) => Promise<{ hash?: string }>;
  isDemo?: boolean;
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
    if (amount < 10) {
      toast.error('Minimum deposit is 10 APT');
      return { success: false, message: 'Minimum deposit is 10 APT' };
    }

    if (props?.isDemo) {
      const feeBps = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS_DEPOSIT || 1000);
      const grossOct = Math.floor(amount * 100_000_000);
      const feeOct = Math.floor((grossOct * feeBps) / 10000);
      const net = Math.max(0, grossOct - feeOct);
      toast.success(
        `Demo deposit: +${(net / 100_000_000).toFixed(4)} APT to house balance (simulated ${feeBps / 100}% fee).`,
      );
      return {
        success: true,
        message: 'Demo deposit',
        netCreditedOctas: String(net),
        grossApt: amount,
        platformFeeApt: feeOct / 100_000_000,
      };
    }

    setIsDepositing(true);

    try {
      const treasuryAddress =
        process.env.NEXT_PUBLIC_TREASURY_ADDRESS || process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;
      if (!treasuryAddress) {
        toast.error('Treasury address is not configured (NEXT_PUBLIC_TREASURY_ADDRESS).');
        return { success: false, message: 'Treasury not configured' };
      }

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
          });
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

      // Pull a stored referral code (set by ?ref= / /r/CODE capture) so the deposit
      // endpoint can validate the referral atomically even if /api/referrals/attribute
      // hasn't landed yet (e.g. user just connected + deposits in the same tick).
      let referralCode: string | null = null;
      try {
        const ls = typeof window !== 'undefined' ? window.localStorage.getItem('apt_casino_ref') : null;
        if (ls && /^[A-Z2-9]{8}$/.test(ls.trim().toUpperCase())) {
          referralCode = ls.trim().toUpperCase();
        } else if (typeof document !== 'undefined') {
          const m = document.cookie.match(/(?:^|; )apt_casino_ref=([^;]*)/);
          if (m?.[1]) {
            const v = decodeURIComponent(m[1]).trim().toUpperCase();
            if (/^[A-Z2-9]{8}$/.test(v)) referralCode = v;
          }
        }
      } catch {
        /* ignore */
      }

      const backendResponse = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account.address,
          amount,
          transactionHash: transferResponse.hash,
          referralCode,
        }),
      });

      const backendData = await backendResponse.json();

      if (!backendData.success) {
        throw new Error(backendData.error || 'Backend deposit failed');
      }

      const netOct = backendData.netCreditedOctas
        ? parseInt(String(backendData.netCreditedOctas), 10)
        : Math.floor(amount * 100_000_000);
      toast.success(
        `Deposited ${amount} APT. Credited ${(netOct / 100_000_000).toFixed(4)} APT after platform fee.`,
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
        explorerUrl: backendData.explorerUrl,
        message: backendData.message,
        netCreditedOctas: String(netOct),
        platformFeeApt: backendData.platformFeeApt,
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
