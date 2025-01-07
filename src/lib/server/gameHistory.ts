import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export const OCTAS = 100_000_000n;

export const GAME_TYPE_TO_SLUG: Record<number, string> = {
  1: 'plinko',
  2: 'mines',
  3: 'roulette',
  4: 'wheel',
};

export type RawGame = Record<string, unknown>;

export function networkFromEnv(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  if (n === 'testnet') return Network.TESTNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.MAINNET;
}

export function u64(g: RawGame, key: string): bigint {
  const v = g[key];
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return BigInt(Math.trunc(v));
  try {
    return BigInt(String(v ?? '0'));
  } catch {
    return 0n;
  }
}

export function u8(g: RawGame, key: string): number {
  const v = g[key];
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function readPlayerAddress(g: RawGame): string {
  const v = g.player_address;
  if (typeof v === 'string') return normalizeAptosAddr(v);
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.value === 'string') return normalizeAptosAddr(obj.value);
    if (typeof obj.bytes === 'string') return normalizeAptosAddr(obj.bytes);
    if (typeof obj.inner === 'string') return normalizeAptosAddr(obj.inner);
  }
  return '';
}

export function normalizeAptosAddr(addr: string): string {
  if (!addr) return '';
  let hex = addr.trim().toLowerCase();
  hex = hex.replace(/^0x/, '');
  if (!/^[0-9a-f]+$/.test(hex)) return '';
  hex = hex.padStart(64, '0');
  return `0x${hex}`;
}

export async function fetchGameHistory(): Promise<{ games: RawGame[]; moduleAddress: string | null }> {
  const moduleAddr = process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS;
  if (!moduleAddr) return { games: [], moduleAddress: null };
  const aptos = new Aptos(new AptosConfig({ network: networkFromEnv() }));
  const history = await aptos.view({
    payload: {
      function: `${moduleAddr}::game_logger::get_game_history`,
      functionArguments: [moduleAddr],
    },
  });
  const games = (history[0] as RawGame[]) || [];
  return { games, moduleAddress: moduleAddr };
}

export type VolumeRow = {
  wallet: string;
  walletShort: string;
  volumeOctas: bigint;
  volumeApt: number;
  bets: number;
};

export function shortenWallet(addr: string): string {
  const norm = normalizeAptosAddr(addr) || (addr.startsWith('0x') ? addr : `0x${addr}`);
  if (norm.length <= 12) return norm;
  return `${norm.slice(0, 6)}…${norm.slice(-4)}`;
}

/**
 * Sum bet_amount per wallet for rounds in [startSec, endSec] inclusive,
 * only for games whose slug is in includedSlugs (lowercase).
 */
export function aggregateWagerVolumeByWallet(
  games: RawGame[],
  startSec: bigint,
  endSec: bigint,
  includedSlugs: Set<string>,
): VolumeRow[] {
  const byWallet = new Map<string, { volume: bigint; bets: number }>();

  for (const g of games) {
    const ts = u64(g, 'timestamp');
    if (ts < startSec || ts > endSec) continue;

    const gt = u8(g, 'game_type');
    const slug = GAME_TYPE_TO_SLUG[gt];
    if (!slug || !includedSlugs.has(slug)) continue;

    const player = readPlayerAddress(g);
    if (!player) continue;

    const bet = u64(g, 'bet_amount');
    const cur = byWallet.get(player) || { volume: 0n, bets: 0 };
    cur.volume += bet;
    cur.bets += 1;
    byWallet.set(player, cur);
  }

  const rows: VolumeRow[] = [...byWallet.entries()].map(([wallet, v]) => ({
    wallet,
    walletShort: shortenWallet(wallet),
    volumeOctas: v.volume,
    volumeApt: Number(v.volume) / Number(OCTAS),
    bets: v.bets,
  }));

  rows.sort((a, b) => (b.volumeOctas > a.volumeOctas ? 1 : b.volumeOctas < a.volumeOctas ? -1 : 0));
  return rows;
}

export type RegisteredWindows = Map<string, { startSec: bigint; endSec: bigint }>;

/**
 * Volume per **registered** wallet, each scoped to its own [startSec, endSec] window
 * (typically max(contest.starts_at, registered_at) -> contest.ends_at). Wallets not
 * in `windows` are excluded entirely. Wallets in `windows` with zero qualifying bets
 * still appear with volume 0 / bets 0.
 */
export function aggregateRegisteredWagerVolume(
  games: RawGame[],
  windows: RegisteredWindows,
  includedSlugs: Set<string>,
): VolumeRow[] {
  const byWallet = new Map<string, { volume: bigint; bets: number }>();

  for (const wallet of windows.keys()) {
    byWallet.set(wallet, { volume: 0n, bets: 0 });
  }

  for (const g of games) {
    const player = readPlayerAddress(g);
    if (!player) continue;
    const w = windows.get(player);
    if (!w) continue;

    const ts = u64(g, 'timestamp');
    if (ts < w.startSec || ts > w.endSec) continue;

    const gt = u8(g, 'game_type');
    const slug = GAME_TYPE_TO_SLUG[gt];
    if (!slug || !includedSlugs.has(slug)) continue;

    const bet = u64(g, 'bet_amount');
    const cur = byWallet.get(player) || { volume: 0n, bets: 0 };
    cur.volume += bet;
    cur.bets += 1;
    byWallet.set(player, cur);
  }

  const rows: VolumeRow[] = [...byWallet.entries()].map(([wallet, v]) => ({
    wallet,
    walletShort: shortenWallet(wallet),
    volumeOctas: v.volume,
    volumeApt: Number(v.volume) / Number(OCTAS),
    bets: v.bets,
  }));

  rows.sort((a, b) => (b.volumeOctas > a.volumeOctas ? 1 : b.volumeOctas < a.volumeOctas ? -1 : 0));
  return rows;
}
