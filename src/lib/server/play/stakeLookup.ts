import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import type { ChainId } from '@/lib/chains/registry';

export async function findNewestOpenStakeBetRaw(
  wallet: string,
  chain: ChainId,
): Promise<bigint | null> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const now = new Date().toISOString();
  const { data: rows, error } = await db
    .from('play_pending_stakes')
    .select('bet_raw')
    .eq('wallet', wallet)
    .eq('chain', chain)
    .is('consumed_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const row = rows?.[0];
  if (!row) return null;
  const betRaw = BigInt(String(row.bet_raw ?? '0'));
  return betRaw > 0n ? betRaw : null;
}
