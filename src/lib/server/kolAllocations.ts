import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { hashPortalPassword, verifyPortalPassword } from '@/lib/server/kolPortalAuth';

/** 0.1% of 1B max supply */
export const KOL_DEFAULT_AMOUNT_APTC = Number(process.env.KOL_ALLOCATION_APTC ?? 1_000_000);
export const KOL_DEFAULT_LOCK_DAYS = Number(process.env.KOL_ALLOCATION_LOCK_DAYS ?? 14);
export const KOL_DEFAULT_PCT_SUPPLY = 0.1;

export type KolAllocationStatus = 'locked' | 'ready' | 'fulfilled' | 'revoked';

export type KolAllocationRow = {
  id: string;
  kol_slug: string;
  display_name: string;
  wallet_address: string;
  amount_aptc: number | string;
  pct_of_supply: number | string;
  lock_days: number;
  locked_at: string;
  unlock_at: string;
  status: KolAllocationStatus;
  portal_password_hash: string;
  fulfillment_tx_hash: string | null;
  fulfilled_at: string | null;
  created_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type KolAllocationPublic = {
  id: string;
  slug: string;
  displayName: string;
  walletAddress: string;
  walletShort: string;
  amountAptc: number;
  pctOfSupply: number;
  lockDays: number;
  lockedAt: string;
  unlockAt: string;
  status: KolAllocationStatus;
  effectiveStatus: 'locked' | 'ready' | 'fulfilled' | 'revoked';
  isUnlockReady: boolean;
  secondsUntilUnlock: number;
  fulfillmentTxHash: string | null;
  fulfilledAt: string | null;
  portalUrl: string;
};

export function normalizeKolSlug(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function isValidKolSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/.test(slug);
}

export function computeUnlockAt(from = new Date(), lockDays = KOL_DEFAULT_LOCK_DAYS): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + lockDays);
  return d.toISOString();
}

