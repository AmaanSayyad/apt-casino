'use client';

import GameHistoryList from '@/components/GameHistory/GameHistoryList';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { usePlayWallet } from '@/hooks/usePlayWallet';

/**
 * Game History Page
 * Shows user's complete gaming history with VRF verification
 */
export default function HistoryPage() {
  const { address, connected } = usePlayWallet();

  return (
    <div className="site-page-top min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Game History</h1>
              <p className="text-gray-600 mt-1">
                View your complete gaming history with blockchain verification
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!connected ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md mx-auto">
              <span className="text-6xl mb-4 block">🔗</span>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Connect on Solana or Aptos to view your gaming history and VRF transaction details.
              </p>
              <ConnectWalletButton variant="cta" className="w-full" />
            </div>
          </div>
        ) : (
          <GameHistoryList userAddress={address} />
        )}
      </div>

      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">🔒 Provably Fair Gaming</h3>
              <p className="text-gray-600 text-sm">
                Every game result is verifiable on-chain with transparent randomness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">📈 Track Performance</h3>
              <p className="text-gray-600 text-sm">
                Monitor your wins, losses, and betting patterns over time.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">🔍 VRF Verification</h3>
              <p className="text-gray-600 text-sm">
                Inspect verifiable random function inputs for each round.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
