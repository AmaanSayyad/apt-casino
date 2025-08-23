import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  verifySolanaFairnessProof,
  type SolanaFairnessProof,
} from '@/lib/provablyFair/solanaFairness';

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')?.trim();
  if (!ref) {
    return NextResponse.json({ error: 'ref query required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data, error } = await db
    .from('game_play_events')
    .select('id, chain, game, wallet, bet_raw, payout_raw, currency, result, fairness_proof, proof_reference, created_at')
    .eq('proof_reference', ref)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data?.fairness_proof) {
    return NextResponse.json({ error: 'Fairness record not found' }, { status: 404 });
  }

  const proof = data.fairness_proof as SolanaFairnessProof;
  const valid = await verifySolanaFairnessProof(proof).catch(() => false);

  const units = data.currency === 'SOL' ? 1_000_000_000 : 100_000_000;
  const betNative = Number(data.bet_raw) / units;
  const payoutNative = Number(data.payout_raw) / units;

  return NextResponse.json({
    success: true,
    valid,
    proof,
    event: {
      id: data.id,
      game: data.game,
      wallet: data.wallet,
      result: data.result,
      createdAt: data.created_at,
      betNative,
      payoutNative,
      currency: data.currency,
      chain: data.chain,
    },
  });
}
