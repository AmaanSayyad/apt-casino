/**
 * Native token USD prices for manual-withdraw thresholds.
 */

let aptCache: { price: number; at: number } | null = null;
let solCache: { price: number; at: number } | null = null;
const TTL_MS = 60_000;

export async function getAptUsdPrice(): Promise<number> {
  const now = Date.now();
  if (aptCache && now - aptCache.at < TTL_MS) return aptCache.price;

  const override = process.env.APT_USD_PRICE_OVERRIDE?.trim();
  if (override) {
    const n = Number(override);
    if (Number.isFinite(n) && n > 0) {
      aptCache = { price: n, at: now };
      return n;
    }
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd',
      { next: { revalidate: 60 } },
    );
    if (res.ok) {
      const data = (await res.json()) as { aptos?: { usd?: number } };
      const p = data?.aptos?.usd;
      if (typeof p === 'number' && p > 0) {
        aptCache = { price: p, at: now };
        return p;
      }
    }
  } catch (e) {
    console.warn('[nativeUsdPrice] APT CoinGecko failed:', e);
  }

  throw new Error('Unable to resolve APT/USD (set APT_USD_PRICE_OVERRIDE)');
}

export async function getSolUsdPrice(): Promise<number> {
  const now = Date.now();
  if (solCache && now - solCache.at < TTL_MS) return solCache.price;

  const override = process.env.SOL_USD_PRICE_OVERRIDE?.trim();
  if (override) {
    const n = Number(override);
    if (Number.isFinite(n) && n > 0) {
      solCache = { price: n, at: now };
      return n;
    }
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 60 } },
    );
    if (res.ok) {
      const data = (await res.json()) as { solana?: { usd?: number } };
      const p = data?.solana?.usd;
      if (typeof p === 'number' && p > 0) {
        solCache = { price: p, at: now };
        return p;
      }
    }
  } catch (e) {
    console.warn('[nativeUsdPrice] SOL CoinGecko failed:', e);
  }

  throw new Error('Unable to resolve SOL/USD (set SOL_USD_PRICE_OVERRIDE)');
}

export async function nativeAmountToUsd(
  chain: 'solana' | 'aptos',
  amountNative: number,
): Promise<number> {
  const price = chain === 'solana' ? await getSolUsdPrice() : await getAptUsdPrice();
  return amountNative * price;
}
