import type { SupabaseClient } from '@supabase/supabase-js';
import { IPO_SALE } from '@/lib/config/ipo';

const COMMITTED_STATUSES = ['fulfilled', 'pending_supply', 'pending'] as const;

/** APTC already reserved across open IPO purchases (excludes failed). */
export async function getIpoCommittedAptc(
  db: SupabaseClient,
  excludePurchaseId?: number | null,
): Promise<number> {
  const { data: rows } = await db
    .from('ipo_purchases')
    .select('id, aptc_amount')
    .in('status', [...COMMITTED_STATUSES]);

  let total = 0;
  for (const row of rows || []) {
    if (excludePurchaseId != null && Number(row.id) === Number(excludePurchaseId)) continue;
    total += Number(row.aptc_amount) || 0;
  }
  return total;
}

export function getIpoInventoryCapAptc(): number {
  const fromEnv = Number(process.env.IPO_SALE_CAP_APTC);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return IPO_SALE.saleTokens;
}

export async function getIpoInventoryState(
  db: SupabaseClient,
  excludePurchaseId?: number | null,
): Promise<{
  inventoryCapAptc: number;
  committedAptc: number;
  remainingAptc: number;
  soldOut: boolean;
  pctOfInventory: number;
}> {
  const inventoryCapAptc = getIpoInventoryCapAptc();
  const committedAptc = await getIpoCommittedAptc(db, excludePurchaseId);
  const remainingAptc = Math.max(0, inventoryCapAptc - committedAptc);
  const pctOfInventory =
    inventoryCapAptc > 0 ? (committedAptc / inventoryCapAptc) * 100 : 0;
  return {
    inventoryCapAptc,
    committedAptc,
    remainingAptc,
    soldOut: remainingAptc <= 1e-8,
    pctOfInventory,
  };
}
