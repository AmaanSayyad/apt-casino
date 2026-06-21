import type { KolAllocationPublic } from '@/lib/server/kolAllocations';

export type KolExportRow = KolAllocationPublic & {
  portalPassword?: string | null;
  adminNotes?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Matches the KOLs Management Google Sheet layout. */
const SHEET_HEADERS = [
  'Platform',
  'Location',
  'Speaking',
  'Tg',
  'Name/ X profile',
  'Avg post views',
  'Price',
  'Promotion Condition',
  'Brought by',
  'Brought On',
  'Solana Wallet',
  'Allocation Link',
  'Posted',
] as const;

function stripHandle(value: string): string {
  return value.trim().replace(/^@/, '');
}

function formatPlatform(row: KolExportRow): string {
  const hasX = Boolean(row.xHandle?.trim());
  const hasTg = Boolean(row.telegram?.trim());
  if (hasX) return 'X';
  if (hasTg) return 'TG';
  return '';
}

function formatTelegramLink(telegram: string | null | undefined): string {
  if (!telegram?.trim()) return '';
  const t = telegram.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://t.me/${stripHandle(t)}`;
}

function formatXProfileLink(xHandle: string | null | undefined): string {
  if (!xHandle?.trim()) return '';
  const h = xHandle.trim();
  if (/^https?:\/\//i.test(h)) return h;
  return `https://x.com/${stripHandle(h)}`;
}

function formatAvgPostViews(views: number | null | undefined): string {
  if (views == null || !Number.isFinite(Number(views))) return '';
  const n = Number(views);
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

function formatPrice(pctOfSupply: number | null | undefined): string {
  if (pctOfSupply == null || !Number.isFinite(Number(pctOfSupply))) return '';
  const pct = Number(pctOfSupply);
  const label = Number.isInteger(pct) ? String(pct) : String(pct).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return `${label}% of MC`;
}

function ordinalDay(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  const mod = day % 10;
  if (mod === 1) return `${day}st`;
  if (mod === 2) return `${day}nd`;
  if (mod === 3) return `${day}rd`;
  return `${day}th`;
}

function formatBroughtOn(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? `${value.trim()}T12:00:00` : value.trim();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value.trim();
  const month = d.toLocaleString('en-US', { month: 'long' });
  return `${ordinalDay(d.getDate())} ${month}`;
}

function formatPosted(adminNotes: string | null | undefined): string {
  const note = adminNotes?.trim().toUpperCase();
  if (note === 'Y' || note === 'N') return note;
  return '';
}

export function kolAllocationToSheetRow(row: KolExportRow): string[] {
  return [
    formatPlatform(row),
    row.country?.trim() || '',
    'English',
    formatTelegramLink(row.telegram),
    formatXProfileLink(row.xHandle),
    formatAvgPostViews(row.avgPostViews),
    formatPrice(row.pctOfSupply),
    row.promotionCondition?.trim() || '',
    row.broughtBy?.trim() || '',
    formatBroughtOn(row.broughtOn),
    row.walletAddress?.trim() || '',
    row.portalUrl?.trim() || '',
    formatPosted(row.adminNotes),
  ];
}

function csvEscape(value: unknown): string {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function kolAllocationsToCsv(rows: KolExportRow[]): string {
  const header = SHEET_HEADERS.map((label) => csvEscape(label)).join(',');
  const body = rows.map((row) => kolAllocationToSheetRow(row).map(csvEscape).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

export function kolAllocationsToSheetValues(rows: KolExportRow[]): string[][] {
  return [Array.from(SHEET_HEADERS), ...rows.map(kolAllocationToSheetRow)];
}
