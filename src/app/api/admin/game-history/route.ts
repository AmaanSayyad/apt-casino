import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { requireDashboardAdmin } from '@/lib/admin/requireDashboardAdmin';
import { filterBannedWalletRows, loadBannedWalletKeys } from '@/lib/bans/walletBan';
import { getPlayChainConfig } from '@/lib/chains/registry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deny = requireDashboardAdmin(request);
  if (deny) return deny;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured', bets: [] }, { status: 503 });
  }

  const url = new URL(request.url);
  const limit = Math.min(1000, Math.max(10, Number(url.searchParams.get('limit')) || 500));
  const chainFilter = url.searchParams.get('chain');

  let q = db
    .from('game_play_events')
    .select('id, chain, game, wallet, bet_raw, payout_raw, currency, result, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (chainFilter && chainFilter !== 'ALL') {
    q = q.eq('chain', chainFilter.toLowerCase());
  }

  const [{ data, error }, bannedWallets] = await Promise.all([
    q,
    loadBannedWalletKeys(),
  ]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bets = filterBannedWalletRows(data ?? [], bannedWallets, (r) => r.wallet).map((r) => {
    const cfg = getPlayChainConfig(String(r.chain));
    const units = cfg?.units ?? 1e9;
    const bet = Number(r.bet_raw) / units;
    const payout = Number(r.payout_raw) / units;
    return {
      id: r.id,
      chain: r.chain,
      game: r.game,
      wallet: r.wallet,
      currency: r.currency,
      bet,
      payout,
      won: payout > bet,
      housePnL: bet - payout,
      result: r.result,
      createdAt: r.created_at,
    };
  });

  return NextResponse.json({ bets, total: bets.length });
}
