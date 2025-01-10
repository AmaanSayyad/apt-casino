import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const LAMPORTS_PER_SOL = 1_000_000_000;

export type HouseBalanceRow = {
  user_address: string;
  chain: string;
  currency: string;
  balance_raw: number;
};

export async function getHouseBalance(
  wallet: string,
  chain = 'solana',
  currency = 'SOL',
): Promise<bigint> {
  const db = getSupabaseAdmin();
  if (!db) return 0n;

  const { data } = await db
    .from('user_house_balances')
    .select('balance_raw')
    .eq('user_address', wallet)
    .eq('chain', chain)
    .eq('currency', currency)
    .maybeSingle();

  return BigInt(data?.balance_raw ?? 0);
}

export async function creditHouseBalance(input: {
  wallet: string;
  chain: string;
  currency: string;
  amountRaw: bigint;
}): Promise<bigint> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const current = await getHouseBalance(input.wallet, input.chain, input.currency);
  const next = current + input.amountRaw;

  const { error } = await db.from('user_house_balances').upsert(
    {
      user_address: input.wallet,
      chain: input.chain,
      currency: input.currency,
      balance_raw: next.toString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_address,chain,currency' },
  );

  if (error) throw new Error(error.message);
  return next;
}

export async function debitHouseBalance(input: {
  wallet: string;
  chain: string;
  currency: string;
  amountRaw: bigint;
}): Promise<bigint> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const current = await getHouseBalance(input.wallet, input.chain, input.currency);
  if (current < input.amountRaw) {
    throw new Error('Insufficient play balance');
  }
  const next = current - input.amountRaw;

  const { error } = await db.from('user_house_balances').upsert(
    {
      user_address: input.wallet,
      chain: input.chain,
      currency: input.currency,
      balance_raw: next.toString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_address,chain,currency' },
  );

  if (error) throw new Error(error.message);
  return next;
}

export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
}

export function lamportsToSol(lamports: bigint | number): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}
