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
  if (input.amountRaw <= 0n) throw new Error('Credit amount must be positive');

  const { data, error } = await db.rpc('credit_house_balance', {
    p_wallet: input.wallet,
    p_chain: input.chain,
    p_currency: input.currency,
    p_delta: input.amountRaw.toString(),
  });

  if (error) {
    if (/credit_house_balance|function.*does not exist/i.test(error.message)) {
      return creditHouseBalanceLegacy(input);
    }
    throw new Error(error.message);
  }

  return BigInt(data ?? 0);
}

export async function debitHouseBalance(input: {
  wallet: string;
  chain: string;
  currency: string;
  amountRaw: bigint;
}): Promise<bigint> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');
  if (input.amountRaw <= 0n) throw new Error('Debit amount must be positive');

  const { data, error } = await db.rpc('debit_house_balance', {
    p_wallet: input.wallet,
    p_chain: input.chain,
    p_currency: input.currency,
    p_delta: input.amountRaw.toString(),
  });

  if (error) {
    if (/debit_house_balance|function.*does not exist/i.test(error.message)) {
      return debitHouseBalanceLegacy(input);
    }
    if (/insufficient_balance/i.test(error.message)) {
      throw new Error('Insufficient play balance');
    }
    throw new Error(error.message);
  }

  return BigInt(data ?? 0);
}

/** Claim deposit tx hash before crediting — returns true if this request owns processing. */
export async function claimDepositTx(input: {
  txHash: string;
  chain: string;
  wallet: string;
  amountOctas: number;
  amountNative: number;
  feeOctas: number;
  netCreditedOctas: number;
}): Promise<boolean> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');

  const { data, error } = await db.rpc('claim_deposit_tx', {
    p_tx_hash: input.txHash,
    p_chain: input.chain,
    p_wallet: input.wallet,
    p_amount_octas: input.amountOctas,
    p_amount_native: input.amountNative,
    p_fee_octas: input.feeOctas,
    p_net_credited_octas: input.netCreditedOctas,
  });

  if (error) {
    if (/claim_deposit_tx|function.*does not exist/i.test(error.message)) {
      return true;
    }
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function creditHouseBalanceLegacy(input: {
  wallet: string;
  chain: string;
  currency: string;
  amountRaw: bigint;
}): Promise<bigint> {
  const current = await getHouseBalance(input.wallet, input.chain, input.currency);
  const next = current + input.amountRaw;
  const db = getSupabaseAdmin()!;
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

async function debitHouseBalanceLegacy(input: {
  wallet: string;
  chain: string;
  currency: string;
  amountRaw: bigint;
}): Promise<bigint> {
  const current = await getHouseBalance(input.wallet, input.chain, input.currency);
  if (current < input.amountRaw) throw new Error('Insufficient play balance');
  const next = current - input.amountRaw;
  const db = getSupabaseAdmin()!;
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
