import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  generateReferralCode,
  isValidCustomReferralName,
  normalizeReferralCodeInput,
  resolveReferralChain,
} from '@/lib/server/referrals';
import { findReferralCodeRow } from '@/lib/server/referralWalletLookup';

export const dynamic = 'force-dynamic';

const CODE_CHANGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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

/**
 * Set a custom referral name (slug) for the caller's wallet.
 * Replaces the auto-generated code in referral_codes; old /r/CODE links stop working.
 */
export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured on the server.' },
      { status: 500 },
    );
  }

  let body: { wallet?: string; chain?: string; name?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const walletInput = body.wallet ?? req.nextUrl.searchParams.get('wallet');
  const chain = resolveReferralChain(walletInput, body.chain ?? req.nextUrl.searchParams.get('chain'));
  const { wallet, row: existing } = await findReferralCodeRow(supabase, walletInput, chain);

  if (!wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }
  if (!existing?.code) {
    return NextResponse.json({ error: 'Create a referral code first (connect wallet on /referral).' }, { status: 404 });
  }

  const newCode = normalizeReferralCodeInput(body.name);
  if (!isValidCustomReferralName(newCode)) {
    return NextResponse.json(
      {
        error:
          'Referral name must be 3–20 characters: letters, numbers, hyphen or underscore. No spaces or special characters.',
      },
      { status: 400 },
    );
  }

  if (newCode === existing.code) {
    return NextResponse.json({ code: existing.code, wallet: existing.wallet, updated: false });
  }

  const createdAt = existing.created_at ? new Date(existing.created_at).getTime() : 0;
  const updatedAt = existing.updated_at ? new Date(existing.updated_at).getTime() : createdAt;
  const wasRenamedBefore = updatedAt - createdAt > 1000;
  if (wasRenamedBefore && Date.now() - updatedAt < CODE_CHANGE_COOLDOWN_MS) {
    const hoursLeft = Math.ceil((CODE_CHANGE_COOLDOWN_MS - (Date.now() - updatedAt)) / (60 * 60 * 1000));
    return NextResponse.json(
      { error: `You can change your referral name again in ~${hoursLeft}h.` },
      { status: 429 },
    );
  }

  const { data: taken } = await supabase
    .from('referral_codes')
    .select('wallet')
    .eq('code', newCode)
    .maybeSingle();

  if (taken && taken.wallet !== wallet) {
    return NextResponse.json({ error: 'That referral name is already taken. Try another.' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('referral_codes')
    .update({ code: newCode, updated_at: new Date().toISOString() })
    .eq('wallet', wallet)
    .select('code, wallet, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to update referral name', detail: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    code: data.code,
    wallet: data.wallet,
    updated: true,
    previousCode: existing.code,
  });
}
