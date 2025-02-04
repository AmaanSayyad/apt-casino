"use client";
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { 
  aptosClient, 
  CASINO_MODULE_ADDRESS, 
  formatAptAmount, 
  parseAptAmount,
  CasinoGames 
} from '@/lib/aptos';

export const useAptosCasino = () => {
  const { wallet, connected, account } = useWallet();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update balance when wallet connects
  useEffect(() => {
    if (connected && account?.address) {
      updateBalance();
    } else {
      setBalance('0');
    }
  }, [connected, account?.address]);

  const updateBalance = async () => {
    if (!account?.address) return;
    
    try {
      setLoading(true);
      const balance = await getAccountBalance(account.address);
      setBalance(formatAptAmount(balance));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  // Roulette game functions
  const placeRouletteBet = useCallback(async (betType, betValue, amount, numbers = []) => {
    if (!connected || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.roulette.placeBet(betType, betValue, parseAptAmount(amount), numbers);
      
      const response = await wallet.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });
      
      // Update balance after transaction
      await updateBalance();
      
      return response.hash;
    } catch (error) {
      console.error('Roulette bet failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, wallet, updateBalance]);

  const getRouletteGameState = useCallback(async () => {
    try {
      return await CasinoGames.roulette.getGameState();
    } catch (error) {
      console.error('Error getting roulette game state:', error);
      return null;
    }
  }, []);

  // Mines game functions
  const startMinesGame = useCallback(async (betAmount, minesCount, tilesToReveal) => {
    if (!connected || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.mines.startGame(parseAptAmount(betAmount), minesCount, tilesToReveal);
      
      const response = await wallet.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });
      
      // Update balance after transaction
      await updateBalance();
      
      return response.hash;
    } catch (error) {
      console.error('Mines game start failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, wallet, updateBalance]);

  const revealMinesTile = useCallback(async (tileIndex) => {
    if (!connected || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.mines.revealTile(tileIndex);
      
      const response = await wallet.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });
      
      return response.hash;
    } catch (error) {
      console.error('Mines tile reveal failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, wallet]);

  const cashoutMinesGame = useCallback(async () => {
    if (!connected || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.mines.cashout();
      
      const response = await wallet.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });
      
      // Update balance after transaction
      await updateBalance();
      
      return response.hash;
    } catch (error) {
      console.error('Mines cashout failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, wallet, updateBalance]);

  const getMinesGameState = useCallback(async () => {
    try {
      return await CasinoGames.mines.getGameState();
    } catch (error) {
      console.error('Error getting mines game state:', error);
      return null;
    }
  }, []);

  // Wheel game functions
  const spinWheel = useCallback(async (betAmount, riskLevel) => {
    if (!connected || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const payload = CasinoGames.wheel.spin(parseAptAmount(betAmount), riskLevel);
      
      const response = await wallet.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });
      
      // Update balance after transaction
      await updateBalance();
      
      return response.hash;
    } catch (error) {
      console.error('Wheel spin failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, wallet, updateBalance]);

  const getWheelGameState = useCallback(async () => {
    try {
      return await CasinoGames.wheel.getGameState();
    } catch (error) {
      console.error('Error getting wheel game state:', error);
      return null;
    }
  }, []);

  // Helper function to get account balance
  const getAccountBalance = async (address) => {
    try {
      const resources = await aptosClient.getAccountResources({ accountAddress: address });
      const aptCoinResource = resources.find(r => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
      
      if (aptCoinResource) {
        return aptCoinResource.data.coin.value;
      }
      return "0";
    } catch (error) {
      console.error("Error getting account balance:", error);
      return "0";
    }
  };

  return {
    // State
    balance,
    loading,
    error,
    connected,
    account: account?.address,
    
    // Roulette functions
    placeRouletteBet,
    getRouletteGameState,
    
    // Mines functions
    startMinesGame,
    revealMinesTile,
    cashoutMinesGame,
    getMinesGameState,
    
    // Wheel functions
    spinWheel,
    getWheelGameState,
    
    // Utility functions
    updateBalance,
    formatAptAmount,
    parseAptAmount,
  };
}; 