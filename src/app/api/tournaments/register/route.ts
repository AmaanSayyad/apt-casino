import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { inferChainFromWallet, normalizeWalletForChain } from '@/lib/server/referrals';
import {
  getTournamentEntryFeeWallet,
  isAptcTournamentReady,
  verifyTournamentEntryFeeTx,
} from '@/lib/server/tournamentRegistration';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase admin not configured (set SUPABASE_SERVICE_ROLE_KEY).' },
      { status: 503 },
    );
  }

  let body: { tournamentId?: string; wallet?: string; chain?: string; txHash?: string };
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
  const txHash = body.txHash?.trim() || null;

  if (!wallet || !tournamentId) {
    return NextResponse.json({ error: 'wallet and tournamentId are required' }, { status: 400 });
  }

  if (chain !== 'solana') {
    return NextResponse.json(
      { error: 'Volume Cup registration requires a Solana wallet (APTC entry fee on Solana).' },
      { status: 400 },
    );
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const { data: t, error: tErr } = await supabase
    .from('tournaments')
    .select('id, max_participants, starts_at, ends_at, status, competition_mode, entry_fee_apt')
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

  if (t.competition_mode !== 'volume' && t.starts_at <= nowIso) {
    return NextResponse.json({ error: 'Tournament has already started.' }, { status: 400 });
  }

  const entryFeeAptc = Number(t.entry_fee_apt) || 0;

  if (entryFeeAptc > 0) {
    if (!isAptcTournamentReady()) {
      return NextResponse.json(
        {
          error:
            'Paid registration is not configured. Set NEXT_PUBLIC_APTC_SOLANA_MINT and NEXT_PUBLIC_PLATFORM_FEE_WALLET_SOL.',
        },
        { status: 503 },
      );
    }
    if (!txHash) {
      return NextResponse.json(
        {
          error: `Entry fee is ${entryFeeAptc} APTC — confirm the APTC transfer in your wallet first.`,
          requiresTx: true,
          entryFeeAptc,
          feeWallet: getTournamentEntryFeeWallet(),
        },
        { status: 400 },
      );
    }

    const verified = await verifyTournamentEntryFeeTx(txHash, wallet, entryFeeAptc);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }

    const { data: usedTx } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('entry_fee_tx_hash', txHash)
      .maybeSingle();
    if (usedTx) {
      return NextResponse.json({ error: 'This transaction was already used for registration.' }, { status: 409 });
    }
  }

  const { count: existing } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);

  if (typeof existing === 'number' && existing >= t.max_participants) {
    return NextResponse.json({ error: 'Tournament is full.' }, { status: 400 });
  }

  const insertRow: Record<string, unknown> = {
    tournament_id: tournamentId,
    wallet,
  };
  if (entryFeeAptc > 0 && txHash) {
    insertRow.entry_fee_tx_hash = txHash;
    insertRow.entry_fee_amount = entryFeeAptc;
  }

  const { error: insErr } = await supabase.from('tournament_registrations').insert(insertRow);

  if (insErr) {
    if (insErr.code === '23505') {
      return NextResponse.json({ error: 'Already registered for this tournament.' }, { status: 409 });
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    competitionMode: t.competition_mode,
    entryFeeAptc: entryFeeAptc > 0 ? entryFeeAptc : 0,
  });
}
