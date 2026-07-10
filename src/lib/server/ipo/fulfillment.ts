import type { SupabaseClient } from '@supabase/supabase-js';
import { getIpoServerConfig } from './config';
import { estimateStakingReward } from './pricing';
import { sendIpoAptcToStakingVault } from './settlement';

function isInsufficientInventory(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /insufficient token balance|insufficient APTC/i.test(err.message);
}

/** Retry queued IPO purchases when treasury APTC inventory is replenished. */
export async function fulfillPendingSupplyPurchases(db: SupabaseClient): Promise<{
  fulfilled: number;
  stillPending: number;
  errors: string[];
}> {
  const cfg = getIpoServerConfig();
  const errors: string[] = [];
  let fulfilled = 0;

  const { data: pendingRows } = await db
    .from('ipo_purchases')
    .select('*')
    .eq('status', 'pending_supply')
    .order('created_at', { ascending: true })
    .limit(50);

  for (const row of pendingRows || []) {
    try {
      const aptcAmount = Number(row.aptc_amount);
      const wallet = row.buyer_wallet;
      const { signature: aptcTxHash } = await sendIpoAptcToStakingVault(aptcAmount, cfg.mint);

      const startAt = new Date();
      const unlockAt = new Date(startAt.getTime() + cfg.stakingLockDays * 86_400_000);
      const estReward = estimateStakingReward(aptcAmount, cfg.stakingApyBps, cfg.stakingLockDays);

      let stakePosId: number | null = row.staking_position_id ?? null;
      if (!stakePosId) {
        const { data: stakePos } = await db
          .from('staking_positions')
          .insert({
            user_address: wallet,
            currency: 'APTC',
            pool_key: 'IPO_30D',
            lock_days: cfg.stakingLockDays,
            apy_bps: cfg.stakingApyBps,
            amount: aptcAmount,
            start_at: startAt.toISOString(),
            unlock_at: unlockAt.toISOString(),
            status: 'active',
            reward_amount: estReward,
            tx_hash: aptcTxHash,
          })
          .select('id')
          .single();
        stakePosId = stakePos?.id ?? null;

        if (stakePosId) {
          await db.from('staking_ledger').insert({
            user_address: wallet,
            position_id: stakePosId,
            currency: 'APTC',
            operation: 'stake',
            amount: aptcAmount,
            reward_amount: estReward,
            tx_hash: aptcTxHash,
          });
        }
      }

      await db
        .from('ipo_purchases')
        .update({
          status: 'fulfilled',
          aptc_tx_hash: aptcTxHash,
          staking_position_id: stakePosId,
          fulfilled_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', row.id)
        .eq('status', 'pending_supply');

      fulfilled += 1;
    } catch (e) {
      if (isInsufficientInventory(e)) break;
      errors.push(e instanceof Error ? e.message : `Purchase ${row.id} failed`);
    }
  }

  const { count } = await db
    .from('ipo_purchases')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_supply');

  return { fulfilled, stillPending: count ?? 0, errors };
}
