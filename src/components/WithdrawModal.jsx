"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaWallet, FaCoins, FaArrowRight, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { setBalance } from '@/store/balanceSlice';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { aptosClient } from '@/lib/aptos';
import { toast } from 'react-toastify';

// Treasury wallet address - in production this should be stored securely
const TREASURY_WALLET = "0xcad18bc68f2f890a21fdfbec9e6c7c72985a223e95a19d667881ea9fceba3f4b";

const WithdrawModal = ({ isOpen, onClose }) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('input'); // 'input', 'confirm', 'processing', 'success', 'error'
  const [error, setError] = useState('');

  const { userBalance } = useSelector((state) => state.balance);
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const dispatch = useDispatch();

  // Display balance in APT format
  const balanceInApt = parseFloat(userBalance || '0') / 100000000;
  const maxWithdraw = Math.max(0, balanceInApt - 0.01); // Reserve 0.01 APT for gas fees

  useEffect(() => {
    if (!isOpen) {
      setStep('input');
      setWithdrawAmount('');
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
      setError('');
    }
  };

  const validateWithdraw = () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (amount > maxWithdraw) {
      setError(`Insufficient balance. Max withdraw: ${maxWithdraw.toFixed(4)} APT`);
      return false;
    }

    if (amount < 0.001) {
      setError('Minimum withdraw amount is 0.001 APT');
      return false;
    }

    return true;
  };

  const handleWithdraw = async () => {
    if (!validateWithdraw()) return;

    if (!connected || !account) {
      setError('Please connect your wallet');
      return;
    }

    setStep('confirm');
  };

  const confirmWithdraw = async () => {
    setStep('processing');
    setIsProcessing(true);

    try {
      const amount = parseFloat(withdrawAmount);

      // Call backend API to process withdrawal from treasury
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: account.address,
          amount: amount
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      // Deduct from user's balance
      const amountOctas = Math.floor(amount * 100000000);
      const currentBalanceOctas = parseInt(userBalance || '0');
      const newBalanceOctas = currentBalanceOctas - amountOctas;
      dispatch(setBalance(newBalanceOctas.toString()));

      setStep('success');
      const txHash = result.transactionHash || result.userTxHash || result.txnHash || 'N/A';
      const txDisplay = typeof txHash === 'string' && txHash.length > 8
        ? `${txHash.slice(0, 8)}...`
        : txHash;
      toast.success(`Successfully withdrew ${amount} APT! TX: ${txDisplay}`);

      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Withdraw error:', error);
      setError(`Withdraw failed: ${error.message}`);
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'input':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaWallet className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Withdraw APT</h3>
              <p className="text-gray-400">Transfer your winnings to your wallet</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Available Balance:</span>
                <span className="text-white font-bold">{balanceInApt.toFixed(4)} APT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Max Withdraw:</span>
                <span className="text-green-400 font-bold">{maxWithdraw.toFixed(4)} APT</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Withdraw Amount (APT)</label>
              <div className="relative">
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={handleAmountChange}
                  placeholder="0.0000"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={() => setWithdrawAmount(maxWithdraw.toString())}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300 text-sm font-medium"
                >
                  MAX
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                Continue
                <FaArrowRight />
              </button>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Confirm Withdrawal</h3>
              <p className="text-gray-400">Please review your withdrawal details</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Withdraw Amount:</span>
                <span className="text-white font-bold">{withdrawAmount} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">To Wallet:</span>
                <span className="text-white font-mono text-sm">{account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network Fee:</span>
                <span className="text-yellow-400">~0.001 APT</span>
              </div>
              <hr className="border-gray-600" />
              <div className="flex justify-between">
                <span className="text-gray-400">You'll Receive:</span>
                <span className="text-green-400 font-bold">{(parseFloat(withdrawAmount) - 0.001).toFixed(4)} APT</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('input')}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={confirmWithdraw}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-white font-medium transition-all"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Processing Withdrawal</h3>
            <p className="text-gray-400">Please wait while we process your withdrawal...</p>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-bold">{withdrawAmount} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-blue-400">Processing...</span>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-2xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Withdrawal Successful!</h3>
            <p className="text-gray-400">Your APT has been sent to your wallet</p>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Amount Sent:</span>
                <span className="text-green-400 font-bold">{withdrawAmount} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">To Wallet:</span>
                <span className="text-white font-mono text-sm">{account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500">This modal will close automatically in a few seconds...</p>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTimes className="text-2xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Withdrawal Failed</h3>
            <p className="text-gray-400">There was an error processing your withdrawal</p>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('input')}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {step !== 'processing' && step !== 'success' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            )}

            {renderStep()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawModal;