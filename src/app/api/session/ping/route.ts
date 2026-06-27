import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { normalizeWalletForChain } from '@/lib/server/referrals';
import { rateLimitByKey, rateLimitRequest } from '@/lib/server/requestRateLimit';

const SESSION_TIMEOUT_SECONDS = 90;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (rateLimitRequest(req, { key: 'session-ping', limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const { wallet_address, chain, session_id } = body as {
      wallet_address?: string;
      network?: string;
      chain?: string;
      session_id?: string;
    };

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address required' }, { status: 400 });
    }

    const chainKey = (chain || body.network || 'aptos').toLowerCase();
    const w = normalizeWalletForChain(wallet_address, chainKey);
    if (!w) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    if (rateLimitByKey(`session-ping:${w}`, { limit: 30, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many requests for this wallet' }, { status: 429 });
    }

    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const now = new Date().toISOString();
    const cutoff = new Date(Date.now() - SESSION_TIMEOUT_SECONDS * 1000).toISOString();

    if (session_id) {
      const { data: existing } = await db
        .from('user_sessions')
        .select('id, last_ping_at')
        .eq('id', session_id)
        .eq('wallet_address', w)
        .is('ended_at', null)
        .maybeSingle();

      if (existing && existing.last_ping_at > cutoff) {
        await db.from('user_sessions').update({ last_ping_at: now }).eq('id', session_id);
        return NextResponse.json({ session_id, status: 'updated' });
      }
    }

    const { data: active } = await db
      .from('user_sessions')
      .select('id')
      .eq('wallet_address', w)
      .is('ended_at', null)
      .gt('last_ping_at', cutoff)
      .order('last_ping_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (active) {
      await db.from('user_sessions').update({ last_ping_at: now }).eq('id', active.id);
      return NextResponse.json({ session_id: active.id, status: 'updated' });
    }

    await db
      .from('user_sessions')
      .update({ ended_at: cutoff })
      .eq('wallet_address', w)
      .is('ended_at', null)
      .lt('last_ping_at', cutoff);

    const { data: created, error } = await db
      .from('user_sessions')
      .insert({ wallet_address: w, chain: chainKey, started_at: now, last_ping_at: now })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Session creation failed' }, { status: 500 });
    }

    return NextResponse.json({ session_id: created!.id, status: 'created' });
  } catch {
    return NextResponse.json({ error: 'Session update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, wallet_address, chain } = body as {
      session_id?: string;
      wallet_address?: string;
      chain?: string;
    };

    if (!session_id || !wallet_address) {
      return NextResponse.json({ error: 'session_id and wallet_address required' }, { status: 400 });
    }

    const w = normalizeWalletForChain(wallet_address, chain || 'aptos');
    if (!w) {
      return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    await db
      .from('user_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', session_id)
      .eq('wallet_address', w)
      .is('ended_at', null);

    return NextResponse.json({ status: 'closed' });
  } catch {
    return NextResponse.json({ error: 'Session close failed' }, { status: 500 });
  }
}
