import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { ExternalLink, Hash, CheckCircle, AlertCircle } from 'lucide-react';
import { useGameHistory } from '../../hooks/useGameHistory';
import { useVRFPregeneration } from '../../hooks/useVRFPregeneration';
import RouletteResultProcessor from '../../services/gameProcessors/RouletteResultProcessor';
import GameHistoryTable from './GameHistoryTable';

/**
 * Roulette Game Component with History Integration
 * Shows how to integrate VRF results with game history
 */
const RouletteWithHistory = () => {
  const { address, isConnected } = useAccount();
  const { saveRouletteGame, saving } = useGameHistory();
  const {
    isReady: vrfReady,
    consumeVRF,
    canPlayGame,
    totalVRF,
    getVRFForGame
  } = useVRFPregeneration();

  const [gameState, setGameState] = useState({
    isPlaying: false,
    result: null,
    vrfDetails: null,
    savedToHistory: false,
    error: null
  });

  const [betConfig, setBetConfig] = useState({
    betType: 'straight',
    betValue: 7,
    betAmount: ethers.parseEther('0.01') // 0.01 ETH
  });

  // Initialize roulette processor
  const rouletteProcessor = new RouletteResultProcessor();

  /**
   * Play game using real VRF from pregenerated pool
   */
  const playGame = async () => {
    if (!isConnected || !address) {
      setGameState(prev => ({ ...prev, error: 'Please connect your wallet' }));
      return;
    }

    if (!canPlayGame()) {
      setGameState(prev => ({
        ...prev,
        error: 'No VRF available. Please generate VRF first by clicking the VRF button in the navbar.'
      }));
      return;
    }

    try {
      setGameState(prev => ({
        ...prev,
        isPlaying: true,
        error: null,
        result: null,
        vrfDetails: null,
        savedToHistory: false
      }));

      console.log('🎲 Consuming VRF for Roulette...');

      // Consume VRF from pregenerated batch
      const vrfData = await consumeVRF('ROULETTE', {
        betType: betConfig.betType,
        betValue: betConfig.betValue,
        wheelType: 'european'
      });

      const vrf = vrfData.data;

      // Process VRF value to get game result
      const gameResult = rouletteProcessor.processVRF(vrf.vrfValue, {
        wheelType: 'european'
      });

      // Calculate payout
      const payoutResult = rouletteProcessor.calculatePayout(
        betConfig.betType,
        betConfig.betValue,
        gameResult.number,
        Number(ethers.formatEther(betConfig.betAmount))
      );

      const payoutAmount = payoutResult.isWin ?
        ethers.parseEther(payoutResult.payout.toString()) :
        BigInt(0);

      // Update game state with result
      const vrfDetails = {
        requestId: vrf.requestId,
        transactionHash: vrf.transactionHash,
        blockNumber: vrf.blockNumber,
        vrfValue: vrf.vrfValue,
        fulfilledAt: vrf.fulfilledAt,
        etherscanUrl: vrf.etherscanUrl
      };

      setGameState(prev => ({
        ...prev,
        result: {
          ...gameResult,
          payoutResult,
          isWin: payoutResult.isWin
        },
        vrfDetails,
        isPlaying: false
      }));

      // Save to history
      console.log('💾 Saving game result to history...');

      const historyResult = await saveRouletteGame({
        userAddress: address,
        vrfRequestId: vrf.id,
        vrfTransactionHash: vrf.transactionHash,
        vrfValue: vrf.vrfValue,
        gameConfig: {
          betType: betConfig.betType,
          betValue: betConfig.betValue,
          wheelType: 'european'
        },
        resultData: gameResult,
        betAmount: betConfig.betAmount.toString(),
        payoutAmount: payoutAmount.toString()
      });

      setGameState(prev => ({
        ...prev,
        savedToHistory: true
      }));

      console.log('✅ Game saved to history with real VRF:', historyResult.gameId);

    } catch (error) {
      console.error('❌ Game failed:', error);
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        error: error.message
      }));
    }
  };

  const resetGame = () => {
    setGameState({
      isPlaying: false,
      result: null,
      vrfDetails: null,
      savedToHistory: false,
      error: null
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎰 Roulette with VRF History
        </h1>
        <p className="text-gray-600">
          Play roulette with provably fair VRF and automatic history tracking
        </p>
      </div>

      {/* Bet Configuration */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Place Your Bet</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bet Type
            </label>
            <select
              value={betConfig.betType}
              onChange={(e) => setBetConfig(prev => ({ ...prev, betType: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={gameState.isPlaying}
            >
              <option value="straight">Straight (35:1)</option>
              <option value="red">Red (1:1)</option>
              <option value="black">Black (1:1)</option>
              <option value="even">Even (1:1)</option>
              <option value="odd">Odd (1:1)</option>
            </select>
          </div>

          {betConfig.betType === 'straight' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number (0-36)
              </label>
              <input
                type="number"
                min="0"
                max="36"
                value={betConfig.betValue}
                onChange={(e) => setBetConfig(prev => ({ ...prev, betValue: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={gameState.isPlaying}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bet Amount (APTC)
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={ethers.formatEther(betConfig.betAmount)}
              onChange={(e) => setBetConfig(prev => ({
                ...prev,
                betAmount: ethers.parseEther(e.target.value || '0.001')
              }))}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={gameState.isPlaying}
            />
          </div>
        </div>

        <button
          onClick={playGame}
          disabled={gameState.isPlaying || !isConnected || saving || !canPlayGame()}
          className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {gameState.isPlaying ? '🎲 Playing...' :
            saving ? '💾 Saving...' :
              !canPlayGame() ? '⚠️ No VRF Available' :
                '🎰 Spin the Wheel'}
        </button>

        {/* VRF Status */}
        {isConnected && (
          <div className="mt-2 text-center">
            {canPlayGame() ? (
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                <CheckCircle size={14} />
                <span>VRF Ready ({getVRFForGame('ROULETTE')} available)</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-yellow-600 text-sm">
                <AlertCircle size={14} />
                <span>No VRF available - Click VRF button in navbar to generate</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {gameState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ {gameState.error}</p>
        </div>
      )}

      {/* Game Result */}
      {gameState.result && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Game Result</h3>
            {gameState.savedToHistory && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm">Saved to History</span>
              </div>
            )}
          </div>

          {/* Roulette Result */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold">
                {gameState.result.number}
              </div>
              <div className={`px-4 py-2 rounded-lg text-white font-medium ${gameState.result.color === 'red' ? 'bg-red-500' :
                gameState.result.color === 'black' ? 'bg-gray-800' :
                  'bg-green-500'
                }`}>
                {gameState.result.color?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Bet Result */}
          <div className={`p-4 rounded-lg text-center ${gameState.result.isWin ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
            <div className={`text-2xl font-bold mb-2 ${gameState.result.isWin ? 'text-green-600' : 'text-red-600'
              }`}>
              {gameState.result.isWin ? '🎉 YOU WIN!' : '😔 YOU LOSE'}
            </div>
            <div className="text-sm text-gray-600">
              Bet: {ethers.formatEther(betConfig.betAmount)} ETH →
              Payout: {ethers.formatEther(gameState.result.payoutResult.payout.toString())} ETH
            </div>
            <div className={`font-medium ${gameState.result.isWin ? 'text-green-600' : 'text-red-600'
              }`}>
              Profit: {gameState.result.isWin ? '+' : ''}{ethers.formatEther(gameState.result.payoutResult.profit.toString())} ETH
            </div>
          </div>
        </div>
      )}

      {/* VRF Details */}
      {gameState.vrfDetails && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">VRF Verification</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Provably Fair
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Transaction Hash:</span>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {gameState.vrfDetails.transactionHash.slice(0, 10)}...{gameState.vrfDetails.transactionHash.slice(-8)}
                </code>
                <a
                  href={`${process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_EXPLORER}/tx/${gameState.vrfDetails.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  title="View on Arbiscan"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Block Number:</span>
              <span className="font-mono text-xs">#{gameState.vrfDetails.blockNumber}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">VRF Value:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {gameState.vrfDetails.vrfValue.slice(0, 12)}...
              </code>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Request ID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {gameState.vrfDetails.requestId.slice(0, 10)}...
              </code>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
            <p className="font-medium mb-1">🔒 Blockchain Verified</p>
            <p>
              This result was generated using Chainlink VRF and is permanently recorded on the blockchain.
              Click the transaction hash to verify the randomness independently.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {gameState.result && (
        <div className="flex gap-4">
          <button
            onClick={resetGame}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={() => window.open('/history', '_blank')}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            View History
          </button>
        </div>
      )}

      {/* Connection Prompt */}
      {!isConnected && (
        <div className="text-center py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <span className="text-4xl mb-4 block">🔗</span>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-yellow-700">
              Connect your wallet to play roulette and track your game history with VRF verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouletteWithHistory;