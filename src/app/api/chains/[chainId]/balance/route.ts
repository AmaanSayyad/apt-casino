import { handleChainBalanceGET } from '@/lib/server/play/handlers';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ chainId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { chainId } = await params;
  return handleChainBalanceGET(chainId, request);
}
