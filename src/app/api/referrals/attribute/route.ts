import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  isValidReferralCode,
  inferChainFromWallet,
  normalizeWalletForChain,
  walletsMatch,
} from '@/lib/server/referrals';

export const dynamic = 'force-dynamic';

/**
 * Attribute a new wallet to a referrer code.
 *
 * Guards:
 *   - code must exist
 *   - referee wallet ≠ referrer wallet (no self-referral; also enforced by CHECK)
 *   - one referrer per referee — duplicate attempts return the existing row (200)
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  let body: { code?: string; refereeWallet?: string; chain?: string; source?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  const chain = body.chain
    ? String(body.chain).toLowerCase() === 'solana'
      ? 'solana'
      : 'aptos'
    : inferChainFromWallet(body.refereeWallet);
  const referee = normalizeWalletForChain(body.refereeWallet, chain);
  const source = (body.source && String(body.source).slice(0, 64)) || 'wallet_connect';
  const ua = (req.headers.get('user-agent') || '').slice(0, 200);

  if (!isValidReferralCode(code)) {
    return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 });
  }
  if (!referee) {
    return NextResponse.json({ error: 'refereeWallet is required' }, { status: 400 });
  }

  // Resolve code → referrer.
  const { data: codeRow, error: codeErr } = await supabase
    .from('referral_codes')
    .select('code, wallet')
    .eq('code', code)
    .maybeSingle();

  if (codeErr) {
    return NextResponse.json(
      { error: 'Failed to look up referral code', detail: codeErr.message },
      { status: 500 },
    );
  }
  if (!codeRow) {
    return NextResponse.json({ error: 'Unknown referral code' }, { status: 404 });
  }
  if (walletsMatch(codeRow.wallet, referee, chain)) {
    return NextResponse.json({ error: 'Self-referrals are not allowed' }, { status: 400 });
  }

  // Already referred? Return that row as a noop-success.
  const { data: existing } = await supabase
    .from('referrals')
    .select('referrer_wallet, referee_wallet, code, attributed_at')
    .eq('referee_wallet', referee)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyAttributed: true,
      referrerWallet: existing.referrer_wallet,
      code: existing.code,
      attributedAt: existing.attributed_at,
    });
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('referrals')
    .insert({
      referrer_wallet: codeRow.wallet,
      referee_wallet: referee,
      code: codeRow.code,
      source,
      user_agent: ua,
    })
    .select('referrer_wallet, referee_wallet, code, attributed_at')
    .single();

  if (insertErr) {
    // 23505 = unique violation: another request raced us → fetch the row.
    if (insertErr.code === '23505') {
      const { data: raceRow } = await supabase
        .from('referrals')
        .select('referrer_wallet, referee_wallet, code, attributed_at')
        .eq('referee_wallet', referee)
        .maybeSingle();
      if (raceRow) {
        return NextResponse.json({
          ok: true,
          alreadyAttributed: true,
          referrerWallet: raceRow.referrer_wallet,
          code: raceRow.code,
          attributedAt: raceRow.attributed_at,
        });
      }
    }
    return NextResponse.json(
      { error: 'Failed to attribute referral', detail: insertErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    alreadyAttributed: false,
    referrerWallet: inserted.referrer_wallet,
    code: inserted.code,
    attributedAt: inserted.attributed_at,
  });
}
