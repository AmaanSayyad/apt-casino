import type { KolAllocationPublic } from '@/lib/server/kolAllocations';

type KolExportRow = KolAllocationPublic & {
  portalPassword?: string | null;
  adminNotes?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const EXPORT_COLUMNS: { key: keyof KolExportRow | 'effectiveStatus'; label: string }[] = [
  { key: 'displayName', label: 'Display Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'effectiveStatus', label: 'Status' },
  { key: 'status', label: 'DB Status' },
  { key: 'amountAptc', label: 'APTC Amount' },
  { key: 'pctOfSupply', label: '% Supply' },
  { key: 'cliffDays', label: 'Cliff Days' },
  { key: 'lockDays', label: 'Lock Days' },
  { key: 'walletAddress', label: 'Wallet Address' },
  { key: 'lockedAt', label: 'Locked At' },
  { key: 'cliffEndsAt', label: 'Cliff Ends At' },
  { key: 'unlockAt', label: 'Unlock At' },
  { key: 'xHandle', label: 'X' },
  { key: 'country', label: 'Country' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'avgPostViews', label: 'Avg Post Views' },
  { key: 'promotionCondition', label: 'Promotion Condition' },
  { key: 'broughtBy', label: 'Brought By' },
  { key: 'broughtOn', label: 'Brought On' },
  { key: 'portalUrl', label: 'Portal URL' },
  { key: 'portalPassword', label: 'Portal Password' },
  { key: 'fulfillmentTxHash', label: 'Fulfillment TX' },
  { key: 'fulfilledAt', label: 'Fulfilled At' },
  { key: 'adminNotes', label: 'Admin Notes' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'updatedAt', label: 'Updated At' },
];

function csvEscape(value: unknown): string {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function kolAllocationsToCsv(rows: KolExportRow[]): string {
  const header = EXPORT_COLUMNS.map((c) => csvEscape(c.label)).join(',');
  const body = rows
    .map((row) =>
      EXPORT_COLUMNS.map(({ key }) => {
        const value = row[key as keyof KolExportRow];
        return csvEscape(value);
      }).join(','),
    )
    .join('\n');
  return `${header}\n${body}\n`;
}

export function kolAllocationsToSheetValues(rows: KolExportRow[]): string[][] {
  const header = EXPORT_COLUMNS.map((c) => c.label);
  const body = rows.map((row) =>
    EXPORT_COLUMNS.map(({ key }) => {
      const value = row[key as keyof KolExportRow];
      return value == null ? '' : String(value);
    }),
  );
  return [header, ...body];
}
