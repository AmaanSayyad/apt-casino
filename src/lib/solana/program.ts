import { PublicKey } from '@solana/web3.js';

/** Must match `solana-programs/programs/apt_casino/src/lib.rs` */
export const CONFIG_SEED = Buffer.from('config');
export const VAULT_SEED = Buffer.from('vault');
export const PLAYER_SEED = Buffer.from('player');

export const GAME_TYPE = {
  plinko: 1,
  mines: 2,
  roulette: 3,
  wheel: 4,
} as const;

export function getAptCasinoProgramId(): PublicKey | null {
  const id = process.env.NEXT_PUBLIC_APT_CASINO_PROGRAM_ID?.trim();
  if (!id || id.includes('<')) return null;
  try {
    return new PublicKey(id);
  } catch {
    return null;
  }
}

export function getCasinoConfigPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], programId);
}

export function getCasinoVaultPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([VAULT_SEED], programId);
}

export function getPlayerLedgerPda(
  programId: PublicKey,
  player: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([PLAYER_SEED, player.toBuffer()], programId);
}

/** Solscan / explorer link for a program instruction or tx */
export function solanaExplorerTxUrl(signature: string, cluster?: string): string {
  const net = cluster || process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
  const base =
    net === 'devnet'
      ? 'https://solscan.io/tx'
      : net === 'testnet'
        ? 'https://solscan.io/tx'
        : 'https://solscan.io/tx';
  const query = net === 'mainnet-beta' ? '' : `?cluster=${net}`;
  return `${base}/${signature}${query}`;
}

export function solanaExplorerAddressUrl(address: string, cluster?: string): string {
  const net = cluster || process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
  const query = net === 'mainnet-beta' ? '' : `?cluster=${net}`;
  return `https://solscan.io/account/${address}${query}`;
}
