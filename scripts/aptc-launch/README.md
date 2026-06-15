# APTC Solana token launch

Creates SPL mint, Metaplex metadata, mints 1B APTC (6 decimals), distributes supply, revokes authorities.

## Prerequisites

1. Install Solana CLI ([quick install](https://solana.com/docs/intro/installation)):

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```

2. Payer keypair with SOL on **mainnet-beta** (see cost table below).

3. Set env (never commit the keypair file):

```bash
export SOLANA_RPC_URL="https://your-mainnet-rpc"
export APTC_LAUNCH_KEYPAIR="/path/to/payer-keypair.json"
export SOLANA_NETWORK=mainnet-beta
```

## Steps

### 1. Vanity mint keypair (prefix `APTC`)

```bash
solana-keygen grind --starts-with APTC:1 --ignore-case
# saves e.g. APTCxxxx.json — export path:
export APTC_MINT_KEYPAIR="/path/to/APTCxxxx.json"
```

4-char prefix can take a long time. Fallback: `AptC` (~matches docs mint style).

### 2. Dry run (no transactions)

```bash
npm run aptc:launch:dry
```

### 3. Live launch

```bash
npm run aptc:launch
```

Outputs mint address, Solscan links, and env vars for Vercel.

If distribution or revokes fail mid-run (RPC timeouts), resume with:

```bash
npm run aptc:launch:resume
```

## Live mint (mainnet)

`AptCc7pmHrcnvouoSK4nKdQhLC7B5qA4r8gZaSTcEnj7` · [Solscan](https://solscan.io/token/AptCc7pmHrcnvouoSK4nKdQhLC7B5qA4r8gZaSTcEnj7)

## After launch

| Step | ~SOL |
|------|------|
| Mint + metadata | 0.02–0.05 |
| Mint 1B supply | 0.00001 |
| Distribution transfers | 0.01–0.02 |
| Authority revokes | 0.003 |
| **Total** | **~0.05–0.1 SOL** (+ vanity grind is free, only time) |

## After launch

1. Set `NEXT_PUBLIC_APTC_SOLANA_MINT=AptCc7pmHrcnvouoSK4nKdQhLC7B5qA4r8gZaSTcEnj7` in Vercel
2. Set `NEXT_PUBLIC_APTC_STAKING_VAULT=4Ka1vdinFUqhh3TtHaohj1MiKVUrvJBrgsVp1MfVnXFQ`
3. Raydium CPMM pool: 120M APTC from liquidity wallet + 37 SOL
4. DexScreener enhanced info + Jupiter

## Estimated SOL cost
