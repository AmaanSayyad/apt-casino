import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { inferChainFromWallet, normalizeWalletForChain } from '@/lib/server/referrals';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase admin not configured (set SUPABASE_SERVICE_ROLE_KEY).' },
      { status: 503 },
    );
  }

  let body: { tournamentId?: string; wallet?: string; chain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const chain = body.chain
    ? String(body.chain).toLowerCase() === 'solana'
      ? 'solana'
      : 'aptos'
    : inferChainFromWallet(body.wallet);
  const wallet = normalizeWalletForChain(body.wallet, chain);
  const tournamentId = body.tournamentId;
  if (!wallet || !tournamentId) {
    return NextResponse.json({ error: 'wallet and tournamentId are required' }, { status: 400 });
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const { data: t, error: tErr } = await supabase
    .from('tournaments')
    .select('id, max_participants, starts_at, ends_at, status, competition_mode')
    .eq('id', tournamentId)
    .single();

  if (tErr || !t) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }
  if (['completed', 'cancelled', 'ended'].includes(String(t.status))) {
    return NextResponse.json({ error: `Tournament is ${t.status}.` }, { status: 400 });
  }
  if (t.ends_at && new Date(t.ends_at).getTime() <= nowMs) {
    return NextResponse.json({ error: 'Tournament has already ended.' }, { status: 400 });
  }

  // Registration-only events still require a pre-start signup.
  if (t.competition_mode !== 'volume' && t.starts_at <= nowIso) {
    return NextResponse.json({ error: 'Tournament has already started.' }, { status: 400 });
  }

  const { count: existing } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);

  if (typeof existing === 'number' && existing >= t.max_participants) {
    return NextResponse.json({ error: 'Tournament is full.' }, { status: 400 });
  }

  const { error: insErr } = await supabase
    .from('tournament_registrations')
    .insert({ tournament_id: tournamentId, wallet });

  if (insErr) {
    if (insErr.code === '23505') {
      return NextResponse.json({ error: 'Already registered for this tournament.' }, { status: 409 });
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, competitionMode: t.competition_mode });
}
