"use client";

import { useState, useCallback, useEffect } from 'react';

export const useToken = (address) => {
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock balance for Aptos mainnet
  useEffect(() => {
    if (address) {
      // Simulate loading
      setIsLoading(true);

      // Mock balance data
      setTimeout(() => {
        setBalance((Math.random() * 1000 + 100).toFixed(2));
        setIsLoading(false);
      }, 1000);
    }
  }, [address]);

  const transfer = useCallback(async (to, amount) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate transfer delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful transfer
      setBalance(prev => (parseFloat(prev) - parseFloat(amount)).toFixed(2));

      return true;
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!address) return;

    try {
      setIsLoading(true);

      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock refreshed balance
      setBalance((Math.random() * 1000 + 100).toFixed(2));
    } catch (err) {
      console.error('Failed to refresh token balance:', err);
      setError('Failed to refresh token balance');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    balance,
    transfer,
    isLoading,
    error,
    refresh
  };
}; 