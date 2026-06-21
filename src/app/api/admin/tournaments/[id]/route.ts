import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { mapTournamentRow, parseTournamentUpdate } from '@/lib/admin/tournaments';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  aggregateCupStandings,
  buildRegisteredWindows,
} from '@/lib/server/competitionVolume';

export const dynamic = 'force-dynamic';

const SELECT =
  'id, name, game, prize_pool_apt, entry_fee_apt, max_participants, starts_at, ends_at, included_games, competition_mode, status, notes, rewards_distributed_at, created_at';

type RouteCtx = { params: Promise<{ id: string }> };

function isoToUnixSec(iso: string): bigint {
  return BigInt(Math.floor(new Date(iso).getTime() / 1000));
}

function includedSet(row: { included_games?: string[] | null }): Set<string> {
  const all = ['plinko', 'mines', 'roulette', 'wheel'] as const;
  if (!row.included_games?.length) return new Set(all);
  return new Set(row.included_games.map((g) => String(g).toLowerCase()));
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { id } = await ctx.params;
  const { data: tournament, error } = await db.from('tournaments').select(SELECT).eq('id', id).single();
  if (error || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  const { data: regs, error: regErr } = await db
    .from('tournament_registrations')
    .select(
      'id, wallet, registered_at, entry_fee_tx_hash, entry_fee_amount, prize_approved_at, prize_tx_hash, prize_amount',
    )
    .eq('tournament_id', id)
    .order('registered_at', { ascending: true });

  if (regErr) {
    return NextResponse.json({ error: regErr.message }, { status: 500 });
  }

  let standings: {
    rank: number;
    wallet: string;
    walletShort: string;
    volumeApt: number;
    bets: number;
  }[] = [];

  if (tournament.competition_mode === 'volume' && tournament.ends_at && tournament.starts_at) {
    const contestStartSec = isoToUnixSec(tournament.starts_at);
    const contestEndSec = isoToUnixSec(tournament.ends_at);
    const windows = buildRegisteredWindows(regs ?? [], contestStartSec, contestEndSec);
    const slugs = includedSet(tournament);
    const full = await aggregateCupStandings(windows, slugs);
    standings = full.map((r, i) => ({
      rank: i + 1,
      wallet: r.wallet,
      walletShort: r.walletShort,
      volumeApt: r.volumeApt,
      bets: r.bets,
    }));
  }

  const regByWallet = new Map((regs ?? []).map((r) => [r.wallet.toLowerCase(), r]));

  const results = standings.map((s) => {
    const reg =
      regByWallet.get(s.wallet.toLowerCase()) ||
      [...regByWallet.values()].find((r) => r.wallet === s.wallet);
    return {
      ...s,
      registeredAt: reg?.registered_at ?? null,
      entryFeeTxHash: reg?.entry_fee_tx_hash ?? null,
      entryFeeAmount: reg?.entry_fee_amount != null ? Number(reg.entry_fee_amount) : null,
      prizeApprovedAt: reg?.prize_approved_at ?? null,
      prizeTxHash: reg?.prize_tx_hash ?? null,
      prizeAmount: reg?.prize_amount != null ? Number(reg.prize_amount) : null,
      registrationId: reg?.id ?? null,
    };
  });

  const unrankedRegs = (regs ?? [])
    .filter((r) => !results.some((s) => s.wallet.toLowerCase() === r.wallet.toLowerCase()))
    .map((r) => ({
      rank: null,
      wallet: r.wallet,
      walletShort: `${r.wallet.slice(0, 4)}…${r.wallet.slice(-4)}`,
      volumeApt: 0,
      bets: 0,
      registeredAt: r.registered_at,
      entryFeeTxHash: r.entry_fee_tx_hash,
      entryFeeAmount: r.entry_fee_amount != null ? Number(r.entry_fee_amount) : null,
      prizeApprovedAt: r.prize_approved_at,
      prizeTxHash: r.prize_tx_hash,
      prizeAmount: r.prize_amount != null ? Number(r.prize_amount) : null,
      registrationId: r.id,
    }));

  const { count } = await db
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id);

  return NextResponse.json({
    tournament: mapTournamentRow(tournament, count ?? 0),
    results: [...results, ...unrankedRegs],
    totalEntryFeesCollected: (regs ?? []).reduce(
      (sum, r) => sum + (Number(r.entry_fee_amount) || 0),
      0,
    ),
    prizesApproved: (regs ?? []).filter((r) => r.prize_approved_at).length,
    currency: 'APTC',
  });
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing tournament id' }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseTournamentUpdate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await db.from('tournaments').update(parsed.patch).eq('id', id).select(SELECT).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  const { count } = await db
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id);

  return NextResponse.json({
    success: true,
    tournament: mapTournamentRow(data, count ?? 0),
  });
}
