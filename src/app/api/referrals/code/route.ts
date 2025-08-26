import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { generateReferralCode, resolveReferralChain } from '@/lib/server/referrals';
import { findReferralCodeRow } from '@/lib/server/referralWalletLookup';

export const dynamic = 'force-dynamic';

/**
 * Idempotent "get or create" the caller's referral code.
 * Returns the existing row if the wallet already owns a code, otherwise
 * generates a unique code (collision-retried) and inserts it.
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  const walletInput = req.nextUrl.searchParams.get('wallet');
  const chain = resolveReferralChain(walletInput, req.nextUrl.searchParams.get('chain'));

  const { wallet, row: existing } = await findReferralCodeRow(supabase, walletInput, chain);
  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  if (existing?.code) {
    return NextResponse.json({ code: existing.code, wallet: existing.wallet, created: false });
  }

  // Generate a unique code (retry on extremely rare collisions).
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateReferralCode();
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({ wallet, code })
      .select('code, wallet')
      .single();

    if (!error && data) {
      return NextResponse.json({ code: data.code, wallet: data.wallet, created: true });
    }

    // 23505 = unique_violation — could be wallet OR code. Re-fetch by wallet first.
    if (error?.code === '23505') {
      const { data: nowExisting } = await supabase
        .from('referral_codes')
        .select('code, wallet')
        .eq('wallet', wallet)
        .maybeSingle();
      if (nowExisting?.code) {
        return NextResponse.json({ code: nowExisting.code, wallet: nowExisting.wallet, created: false });
      }
      continue;
    }

    return NextResponse.json(
      { error: 'Failed to allocate referral code', detail: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: 'Could not allocate a unique referral code after multiple attempts.' },
    { status: 500 },
  );
}
