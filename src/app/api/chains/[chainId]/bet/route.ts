import { handleChainBetPOST } from '@/lib/server/play/handlers';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ chainId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { chainId } = await params;
  return handleChainBetPOST(chainId, request);
}
