'use client';

import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false },
);

export default function SolanaConnectWalletButton({ className = '' }) {
  return (
    <div className={className}>
      <WalletMultiButton className="!h-9 !rounded-lg !bg-violet-600 hover:!bg-violet-500 !text-sm" />
    </div>
  );
}
