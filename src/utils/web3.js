import { ethers } from 'ethers';
import { NETWORKS, CONTRACTS } from '../config/contracts';

export const getProvider = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return new ethers.JsonRpcProvider(NETWORKS.PHAROS_SEPOLIA.rpcUrls[0]);
  }
  return new ethers.BrowserProvider(window.ethereum);
};

export const getTokenContract = async (withSigner = false) => {
  const provider = getProvider();
  const contract = new ethers.Contract(
    CONTRACTS.PHAROS_SEPOLIA.token.address,
    CONTRACTS.PHAROS_SEPOLIA.token.abi,
    provider
  );

  if (withSigner) {
    const signer = await provider.getSigner();
    return contract.connect(signer);
  }

  return contract;
};

export const getRouletteContract = async (withSigner = false) => {
  const provider = getProvider();
  
  // Get the current chain ID
  let chainId;
  if (typeof window !== 'undefined' && window.ethereum) {
    chainId = await window.ethereum.request({ method: 'eth_chainId' });
  }

  // Select the appropriate contract address based on the network
  const contractConfig = chainId === '0x138b' 
    ? CONTRACTS.MANTLE_SEPOLIA.roulette 
    : CONTRACTS.PHAROS_SEPOLIA.roulette;

  const contract = new ethers.Contract(
    contractConfig.address,
    contractConfig.abi,
    provider
  );

  if (withSigner) {
    const signer = await provider.getSigner();
    return contract.connect(signer);
  }

  return contract;
};

export const switchToPharosSepolia = async () => {
  if (typeof window === 'undefined' || !window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORKS.PHAROS_SEPOLIA.chainId }],
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [NETWORKS.PHAROS_SEPOLIA],
      });
    }
  }
};

export const formatTokenAmount = (amount, decimals = 18) => {
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount, decimals = 18) => {
  return ethers.parseUnits(amount.toString(), decimals);
}; 