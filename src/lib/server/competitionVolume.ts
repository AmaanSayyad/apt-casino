import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getPlayChainConfig } from '@/lib/chains/registry';
import {
  aggregateRegisteredWagerVolume,
  fetchGameHistory,
  normalizeAptosAddr,
  type RegisteredWindows,
  type VolumeRow,
} from '@/lib/server/gameHistory';
import { inferChainFromWallet, normalizeWalletForChain, walletsMatch } from '@/lib/server/referrals';

export function shortenWalletDisplay(wallet: string): string {
  if (!wallet) return '—';
  if (wallet.startsWith('0x') && wallet.length > 12) {
    return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  }
  if (wallet.length > 12) return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
  return wallet;
}

/** Build per-wallet contest windows from registration rows. */
export function buildRegisteredWindows(
  regs: { wallet: string; registered_at: string }[],
  contestStartSec: bigint,
  contestEndSec: bigint,
): RegisteredWindows {
  const windows: RegisteredWindows = new Map();
  for (const r of regs) {
    const chain = inferChainFromWallet(r.wallet);
    const norm = normalizeWalletForChain(r.wallet, chain);
    if (!norm) continue;
    const regSec = BigInt(Math.floor(new Date(r.registered_at).getTime() / 1000));
    const startSec = regSec > contestStartSec ? regSec : contestStartSec;
    windows.set(norm, { startSec, endSec: contestEndSec });
  }
  return windows;
}

/** Aptos on-chain game_logger volume for registered wallets. */
export async function aggregateAptosCupVolume(
  windows: RegisteredWindows,
  includedSlugs: Set<string>,
): Promise<VolumeRow[]> {
  const aptosWindows: RegisteredWindows = new Map();
  for (const [w, range] of windows) {
    if (inferChainFromWallet(w) === 'aptos') aptosWindows.set(normalizeAptosAddr(w), range);
  }
  if (aptosWindows.size === 0) return [];

  let games: Awaited<ReturnType<typeof fetchGameHistory>>['games'] = [];
  try {
    const res = await fetchGameHistory();
    games = res.games;
  } catch (e) {
    console.warn('[competitionVolume] fetchGameHistory', e);
  }
  return aggregateRegisteredWagerVolume(games, aptosWindows, includedSlugs);
}

/** Solana volume from server-ledger stakes (consumed debits), not client game logs. */
export async function aggregateSolanaCupVolume(
  windows: RegisteredWindows,
  includedSlugs: Set<string>,
): Promise<VolumeRow[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const solWallets = [...windows.keys()].filter((w) => inferChainFromWallet(w) === 'solana');
  if (solWallets.length === 0) return [];

  const units = getPlayChainConfig('solana')?.units ?? 1e9;
  const minStart = [...windows.values()].reduce((m, w) => (w.startSec < m ? w.startSec : m), windows.values().next().value!.startSec);
  const maxEnd = [...windows.values()].reduce((m, w) => (w.endSec > m ? w.endSec : m), 0n);

  const { data, error } = await db
    .from('play_pending_stakes')
    .select('wallet, game, bet_raw, consumed_at')
    .eq('chain', 'solana')
    .not('consumed_at', 'is', null)
    .gte('consumed_at', new Date(Number(minStart) * 1000).toISOString())
    .lte('consumed_at', new Date(Number(maxEnd) * 1000).toISOString());

  if (error || !data) return [];

  const byWallet = new Map<string, { volume: bigint; bets: number }>();
  for (const w of solWallets) byWallet.set(w, { volume: 0n, bets: 0 });

  for (const row of data) {
    const wallet = String(row.wallet);
    let windowKey: string | null = null;
    for (const w of solWallets) {
      if (walletsMatch(w, wallet, 'solana')) {
        windowKey = w;
        break;
      }
    }
    if (!windowKey) continue;

    const slug = String(row.game || '').toLowerCase();
    if (slug && !includedSlugs.has(slug)) continue;

    const w = windows.get(windowKey)!;
    const ts = BigInt(Math.floor(new Date(String(row.consumed_at)).getTime() / 1000));
    if (ts < w.startSec || ts > w.endSec) continue;

    const bet = BigInt(row.bet_raw || 0);
    const cur = byWallet.get(windowKey)!;
    cur.volume += bet;
    cur.bets += 1;
    byWallet.set(windowKey, cur);
  }

  return [...byWallet.entries()].map(([wallet, v]) => ({
    wallet,
    walletShort: shortenWalletDisplay(wallet),
    volumeOctas: v.volume,
    volumeApt: Number(v.volume) / units,
    bets: v.bets,
  }));
}

export async function aggregateCupStandings(
  windows: RegisteredWindows,
  includedSlugs: Set<string>,
): Promise<VolumeRow[]> {
  const [apt, sol] = await Promise.all([
    aggregateAptosCupVolume(windows, includedSlugs),
    aggregateSolanaCupVolume(windows, includedSlugs),
  ]);
  const merged = [...apt, ...sol];
  merged.sort((a, b) => (b.volumeOctas > a.volumeOctas ? 1 : b.volumeOctas < a.volumeOctas ? -1 : 0));
  return merged;
}

export function findWalletRank(
  standings: VolumeRow[],
  wallet: string,
  chain: string,
): { rank: number; volume: number; bets: number } | null {
  if (!wallet) return null;
  const idx = standings.findIndex((r) => walletsMatch(r.wallet, wallet, chain));
  if (idx < 0) return null;
  return {
    rank: idx + 1,
    volume: standings[idx].volumeApt,
    bets: standings[idx].bets,
  };
}

export function isWalletRegistered(windows: RegisteredWindows, wallet: string, chain: string): boolean {
  if (!wallet) return false;
  for (const key of windows.keys()) {
    if (walletsMatch(key, wallet, chain)) return true;
  }
  return false;
}
