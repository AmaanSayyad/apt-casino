import { useState, useCallback } from 'react';
import { getRouletteContract, getTokenContract, parseTokenAmount, switchToMantleSepolia } from '../utils/web3';

export const BetType = {
  NUMBER: 0,
  COLOR: 1,
  ODDEVEN: 2,
  HIGHLOW: 3,
  DOZEN: 4,
  COLUMN: 5,
  SPLIT: 6,
  STREET: 7,
  CORNER: 8,
  LINE: 9
};

export const useRoulette = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const placeBet = useCallback(async (betType, betValue, amount, numbers = []) => {
    setIsLoading(true);
    setError(null);

    try {
      // First ensure we're on the correct network
      await switchToMantleSepolia();

      const tokenContract = await getTokenContract(true);
      const rouletteContract = await getRouletteContract(true);
      const parsedAmount = parseTokenAmount(amount);

      // Check token balance
      const signer = await tokenContract.signer;
      const balance = await tokenContract.balanceOf(signer.address);
      if (balance < parsedAmount) {
        throw new Error('Insufficient token balance');
      }

      // Check allowance
      const allowance = await tokenContract.allowance(signer.address, rouletteContract.target);
      if (allowance < parsedAmount) {
        console.log('Approving tokens...');
        const approveTx = await tokenContract.approve(rouletteContract.target, parsedAmount);
        await approveTx.wait();
      }

      // Place the bet
      console.log('Placing bet...');
      const tx = await rouletteContract.placeBet(betType, betValue, parsedAmount, numbers, {
        gasLimit: 500000 // Add explicit gas limit
      });
      
      const receipt = await tx.wait();
      console.log('Bet placed:', receipt);

      // Look for the BetPlaced event
      const betPlacedEvent = receipt.logs.find(
        log => log.topics[0] === rouletteContract.interface.getEventTopic('BetPlaced')
      );

      if (betPlacedEvent) {
        const parsedEvent = rouletteContract.interface.parseLog({
          topics: betPlacedEvent.topics,
          data: betPlacedEvent.data
        });
        console.log('Bet event:', parsedEvent);
      }

      return true;
    } catch (err) {
      console.error('Betting error:', err);
      setError(err.message || 'Failed to place bet');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLastResult = useCallback(async () => {
    try {
      const contract = await getRouletteContract();
      const result = await contract.randomResult();
      setLastResult(Number(result));
      return Number(result);
    } catch (err) {
      console.error('Error getting last result:', err);
      setError(err.message);
      return null;
    }
  }, []);

  return {
    placeBet,
    getLastResult,
    isLoading,
    error,
    lastResult
  };
}; 