export function shortSolanaWallet(addr: string): string {
  const s = String(addr || '').trim();
  if (s.length <= 12) return s;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function effectiveStatus(row: KolAllocationRow): KolAllocationPublic['effectiveStatus'] {
  if (row.status === 'revoked' || row.status === 'fulfilled') return row.status;
  const unlockMs = new Date(String(row.unlock_at)).getTime();
  if (unlockMs <= Date.now()) return 'ready';
  return 'locked';
}

export function formatKolAllocationPublic(
  row: KolAllocationRow,
  siteOrigin?: string,
): KolAllocationPublic {
  const unlockMs = new Date(String(row.unlock_at)).getTime();
  const now = Date.now();
  const effective = effectiveStatus(row);
  const origin = siteOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'https://aptcasino.com';

  return {
    id: row.id,
    slug: row.kol_slug,
    displayName: row.display_name,
    walletAddress: row.wallet_address,
    walletShort: shortSolanaWallet(row.wallet_address),
    amountAptc: Number(row.amount_aptc),
    pctOfSupply: Number(row.pct_of_supply),
    lockDays: row.lock_days,
    lockedAt: row.locked_at,
    unlockAt: row.unlock_at,
    status: row.status,
    effectiveStatus: effective,
    isUnlockReady: effective === 'ready' || effective === 'fulfilled',
    secondsUntilUnlock: Math.max(0, Math.floor((unlockMs - now) / 1000)),
    fulfillmentTxHash: row.fulfillment_tx_hash,
    fulfilledAt: row.fulfilled_at,
    portalUrl: `${origin.replace(/\/$/, '')}/kol/${row.kol_slug}`,
  };
}

export function formatKolAllocationAdmin(row: KolAllocationRow, siteOrigin?: string) {
  const pub = formatKolAllocationPublic(row, siteOrigin);
  return {
    ...pub,
    adminNotes: row.admin_notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listKolAllocations(status?: string) {
  const db = getSupabaseAdmin();
  if (!db) return [];

  let q = db.from('kol_allocations').select('*').order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as KolAllocationRow[];
  rows = await Promise.all(rows.map((row) => syncKolReadyStatus(row)));

  if (status && status !== 'all') {
    rows = rows.filter((row) => effectiveStatus(row) === status || row.status === status);
  }

  return rows;
}

export async function getKolAllocationBySlug(slug: string) {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from('kol_allocations')
    .select('*')
    .eq('kol_slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as KolAllocationRow | null) ?? null;
}

export async function getKolAllocationById(id: string) {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db.from('kol_allocations').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as KolAllocationRow | null) ?? null;
}

export async function createKolAllocation(input: {
  slug: string;
  displayName: string;
  walletAddress: string;
  portalPassword: string;
  adminNotes?: string;
  createdBy?: string;
  amountAptc?: number;
  lockDays?: number;
}) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const slug = normalizeKolSlug(input.slug);
  if (!isValidKolSlug(slug)) {
    throw new Error('Invalid slug — use lowercase letters, numbers, and hyphens');
  }

  const wallet = String(input.walletAddress || '').trim();
  if (wallet.length < 32) throw new Error('Valid Solana wallet address required');

  const password = String(input.portalPassword || '').trim();
  if (password.length < 6) throw new Error('Portal password must be at least 6 characters');

  const lockedAt = new Date();
  const lockDays = input.lockDays ?? KOL_DEFAULT_LOCK_DAYS;
  const amountAptc = input.amountAptc ?? KOL_DEFAULT_AMOUNT_APTC;

  const { data, error } = await db
    .from('kol_allocations')
    .insert({
      kol_slug: slug,
      display_name: input.displayName.trim(),
      wallet_address: wallet,
      amount_aptc: amountAptc,
      pct_of_supply: KOL_DEFAULT_PCT_SUPPLY,
      lock_days: lockDays,
      locked_at: lockedAt.toISOString(),
      unlock_at: computeUnlockAt(lockedAt, lockDays),
      status: 'locked',
      portal_password_hash: hashPortalPassword(password),
      admin_notes: input.adminNotes?.trim() || null,
      created_by: input.createdBy?.trim() || 'admin',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('A KOL with this slug already exists');
    throw new Error(error.message);
  }

  return data as KolAllocationRow;
}

export async function updateKolAllocation(
  id: string,
  patch: {
    walletAddress?: string;
    displayName?: string;
    portalPassword?: string;
    adminNotes?: string;
    status?: KolAllocationStatus;
  },
) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.walletAddress != null) {
    const w = patch.walletAddress.trim();
    if (w.length < 32) throw new Error('Valid Solana wallet address required');
    updates.wallet_address = w;
  }
  if (patch.displayName != null) updates.display_name = patch.displayName.trim();
  if (patch.adminNotes != null) updates.admin_notes = patch.adminNotes.trim() || null;
  if (patch.portalPassword != null) {
    const p = patch.portalPassword.trim();
    if (p.length < 6) throw new Error('Portal password must be at least 6 characters');
    updates.portal_password_hash = hashPortalPassword(p);
  }
  if (patch.status != null) updates.status = patch.status;

  const { data, error } = await db
    .from('kol_allocations')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as KolAllocationRow;
}

export async function syncKolReadyStatus(row: KolAllocationRow): Promise<KolAllocationRow> {
  if (row.status !== 'locked') return row;
  const unlockMs = new Date(String(row.unlock_at)).getTime();
  if (unlockMs > Date.now()) return row;

  const db = getSupabaseAdmin();
  if (!db) return row;

  const { data, error } = await db
    .from('kol_allocations')
    .update({ status: 'ready', updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', 'locked')
    .select('*')
    .single();

  if (error || !data) return row;
  return data as KolAllocationRow;
}

export async function fulfillKolAllocation(input: {
  id: string;
  fulfillmentTxHash?: string;
  adminNotes?: string;
}) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  let row = await getKolAllocationById(input.id);
  if (!row) throw new Error('Allocation not found');
  if (row.status === 'revoked') throw new Error('Allocation was revoked');
  if (row.status === 'fulfilled') throw new Error('Already fulfilled');

  row = await syncKolReadyStatus(row);
  const unlockMs = new Date(String(row.unlock_at)).getTime();
  if (unlockMs > Date.now()) {
    throw new Error('14-day lock has not ended yet');
  }

  const { data, error } = await db
    .from('kol_allocations')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      fulfillment_tx_hash: input.fulfillmentTxHash?.trim() || null,
      admin_notes: input.adminNotes?.trim() || row.admin_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as KolAllocationRow;
}

export async function authenticateKolPortal(slug: string, password: string) {
  const row = await getKolAllocationBySlug(slug);
  if (!row || row.status === 'revoked') return null;
  if (!verifyPortalPassword(password, row.portal_password_hash)) return null;
  return syncKolReadyStatus(row);
}
