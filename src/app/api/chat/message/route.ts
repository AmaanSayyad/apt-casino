import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { isValidChatContent, sanitizeChatContent, sanitizeChatWalletLabel } from '@/lib/chatSanitize';
import { normalizeWalletForChain } from '@/lib/server/referrals';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawContent = String(body.content ?? '');
    const chain = String(body.chain || 'guest').toLowerCase();
    const rawWallet = body.wallet != null ? String(body.wallet) : 'guest';

    if (!isValidChatContent(rawContent)) {
      return NextResponse.json(
        { error: 'Message must be plain text, 1–500 characters, with no HTML.' },
        { status: 400 },
      );
    }

    const content = sanitizeChatContent(rawContent);
    let wallet_address = 'guest';

    if (rawWallet && rawWallet !== 'guest') {
      const normalized =
        chain === 'solana'
          ? normalizeWalletForChain(rawWallet, 'solana')
          : chain === 'aptos'
            ? normalizeWalletForChain(rawWallet, 'aptos')
            : sanitizeChatWalletLabel(rawWallet);
      wallet_address = normalized || 'guest';
    }

    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json({ error: 'Chat unavailable' }, { status: 503 });
    }

    const { data, error } = await db
      .from('chat_messages')
      .insert({ content, wallet_address })
      .select('id, wallet_address, content, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to send message';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
