import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { inferChainFromWallet, normalizeWalletForChain, walletsMatch } from '@/lib/server/referrals';
import { applyHeartbeat, formatStreamPublic } from '@/lib/server/streamSessions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  const { id } = await ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid stream id' }, { status: 400 });
  }

  let body: { wallet?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const chain = inferChainFromWallet(body.wallet);
  const wallet = normalizeWalletForChain(body.wallet, chain);
  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  const { data: row, error: fetchErr } = await supabase.from('streams').select('wallet').eq('id', id).maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  if (!walletsMatch(row.wallet, wallet, chain)) {
    return NextResponse.json({ error: 'Not your stream session' }, { status: 403 });
  }

  const updated = await applyHeartbeat(supabase, id);
  if (!updated) return NextResponse.json({ error: 'Could not update session' }, { status: 500 });

  return NextResponse.json({ stream: formatStreamPublic(updated) });
}
