import { Network } from '@aptos-labs/ts-sdk';
import { getAptBalanceNative, getTreasurySignerFromEnv } from '@/lib/server/aptTreasury';
import { getPlayChainConfig, PLAY_CHAINS } from '@/lib/chains/registry';

export type TreasuryBalanceRow = {
  chain: string;
  label: string;
  address: string;
  asset: string;
  balance: number | null;
  formatted: string;
  balanceUsd: number | null;
  formattedUsd: string;
  unitUsd: number | null;
  explorerUrl: string | null;
  error: string | null;
};

function fmt(n: number | null, maxFrac = 6): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function aptosNetwork(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  if (n === 'testnet') return Network.TESTNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.MAINNET;
}

function aptExplorerBase(): string {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'mainnet').toLowerCase();
  return n === 'mainnet' ? 'https://explorer.aptoslabs.com' : `https://explorer.aptoslabs.com/?network=${n}`;
}

async function fetchUsdPrices(): Promise<{ sol: number; apt: number }> {
  let sol = Number(process.env.SOL_USD_PRICE_OVERRIDE) || 150;
  let apt = Number(process.env.APT_USD_PRICE_OVERRIDE) || 8;
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana,aptos&vs_currencies=usd',
      { next: { revalidate: 120 } },
    );
    if (r.ok) {
      const j = await r.json();
      if (j?.solana?.usd) sol = j.solana.usd;
      if (j?.aptos?.usd) apt = j.aptos.usd;
    }
  } catch {
    /* overrides */
  }
  return { sol, apt };
}

async function solBalance(address: string, rpc: string): Promise<number> {
  const { Connection, PublicKey } = await import('@solana/web3.js');
  const conn = new Connection(rpc, 'confirmed');
  const lamports = await conn.getBalance(new PublicKey(address.trim()));
  return lamports / 1e9;
}

function formatTreasuryError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('resource_not_found') || msg.includes('Resource not found')) {
    return 'No APT on account (unfunded or indexer lag)';
  }
  try {
    const j = JSON.parse(msg) as { error_code?: string };
    if (j?.error_code === 'resource_not_found') return 'No APT on account';
  } catch {
    /* not json */
  }
  return msg.length > 100 ? `${msg.slice(0, 97)}…` : msg;
}

async function aptBalance(address: string): Promise<number> {
  return getAptBalanceNative(address);
}

export async function buildTreasuryBalanceSnapshot(): Promise<{
  generatedAt: string;
  rows: TreasuryBalanceRow[];
  usdNote: string;
}> {
  const prices = await fetchUsdPrices();
  const rows: TreasuryBalanceRow[] = [];
  const solRpc =
    process.env.SOLANA_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
    'https://api.mainnet-beta.solana.com';

  const addRow = async (opts: {
    chain: string;
    label: string;
    address: string | undefined;
    asset: string;
    fetchBalance: () => Promise<number>;
    unitUsd: number;
    explorer: (addr: string) => string;
  }) => {
    const addr = opts.address?.trim();
    if (!addr) return;
    try {
      const balance = await opts.fetchBalance();
      const balanceUsd = balance * opts.unitUsd;
      rows.push({
        chain: opts.chain,
        label: opts.label,
        address: addr,
        asset: opts.asset,
        balance,
        formatted: `${fmt(balance)} ${opts.asset}`,
        balanceUsd,
        formattedUsd: balanceUsd > 0 ? `$${fmt(balanceUsd, 2)}` : '—',
        unitUsd: opts.unitUsd,
        explorerUrl: opts.explorer(addr),
        error: null,
      });
    } catch (e) {
      rows.push({
        chain: opts.chain,
        label: opts.label,
        address: addr,
        asset: opts.asset,
        balance: null,
        formatted: '—',
        balanceUsd: null,
        formattedUsd: '—',
        unitUsd: opts.unitUsd,
        explorerUrl: opts.explorer(addr),
        error: formatTreasuryError(e),
      });
    }
  };

  const solTreasury = process.env.NEXT_PUBLIC_SOL_TREASURY_ADDRESS;
  const solFee = process.env.NEXT_PUBLIC_PLATFORM_FEE_WALLET_SOL;
  const otcSol = process.env.NEXT_PUBLIC_OTC_LOTTERY_SOL_WALLET;

  await addRow({
    chain: 'Solana',
    label: 'House treasury',
    address: solTreasury,
    asset: 'SOL',
    fetchBalance: () => solBalance(solTreasury!, solRpc),
    unitUsd: prices.sol,
    explorer: (a) => `https://solscan.io/account/${a}`,
  });
  await addRow({
    chain: 'Solana',
    label: 'Platform fee wallet',
    address: solFee,
    asset: 'SOL',
    fetchBalance: () => solBalance(solFee!, solRpc),
    unitUsd: prices.sol,
    explorer: (a) => `https://solscan.io/account/${a}`,
  });
  await addRow({
    chain: 'Solana',
    label: 'OTC lottery receive',
    address: otcSol,
    asset: 'SOL',
    fetchBalance: () => solBalance(otcSol!, solRpc),
    unitUsd: prices.sol,
    explorer: (a) => `https://solscan.io/account/${a}`,
  });

  let aptTreasuryAddr =
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS?.trim();
  try {
    const signer = getTreasurySignerFromEnv();
    aptTreasuryAddr = signer.accountAddress.toString();
  } catch {
    /* env-only */
  }

  const aptFee = process.env.NEXT_PUBLIC_PLATFORM_FEE_WALLET_APT;
  const aptBase = aptExplorerBase();

  await addRow({
    chain: 'Aptos',
    label: 'Treasury / module signer',
    address: aptTreasuryAddr,
    asset: 'APT',
    fetchBalance: () => aptBalance(aptTreasuryAddr!),
    unitUsd: prices.apt,
    explorer: (a) => `${aptBase}/account/${a}`,
  });
  await addRow({
    chain: 'Aptos',
    label: 'Platform fee wallet',
    address: aptFee,
    asset: 'APT',
    fetchBalance: () => aptBalance(aptFee!),
    unitUsd: prices.apt,
    explorer: (a) => `${aptBase}/account/${a}`,
  });

  for (const chain of PLAY_CHAINS.filter((c) => c.status === 'coming_soon').slice(0, 3)) {
    const addr = process.env[chain.treasuryPublicEnv];
    if (addr) {
      rows.push({
        chain: chain.label,
        label: 'Treasury (configured, not live)',
        address: addr,
        asset: chain.nativeSymbol,
        balance: null,
        formatted: '—',
        balanceUsd: null,
        formattedUsd: '—',
        unitUsd: null,
        explorerUrl: null,
        error: 'Chain not live — balance not queried',
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    rows,
    usdNote: 'USD estimates use CoinGecko / env overrides (SOL_USD_PRICE_OVERRIDE, APT_USD_PRICE_OVERRIDE).',
  };
}
