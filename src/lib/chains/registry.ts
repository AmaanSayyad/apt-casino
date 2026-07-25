/**
 * Multichain play registry — single source of truth for UI, wallets, balances, and APIs.
 * Order in PLAY_CHAINS defines navbar switcher order.
 *
 * To add a chain: append a PlayChainConfig, set status to 'live', implement
 * server handlers in lib/server/play/handlers/, and wire wallet provider in providers.
 */

export type ChainId =
  | 'solana'
  | 'aptos'
  | 'robinhood'
  | 'sui'
  | 'near'
  | 'starknet'
  | 'stellar'
  | 'tezos'
  | 'evm';

export type ChainStatus = 'live' | 'coming_soon';

/** How in-app play balance is updated for bets */
export type BalanceMode = 'server' | 'client';

/** Wallet adapter used when this chain is active */
export type WalletProviderId =
  | 'solana'
  | 'aptos'
  | 'sui'
  | 'near'
  | 'starknet'
  | 'stellar'
  | 'tezos'
  | 'evm';

export type PlayChainConfig = {
  id: ChainId;
  label: string;
  nativeSymbol: string;
  /** Smallest unit multiplier (lamports, octas, etc.) */
  units: number;
  status: ChainStatus;
  sortOrder: number;
  walletProvider: WalletProviderId;
  balanceMode: BalanceMode;
  /** Supabase user_house_balances.currency */
  dbCurrency: string;
  treasuryPublicEnv: string;
  feeWalletPublicEnv: string;
  /** Env keys for min/max deposit (server) — optional per chain */
  depositMinEnv?: string;
  depositMaxEnv?: string;
  withdrawMinEnv?: string;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/** Default play chain when none selected (env override). */
export const DEFAULT_PLAY_CHAIN: ChainId =
  (env('NEXT_PUBLIC_DEFAULT_PLAY_CHAIN') as ChainId) || 'solana';

/**
 * All chains in display / integration order.
 * Set status: 'live' only when wallet + deposit + play balance are wired.
 */
export const PLAY_CHAINS: PlayChainConfig[] = [
  {
    id: 'solana',
    label: 'Solana',
    nativeSymbol: 'SOL',
    units: 1_000_000_000,
    status: 'live',
    sortOrder: 0,
    walletProvider: 'solana',
    balanceMode: 'server',
    dbCurrency: 'SOL',
    treasuryPublicEnv: 'NEXT_PUBLIC_SOL_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_SOL',
    depositMinEnv: 'SOLANA_MIN_DEPOSIT_SOL',
    depositMaxEnv: 'SOLANA_MAX_DEPOSIT_SOL',
    withdrawMinEnv: 'SOLANA_MIN_WITHDRAW_SOL',
  },
  {
    id: 'aptos',
    label: 'Aptos',
    nativeSymbol: 'APT',
    units: 100_000_000,
    status: 'live',
    sortOrder: 1,
    walletProvider: 'aptos',
    balanceMode: 'server',
    dbCurrency: 'APT',
    treasuryPublicEnv: 'NEXT_PUBLIC_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_APT',
    depositMinEnv: 'APTOS_MIN_DEPOSIT_APT',
    depositMaxEnv: 'APTOS_MAX_DEPOSIT_APT',
    withdrawMinEnv: 'APTOS_MIN_WITHDRAW_APT',
  },
  {
    id: 'robinhood',
    label: 'Robinhood Chain',
    nativeSymbol: 'ETH',
    units: 1e18,
    status: 'coming_soon',
    sortOrder: 2,
    walletProvider: 'evm',
    balanceMode: 'server',
    dbCurrency: 'ETH',
    treasuryPublicEnv: 'NEXT_PUBLIC_ROBINHOOD_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_ROBINHOOD',
  },
  {
    id: 'sui',
    label: 'Sui',
    nativeSymbol: 'SUI',
    units: 1_000_000_000,
    status: 'coming_soon',
    sortOrder: 3,
    walletProvider: 'sui',
    balanceMode: 'server',
    dbCurrency: 'SUI',
    treasuryPublicEnv: 'NEXT_PUBLIC_SUI_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_SUI',
  },
  {
    id: 'near',
    label: 'NEAR',
    nativeSymbol: 'NEAR',
    units: 1e24,
    status: 'coming_soon',
    sortOrder: 4,
    walletProvider: 'near',
    balanceMode: 'server',
    dbCurrency: 'NEAR',
    treasuryPublicEnv: 'NEXT_PUBLIC_NEAR_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_NEAR',
  },
  {
    id: 'starknet',
    label: 'Starknet',
    nativeSymbol: 'STRK',
    units: 1e18,
    status: 'coming_soon',
    sortOrder: 5,
    walletProvider: 'starknet',
    balanceMode: 'server',
    dbCurrency: 'STRK',
    treasuryPublicEnv: 'NEXT_PUBLIC_STARKNET_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_STRK',
  },
  {
    id: 'stellar',
    label: 'Stellar',
    nativeSymbol: 'XLM',
    units: 10_000_000,
    status: 'coming_soon',
    sortOrder: 6,
    walletProvider: 'stellar',
    balanceMode: 'server',
    dbCurrency: 'XLM',
    treasuryPublicEnv: 'NEXT_PUBLIC_STELLAR_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_XLM',
  },
  {
    id: 'tezos',
    label: 'Tezos',
    nativeSymbol: 'XTZ',
    units: 1_000_000,
    status: 'coming_soon',
    sortOrder: 7,
    walletProvider: 'tezos',
    balanceMode: 'server',
    dbCurrency: 'XTZ',
    treasuryPublicEnv: 'NEXT_PUBLIC_TEZOS_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_XTZ',
  },
  {
    id: 'evm',
    label: 'EVM',
    nativeSymbol: 'ETH',
    units: 1e18,
    status: 'coming_soon',
    sortOrder: 8,
    walletProvider: 'evm',
    balanceMode: 'server',
    dbCurrency: 'ETH',
    treasuryPublicEnv: 'NEXT_PUBLIC_EVM_TREASURY_ADDRESS',
    feeWalletPublicEnv: 'NEXT_PUBLIC_PLATFORM_FEE_WALLET_EVM',
  },
];

const CHAIN_MAP = new Map(PLAY_CHAINS.map((c) => [c.id, c]));

export function getPlayChainConfig(chainId: string): PlayChainConfig | undefined {
  return CHAIN_MAP.get(chainId as ChainId);
}

export function isPlayableChainId(chainId: string): chainId is ChainId {
  const c = getPlayChainConfig(chainId);
  return !!c && c.status === 'live';
}

export function resolveActiveChain(chainId: string | null | undefined): ChainId {
  if (chainId && isPlayableChainId(chainId)) return chainId;
  return DEFAULT_PLAY_CHAIN;
}

/** Live chains for navbar switcher */
export function getPlayChainsForUi(): PlayChainConfig[] {
  return PLAY_CHAINS.filter((c) => c.status === 'live').sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getChainUnits(chainId: string): number {
  return getPlayChainConfig(chainId)?.units ?? getPlayChainConfig(DEFAULT_PLAY_CHAIN)!.units;
}

export function getChainSymbol(chainId: string): string {
  return getPlayChainConfig(chainId)?.nativeSymbol ?? 'SOL';
}

export function rawToDisplay(raw: string | number, chainId: string): number {
  const unit = getChainUnits(chainId);
  return Number(raw) / unit;
}

export function displayToRaw(display: number, chainId: string): number {
  const unit = getChainUnits(chainId);
  return Math.floor(Number(display) * unit);
}

/** Human-readable native amount (keeps small SOL/APT bets visible, e.g. 0.001). */
export function formatNativeAmount(amount: number | string, chainId: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return '0';
  const maxDecimals = chainId === 'solana' ? 6 : chainId === 'aptos' ? 4 : 4;
  return n
    .toFixed(maxDecimals)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
}

/** Unified REST path for chain play APIs */
export function playApiPath(chainId: string, action: 'balance' | 'bet' | 'deposit' | 'withdraw'): string {
  return `/api/chains/${chainId}/${action}`;
}

export function getResolvedTreasuryAddress(chainId: ChainId): string | null {
  const c = getPlayChainConfig(chainId);
  if (!c) return null;
  if (chainId === 'aptos') {
    return env('NEXT_PUBLIC_TREASURY_ADDRESS') || env('NEXT_PUBLIC_CASINO_MODULE_ADDRESS') || null;
  }
  if (chainId === 'solana') {
    return env(c.treasuryPublicEnv) || env('NEXT_PUBLIC_OTC_LOTTERY_SOL_WALLET') || null;
  }
  return env(c.treasuryPublicEnv) || null;
}

export function getResolvedFeeWalletAddress(chainId: ChainId): string | null {
  const c = getPlayChainConfig(chainId);
  if (!c) return null;
  if (chainId === 'aptos') {
    return env('NEXT_PUBLIC_PLATFORM_FEE_WALLET_APT') || env('NEXT_PUBLIC_FEE_RECIPIENT') || null;
  }
  return env(c.feeWalletPublicEnv) || null;
}

/** @deprecated Use PLAY_CHAINS — kept for legacy imports */
export const CHAINS = PLAY_CHAINS.map((c) => ({
  id: c.id,
  label: c.label,
  nativeSymbol: c.nativeSymbol,
  status: c.status,
  treasuryPublicEnv: c.treasuryPublicEnv,
  feeWalletPublicEnv: c.feeWalletPublicEnv,
}));

export function getChain(chainId: ChainId) {
  return CHAINS.find((c) => c.id === chainId);
}
