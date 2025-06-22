import { solanaBalanceGET } from '@/lib/server/play/handlers/solana';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.trim();
  if (!wallet) {
    return Response.json({ error: 'wallet required' }, { status: 400 });
  }
  return solanaBalanceGET(wallet);
}
