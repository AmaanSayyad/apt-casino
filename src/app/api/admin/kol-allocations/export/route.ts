import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import {
  formatKolAllocationAdmin,
  listKolAllocations,
} from '@/lib/server/kolAllocations';
import { kolAllocationsToCsv, kolAllocationsToSheetValues } from '@/lib/server/kolAllocationsExport';
import {
  getKolAllocationsSheetUrl,
  isGoogleSheetsConfigured,
  writeGoogleSheetValues,
} from '@/lib/server/googleSheets';

export const dynamic = 'force-dynamic';

async function loadExportRows(origin: string) {
  const rows = await listKolAllocations('all');
  return rows.map((row) => formatKolAllocationAdmin(row, origin));
}

export async function GET(request: NextRequest) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  try {
    const origin = request.nextUrl.origin;
    const rows = await loadExportRows(origin);
    const csv = kolAllocationsToCsv(rows);
    const filename = `aptc-kol-allocations-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = requireDashboardAdmin(request);
  if (denied) return denied;

  try {
    const origin = request.nextUrl.origin;
    const rows = await loadExportRows(origin);

    if (isGoogleSheetsConfigured()) {
      const sheetId = process.env.KOL_ALLOCATIONS_GOOGLE_SHEET_ID!.trim();
      await writeGoogleSheetValues(sheetId, kolAllocationsToSheetValues(rows));
      return NextResponse.json({
        success: true,
        mode: 'sheet',
        rowCount: rows.length,
        sheetUrl: getKolAllocationsSheetUrl(),
      });
    }

    return NextResponse.json({
      success: true,
      mode: 'clipboard',
      rowCount: rows.length,
      csv: kolAllocationsToCsv(rows),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
