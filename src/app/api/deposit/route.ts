import { NextRequest } from 'next/server';
import { aptosDepositPOST } from '@/lib/server/play/handlers/aptos';

/** Legacy Aptos deposit endpoint — delegates to unified /api/chains/aptos/deposit handler. */
export async function POST(request: NextRequest) {
  return aptosDepositPOST(request);
}
