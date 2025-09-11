import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { inferChainFromWallet, normalizeWalletForChain, walletsMatch } from '@/lib/server/referrals';

export const dynamic = 'force-dynamic';

function isAdmin(req: NextRequest): boolean {
  const token = process.env.LIVE_STREAMS_ADMIN_BEARER?.trim();
  if (!token) return false;
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return !!m && m[1] === token;
}

/**
 * DELETE — remove a stream. Owner must pass matching wallet in JSON body;
 * or send Authorization: Bearer LIVE_STREAMS_ADMIN_BEARER to delete any row.
 */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 500 });
  }

  const { id } = await ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid stream id' }, { status: 400 });
  }

  let body: { wallet?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const admin = isAdmin(req);

  const { data: row, error: fetchErr } = await supabase
    .from('streams')
    .select('id, wallet')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  }

  if (!admin) {
    const chain = inferChainFromWallet(body?.wallet ?? row.wallet);
    const wallet = normalizeWalletForChain(body?.wallet, chain);
    if (!wallet) {
      return NextResponse.json({ error: 'JSON body with wallet is required' }, { status: 400 });
    }
    if (!walletsMatch(row.wallet, wallet, chain)) {
      return NextResponse.json({ error: 'Not allowed to delete this stream' }, { status: 403 });
    }
  }

  const { error } = await supabase.from('streams').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * PATCH — set is_approved (moderation). Requires LIVE_STREAMS_ADMIN_BEARER.
 * Body: { "approved": true }
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 500 });
  }

  const { id } = await ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid stream id' }, { status: 400 });
  }

  let body: { approved?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.approved !== 'boolean') {
    return NextResponse.json({ error: 'approved (boolean) is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('streams')
    .update({ is_approved: body.approved, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, is_approved')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stream: data });
}
