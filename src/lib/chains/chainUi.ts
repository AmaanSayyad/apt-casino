import type { ChainId } from '@/lib/chains/registry';

export type ChainUiMeta = {
  logo: string;
  walletHint: string;
  badge?: string;
  badgeClass?: string;
  hoverGradient: string;
};

export const CHAIN_UI: Record<ChainId, ChainUiMeta> = {
  solana: {
    logo: '/logos/solana-sol-logo.png',
    walletHint: 'Phantom, Backpack, etc.',
    badge: 'Live',
    badgeClass: 'bg-emerald-500/20 text-emerald-400',
    hoverGradient: 'from-teal-500/0 via-teal-500/5 to-teal-500/0',
  },
  aptos: {
    logo: '/logos/aptos-logo.png',
    walletHint: 'Petra, Pontem, Martian, etc.',
    badge: 'APT',
    badgeClass: 'bg-sky-500/20 text-sky-400',
    hoverGradient: 'from-sky-500/0 via-sky-500/5 to-sky-500/0',
  },
  robinhood: {
    logo: '/logos/robinhood.png',
    walletHint: 'Under construction',
    badge: 'Under construction',
    badgeClass: 'bg-amber-500/20 text-amber-300',
    hoverGradient: 'from-emerald-500/0 via-emerald-500/5 to-emerald-500/0',
  },
  sui: {
    logo: '/logos/sui-logo.png',
    walletHint: 'Sui Wallet, Slush, etc.',
    badge: 'Soon',
    badgeClass: 'bg-blue-500/20 text-blue-400',
    hoverGradient: 'from-blue-500/0 via-blue-500/5 to-blue-500/0',
  },
  near: {
    logo: '/logos/near.png',
    walletHint: 'MyNearWallet, Meteor, Here, etc.',
    badge: 'Soon',
    badgeClass: 'bg-white/20 text-white',
    hoverGradient: 'from-white/0 via-white/5 to-white/0',
  },
  evm: {
    logo: '/logos/ethereum-eth-logo.png',
    walletHint: 'MetaMask, Rabby, etc.',
    badge: 'Soon',
    badgeClass: 'bg-violet-500/20 text-violet-400',
    hoverGradient: 'from-violet-500/0 via-violet-500/5 to-violet-500/0',
  },
  starknet: {
    logo: '/logos/starknet-strk-logo.svg',
    walletHint: 'Argent X, Braavos',
    badge: 'Soon',
    badgeClass: 'bg-indigo-400/20 text-indigo-300',
    hoverGradient: 'from-indigo-400/0 via-indigo-400/5 to-indigo-400/0',
  },
  stellar: {
    logo: '/logos/stellar-xlm-logo.png',
    walletHint: 'Freighter, Lobster, etc.',
    badge: 'Soon',
    badgeClass: 'bg-blue-400/20 text-blue-400',
    hoverGradient: 'from-blue-400/0 via-blue-400/5 to-blue-400/0',
  },
  tezos: {
    logo: '/logos/tezos-xtz-logo.png',
    walletHint: 'Temple, Kukai, etc.',
    badge: 'Soon',
    badgeClass: 'bg-indigo-500/20 text-indigo-500',
    hoverGradient: 'from-indigo-500/0 via-indigo-500/5 to-indigo-500/0',
  },
};
