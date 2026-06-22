import { getSiteUrl } from '@/lib/siteMetadata';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { hashPortalPassword, verifyPortalPassword } from '@/lib/server/kolPortalAuth';

export const KOL_MAX_SUPPLY_APTC = 1_000_000_000;

/** 0.1% of 1B max supply */
export const KOL_DEFAULT_AMOUNT_APTC = Number(process.env.KOL_ALLOCATION_APTC ?? 1_000_000);
export const KOL_DEFAULT_LOCK_DAYS = Number(process.env.KOL_ALLOCATION_LOCK_DAYS ?? 14);
export const KOL_DEFAULT_CLIFF_DAYS = Number(process.env.KOL_ALLOCATION_CLIFF_DAYS ?? 14);

export function aptcPctOfSupply(amountAptc: number): number {
  if (!Number.isFinite(amountAptc) || amountAptc <= 0) return 0;
  return Math.round((amountAptc / KOL_MAX_SUPPLY_APTC) * 1_000_000) / 10_000;
}

export function validateKolLockTerms(lockDays: number, cliffDays: number) {
  if (!Number.isFinite(lockDays) || lockDays < 1 || lockDays > 3650) {
    throw new Error('Lock duration must be between 1 and 3650 days');
  }
  if (!Number.isFinite(cliffDays) || cliffDays < 0 || cliffDays > lockDays) {
    throw new Error('Cliff period must be between 0 and the lock duration');
  }
}

