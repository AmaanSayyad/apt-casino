import { NextResponse } from 'next/server';
import { PUBLIC_ROADMAP_ITEMS, mapPublicRoadmapToApi } from '@/lib/config/publicRoadmap';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

type DbRow = {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  status: 'planned' | 'in_progress' | 'shipped' | 'cancelled';
  eta_date: string | null;
  link: string | null;
  sort_order: number;
};

const UPCOMING = new Set(['planned', 'in_progress']);

function mergeRoadmapItems(dbRows: DbRow[] | null) {
  const dbById = new Map((dbRows ?? []).map((r) => [r.id, r]));
  const sortById = new Map(PUBLIC_ROADMAP_ITEMS.map((r) => [r.id, r.sortOrder]));

  return PUBLIC_ROADMAP_ITEMS.map((staticRow) => {
    const db = dbById.get(staticRow.id);
    const status = db?.status ?? staticRow.status;
    if (!UPCOMING.has(status)) return null;

    return {
      id: staticRow.id,
      title: db?.title ?? staticRow.title,
      excerpt: db?.excerpt ?? staticRow.excerpt,
      category: db?.category ?? staticRow.category,
      status,
      statusLabel: status === 'in_progress' ? 'In progress' : 'Planned',
      link: db?.link ?? staticRow.link,
    };
  })
    .filter(Boolean)
    .sort((a, b) => (sortById.get(a.id) ?? 999) - (sortById.get(b.id) ?? 999))
    .slice(0, 40);
}

/**
 * Returns upcoming roadmap items (status = planned | in_progress) ordered by sort_order.
 * Static config in publicRoadmap.js is canonical for which milestones exist; Supabase
 * rows override title/excerpt/status when present (after seed or admin edits).
 */
export async function GET() {
  const fallbackItems = mapPublicRoadmapToApi();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const categories = [...new Set(fallbackItems.map((i) => i.category))].sort();
    return NextResponse.json({
      items: fallbackItems,
      categories,
      supabaseConfigured: false,
      source: 'static',
    });
  }

  const { data, error } = await supabase
    .from('roadmap_items')
    .select('id, title, excerpt, category, status, eta_date, link, sort_order');

  if (error) {
    return NextResponse.json({ items: [], categories: [], error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as DbRow[];
  const items = mergeRoadmapItems(rows);
  const categories = [...new Set(items.map((i) => i.category))].sort();

  return NextResponse.json({
    items,
    categories,
    supabaseConfigured: true,
    source: rows.length === 0 ? 'static' : 'merged',
  });
}
