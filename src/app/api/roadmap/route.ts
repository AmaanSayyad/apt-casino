import { NextResponse } from 'next/server';
import { mapPublicRoadmapToApi } from '@/lib/config/publicRoadmap';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  status: 'planned' | 'in_progress' | 'shipped' | 'cancelled';
  eta_date: string | null;
  link: string | null;
  sort_order: number;
};

/**
 * Returns upcoming roadmap items (status = planned | in_progress) ordered by sort_order.
 * Uses Supabase when configured; falls back to curated publicRoadmap when the table is empty.
 */
export async function GET() {
  const supabase = getSupabaseAdmin();
  const fallbackItems = mapPublicRoadmapToApi();

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
    .select('id, title, excerpt, category, status, eta_date, link, sort_order')
    .in('status', ['planned', 'in_progress'])
    .order('sort_order', { ascending: true })
    .limit(40);

  if (error) {
    return NextResponse.json({ items: [], categories: [], error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];
  const useFallback = rows.length === 0;
  const items = useFallback
    ? fallbackItems
    : rows.map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: r.excerpt ?? '',
        category: r.category,
        status: r.status,
        statusLabel: r.status === 'in_progress' ? 'In progress' : 'Planned',
        link: r.link,
      }));

  const categories = [...new Set(items.map((i) => i.category))].sort();
  return NextResponse.json({
    items,
    categories,
    supabaseConfigured: true,
    source: useFallback ? 'static' : 'database',
  });
}