function parseIsoDate(value: string, label: string): Date {
  const d = new Date(String(value || '').trim());
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ${label}`);
  return d;
}

function lockDaysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) throw new Error('Unlock time must be after lock start');
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export type KolAllocationStatus = 'locked' | 'ready' | 'fulfilled' | 'revoked';

export type KolPartnerMeta = {
  xHandle: string | null;
  country: string | null;
  telegram: string | null;
  avgPostViews: number | null;
  promotionCondition: string | null;
  broughtBy: string | null;
  broughtOn: string | null;
};

export type KolAllocationRow = {
  id: string;
  kol_slug: string;
  display_name: string;
  wallet_address: string;
  amount_aptc: number | string;
  pct_of_supply: number | string;
  lock_days: number;
  cliff_days: number;
  locked_at: string;
  unlock_at: string;
  status: KolAllocationStatus;
  portal_password_hash: string;
  portal_password_plain: string | null;
  fulfillment_tx_hash: string | null;
  fulfilled_at: string | null;
  created_by: string | null;
  admin_notes: string | null;
  x_handle: string | null;
  country: string | null;
  telegram: string | null;
  avg_post_views: number | null;
  promotion_condition: string | null;
  brought_by: string | null;
  brought_on: string | null;
  created_at: string;
  updated_at: string;
};

function optionalText(value: string | null | undefined): string | null {
  const s = String(value ?? '').trim();
  return s || null;
}

function optionalPostViews(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Avg post views must be a non-negative number');
  return Math.trunc(n);
}

function optionalDate(value: string | null | undefined): string | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Brought on date must be YYYY-MM-DD');
  return s;
}

function partnerMetaFromRow(row: KolAllocationRow): KolPartnerMeta {
  return {
    xHandle: row.x_handle ?? null,
    country: row.country ?? null,
    telegram: row.telegram ?? null,
    avgPostViews: row.avg_post_views ?? null,
    promotionCondition: row.promotion_condition ?? null,
    broughtBy: row.brought_by ?? null,
    broughtOn: row.brought_on ?? null,
  };
}

function partnerMetaToDb(input: Partial<KolPartnerMeta>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.xHandle !== undefined) out.x_handle = optionalText(input.xHandle);
  if (input.country !== undefined) out.country = optionalText(input.country);
  if (input.telegram !== undefined) out.telegram = optionalText(input.telegram);
  if (input.avgPostViews !== undefined) out.avg_post_views = optionalPostViews(input.avgPostViews);
  if (input.promotionCondition !== undefined) out.promotion_condition = optionalText(input.promotionCondition);
  if (input.broughtBy !== undefined) out.brought_by = optionalText(input.broughtBy);
  if (input.broughtOn !== undefined) out.brought_on = optionalDate(input.broughtOn);
  return out;
}

export type KolAllocationPublic = {
  id: string;
  slug: string;
  displayName: string;
  walletAddress: string;
  walletShort: string;
  amountAptc: number;
  pctOfSupply: number;
  lockDays: number;
  cliffDays: number;
  cliffEndsAt: string;
  lockedAt: string;
  unlockAt: string;
  secondsUntilCliff: number;
  status: KolAllocationStatus;
  effectiveStatus: 'locked' | 'ready' | 'fulfilled' | 'revoked';
  isUnlockReady: boolean;
  secondsUntilUnlock: number;
  fulfillmentTxHash: string | null;
  fulfilledAt: string | null;
  portalUrl: string;
} & KolPartnerMeta;

export function normalizeKolSlug(raw: string): string {
  const input = String(raw || '').trim().toLowerCase().slice(0, 64);
  const chars: string[] = [];
  let prevHyphen = false;
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    if (isLower || isDigit) {
      chars.push(ch);
      prevHyphen = false;
      continue;
    }
    if (ch === '-' && !prevHyphen && chars.length > 0) {
      chars.push('-');
      prevHyphen = true;
    }
  }
  while (chars.length > 0 && chars[chars.length - 1] === '-') chars.pop();
  return chars.join('').slice(0, 48);
}

export function isValidKolSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/.test(slug);
}

export function computeUnlockAt(from = new Date(), lockDays = KOL_DEFAULT_LOCK_DAYS): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + lockDays);
  return d.toISOString();
}

export function computeCliffEndsAt(from = new Date(), cliffDays = KOL_DEFAULT_CLIFF_DAYS): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + cliffDays);
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
  const cliffDays = Number(row.cliff_days ?? row.lock_days ?? KOL_DEFAULT_CLIFF_DAYS);
  const cliffEndsAt = computeCliffEndsAt(new Date(String(row.locked_at)), cliffDays);
  const cliffMs = new Date(cliffEndsAt).getTime();
  const now = Date.now();
  const effective = effectiveStatus(row);
  const origin = siteOrigin || getSiteUrl();

  return {
    id: row.id,
    slug: row.kol_slug,
    displayName: row.display_name,
    walletAddress: row.wallet_address,
    walletShort: shortSolanaWallet(row.wallet_address),
    amountAptc: Number(row.amount_aptc),
    pctOfSupply: Number(row.pct_of_supply),
    lockDays: row.lock_days,
    cliffDays,
    cliffEndsAt,
    lockedAt: row.locked_at,
    unlockAt: row.unlock_at,
    secondsUntilCliff: Math.max(0, Math.floor((cliffMs - now) / 1000)),
    status: row.status,
    effectiveStatus: effective,
    isUnlockReady: effective === 'ready' || effective === 'fulfilled',
    secondsUntilUnlock: Math.max(0, Math.floor((unlockMs - now) / 1000)),
    fulfillmentTxHash: row.fulfillment_tx_hash,
    fulfilledAt: row.fulfilled_at,
    portalUrl: `${origin.replace(/\/$/, '')}/kol/${row.kol_slug}`,
    ...partnerMetaFromRow(row),
  };
}

export function formatKolAllocationAdmin(row: KolAllocationRow, siteOrigin?: string) {
  const pub = formatKolAllocationPublic(row, siteOrigin);
  return {
    ...pub,
    ...partnerMetaFromRow(row),
    portalPassword: row.portal_password_plain ?? null,
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
  cliffDays?: number;
  lockedAt?: string;
} & Partial<KolPartnerMeta>) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const slugSource = String(input.slug || input.telegram || '').trim();
  const slug = normalizeKolSlug(slugSource);
  if (!isValidKolSlug(slug)) {
    throw new Error('Invalid slug — use lowercase letters, numbers, and hyphens');
  }

  const displayName =
    input.displayName?.trim() ||
    slugSource.replace(/^@+/, '').trim() ||
    slug;

  const wallet = String(input.walletAddress || '').trim();
  if (wallet.length < 32) throw new Error('Valid Solana wallet address required');

  const password = String(input.portalPassword || '').trim();
  if (password.length < 6) throw new Error('Portal password must be at least 6 characters');

  const lockedAt = input.lockedAt ? parseIsoDate(input.lockedAt, 'lock start time') : new Date();
  const lockDays = input.lockDays ?? KOL_DEFAULT_LOCK_DAYS;
  const cliffDays = input.cliffDays ?? KOL_DEFAULT_CLIFF_DAYS;
  const amountAptc = input.amountAptc ?? KOL_DEFAULT_AMOUNT_APTC;
  validateKolLockTerms(lockDays, cliffDays);
  if (!Number.isFinite(amountAptc) || amountAptc <= 0) {
    throw new Error('APTC allocation amount must be greater than zero');
  }

  const partnerFields = partnerMetaToDb({
    xHandle: input.xHandle,
    country: input.country,
    telegram: input.telegram,
    avgPostViews: input.avgPostViews,
    promotionCondition: input.promotionCondition,
    broughtBy: input.broughtBy,
    broughtOn: input.broughtOn,
  });

  const { data, error } = await db
    .from('kol_allocations')
    .insert({
      kol_slug: slug,
      display_name: displayName.slice(0, 64),
      wallet_address: wallet,
      amount_aptc: amountAptc,
      pct_of_supply: aptcPctOfSupply(amountAptc),
      lock_days: lockDays,
      cliff_days: cliffDays,
      locked_at: lockedAt.toISOString(),
      unlock_at: computeUnlockAt(lockedAt, lockDays),
      status: 'locked',
      portal_password_hash: hashPortalPassword(password),
      portal_password_plain: password,
      admin_notes: input.adminNotes?.trim() || null,
      created_by: input.createdBy?.trim() || 'admin',
      ...partnerFields,
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
    amountAptc?: number;
    lockDays?: number;
    cliffDays?: number;
    lockedAt?: string;
    unlockAt?: string;
  } & Partial<KolPartnerMeta>,
) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const existing = await getKolAllocationById(id);
  if (!existing) throw new Error('Allocation not found');

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
    updates.portal_password_plain = p;
  }
  if (patch.status != null) updates.status = patch.status;

  Object.assign(updates, partnerMetaToDb(patch));

  if (patch.amountAptc != null) {
    const amountAptc = Number(patch.amountAptc);
    if (!Number.isFinite(amountAptc) || amountAptc <= 0) {
      throw new Error('APTC allocation amount must be greater than zero');
    }
    if (existing.status === 'fulfilled') {
      throw new Error('Cannot change amount after fulfillment');
    }
    updates.amount_aptc = amountAptc;
    updates.pct_of_supply = aptcPctOfSupply(amountAptc);
  }

  const schedulePatch =
    patch.lockedAt != null ||
    patch.unlockAt != null ||
    patch.lockDays != null ||
    patch.cliffDays != null;

  if (schedulePatch) {
    if (existing.status === 'fulfilled' || existing.status === 'revoked') {
      throw new Error('Cannot change schedule after fulfillment or revoke');
    }

    const lockedAt =
      patch.lockedAt != null
        ? parseIsoDate(patch.lockedAt, 'lock start time')
        : new Date(String(existing.locked_at));

    let lockDays = patch.lockDays ?? existing.lock_days;
    const cliffDays = patch.cliffDays ?? Number(existing.cliff_days ?? existing.lock_days);

    let unlockAt: Date;
    if (patch.unlockAt != null) {
      unlockAt = parseIsoDate(patch.unlockAt, 'unlock time');
      if (unlockAt.getTime() <= lockedAt.getTime()) {
        throw new Error('Unlock time must be after lock start');
      }
      lockDays = lockDaysBetween(lockedAt, unlockAt);
    } else {
      validateKolLockTerms(lockDays, cliffDays);
      unlockAt = new Date(computeUnlockAt(lockedAt, lockDays));
    }

    validateKolLockTerms(lockDays, cliffDays);

    updates.locked_at = lockedAt.toISOString();
    updates.lock_days = lockDays;
    updates.cliff_days = cliffDays;
    updates.unlock_at = unlockAt.toISOString();

    const unlockMs = unlockAt.getTime();
    if (existing.status === 'ready' && unlockMs > Date.now()) {
      updates.status = 'locked';
    } else if (existing.status === 'locked' && unlockMs <= Date.now()) {
      updates.status = 'ready';
    }
  }

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

export async function deleteKolAllocation(id: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const row = await getKolAllocationById(id);
  if (!row) throw new Error('Allocation not found');

  const { error } = await db.from('kol_allocations').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true as const };
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
    throw new Error('Lock period has not ended yet');
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

function localDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Reschedule unlock for many KOLs at once (admin bulk edit). */
export async function bulkUpdateKolUnlockDates(input: {
  newUnlockAt: string;
  matchUnlockDate?: string;
}) {
  const newUnlock = parseIsoDate(input.newUnlockAt, 'new unlock time');
  const matchDay = input.matchUnlockDate?.trim() || null;
  if (matchDay && !/^\d{4}-\d{2}-\d{2}$/.test(matchDay)) {
    throw new Error('Filter date must be YYYY-MM-DD');
  }

  const rows = await listKolAllocations('all');
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.status === 'fulfilled' || row.status === 'revoked') {
      skipped += 1;
      continue;
    }
    if (matchDay && localDateKey(String(row.unlock_at)) !== matchDay) {
      skipped += 1;
      continue;
    }

    await updateKolAllocation(row.id, { unlockAt: newUnlock.toISOString() });
    updated += 1;
  }

  return { updated, skipped, total: rows.length };
}

export async function authenticateKolPortal(slug: string, password: string) {
  const row = await getKolAllocationBySlug(slug);
  if (!row || row.status === 'revoked') return null;
  if (!verifyPortalPassword(password, row.portal_password_hash)) return null;
  return syncKolReadyStatus(row);
}

/** KOL changes their own portal password (requires current password + valid session). */
export async function changeKolPortalPassword(input: {
  slug: string;
  allocationId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const row = await getKolAllocationBySlug(input.slug);
  if (!row || row.id !== input.allocationId) {
    throw new Error('Allocation not found');
  }
  if (row.status === 'revoked') {
    throw new Error('This allocation is no longer active');
  }

  const current = String(input.currentPassword || '');
  const next = String(input.newPassword || '').trim();
  if (!current) throw new Error('Current password is required');
  if (next.length < 6) throw new Error('New password must be at least 6 characters');
  if (!verifyPortalPassword(current, row.portal_password_hash)) {
    throw new Error('Current password is incorrect');
  }
  if (verifyPortalPassword(next, row.portal_password_hash)) {
    throw new Error('New password must be different from your current password');
  }

  return updateKolAllocation(row.id, { portalPassword: next });
}
