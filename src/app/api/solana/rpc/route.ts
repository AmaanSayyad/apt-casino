import { NextRequest, NextResponse } from 'next/server';
import { getSolanaRpcEndpoint } from '@/lib/solana/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Browser-safe Solana JSON-RPC proxy (avoids CORS blocks on public RPC endpoints).
 */
export async function POST(req: NextRequest) {
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const upstream = getSolanaRpcEndpoint();
  try {
    const res = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'RPC proxy failed';
    return NextResponse.json({ error: 'Solana RPC unavailable', detail }, { status: 502 });
  }
}
