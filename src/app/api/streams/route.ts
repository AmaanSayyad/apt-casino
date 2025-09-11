import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { inferChainFromWallet, normalizeWalletForChain } from '@/lib/server/referrals';
import { isYouTubeStreamUrl, streamSourceType, validateLivepeerOrHls } from '@/lib/server/streamValidation';
import {
  endOtherLiveSessions,
  formatStreamPublic,
  sanitizeHandle,
  sanitizeSolanaAddress,
  isMissingRewardUnlockColumn,
  selectStreamsPublic,
  STREAM_SELECT_PUBLIC,
  STREAM_SELECT_PUBLIC_LEGACY,
  type StreamSocialInput,
} from '@/lib/server/streamSessions';

export const dynamic = 'force-dynamic';

const MAX_PLAYBACK_LEN = 2048;

function autoApprove(): boolean {
  const v = (process.env.LIVE_STREAMS_AUTO_APPROVE ?? '').trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
  return true;
}

/**
 * GET — approved streams (live first, then recent ended).
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role is not configured.', streams: [] },
      { status: 500 },
    );
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '60', 10) || 60, 100);

  const { data, error } = await selectStreamsPublic(supabase, (select) =>
    supabase
      .from('streams')
      .select(select)
      .eq('is_approved', true)
      .order('session_status', { ascending: true })
      .order('started_at', { ascending: false })
      .limit(limit),
  );

  if (error) {
    return NextResponse.json({ error: error.message, streams: [] }, { status: 500 });
  }

  const rows = data ?? [];
  rows.sort((a, b) => {
    if (a.session_status === 'live' && b.session_status !== 'live') return -1;
    if (b.session_status === 'live' && a.session_status !== 'live') return 1;
    return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
  });

  return NextResponse.json({
    streams: rows.map((row) => formatStreamPublic(row)),
  });
}

type PostBody = StreamSocialInput & {
  wallet?: string;
  playbackId?: string;
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
};

/**
 * POST — start a new live stream session (wallet + playback URL + optional thumbnail & socials).
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 500 });
  }

  let body: PostBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const chain = inferChainFromWallet(body.wallet);
  const wallet = normalizeWalletForChain(body.wallet, chain);
  if (!wallet) {
    return NextResponse.json({ error: 'Connect your wallet (Solana or Aptos) and try again.' }, { status: 400 });
  }

  const rawId = typeof body.playbackId === 'string' ? body.playbackId.trim() : '';
  if (!rawId || rawId.length > MAX_PLAYBACK_LEN) {
    return NextResponse.json({ error: 'playbackId is required (max 2048 chars).' }, { status: 400 });
  }

  const source = streamSourceType(rawId);
  if (!isYouTubeStreamUrl(rawId)) {
    const { ok } = await validateLivepeerOrHls(rawId);
    if (!ok) {
      return NextResponse.json(
        { error: 'Stream manifest is not reachable. Check the Playback ID or HLS URL.' },
        { status: 400 },
      );
    }
  }

  const solanaPayout = sanitizeSolanaAddress(body.solanaPayoutWallet);
  if (body.solanaPayoutWallet && !solanaPayout) {
    return NextResponse.json({ error: 'Invalid Solana payout wallet address.' }, { status: 400 });
  }

  const title =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : null;
  const description =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim().slice(0, 2000)
      : null;
  const thumbnailUrl =
    typeof body.thumbnailUrl === 'string' && body.thumbnailUrl.trim()
      ? body.thumbnailUrl.trim().slice(0, 2048)
      : null;

  await endOtherLiveSessions(supabase, wallet);

  const now = new Date().toISOString();
  const approved = autoApprove();

  const insertPayload = {
    playback_id: rawId,
    source,
    wallet,
    chain,
    title,
    description,
    thumbnail_url: thumbnailUrl,
    x_handle: sanitizeHandle(body.xHandle),
    telegram_username: sanitizeHandle(body.telegramUsername),
    solana_payout_wallet: solanaPayout,
    is_approved: approved,
    session_status: 'live',
    started_at: now,
    last_heartbeat_at: now,
    duration_seconds: 0,
    reward_tier_pct: 0,
    reward_status: 'pending',
  };

  let insertResult = await supabase.from('streams').insert(insertPayload).select(STREAM_SELECT_PUBLIC).single();
  if (insertResult.error && isMissingRewardUnlockColumn(insertResult.error.message)) {
    insertResult = await supabase
      .from('streams')
      .insert(insertPayload)
      .select(STREAM_SELECT_PUBLIC_LEGACY)
      .single();
  }

  const { data, error } = insertResult;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    stream: formatStreamPublic(data),
    message: approved
      ? 'You are live on APT-Casino. Keep this tab open or end the stream when finished — duration sets your reward tier (5 / 15 / 30+ min).'
      : 'Stream submitted and is pending approval before it appears publicly.',
  });
}
