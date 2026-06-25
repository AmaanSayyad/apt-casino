# APTC Solana token launch

**Primary path:** launch via [bags.fm/launch](https://bags.fm/launch) (Meteora DBC → DAMM v2). See [docs/APTC_TOKENOMICS.md](../../docs/APTC_TOKENOMICS.md).

This folder contains a **legacy CLI script** for manual SPL mint + distribution. Use only if you need a custom mint flow outside Bags.

## Bags.fm launch (recommended)

1. Open [bags.fm/launch](https://bags.fm/launch)
2. Configure: **DEFAULT (Founder) mode**, **$610 / 23%** initial buy, **100% fee share → @aptcasinofun** · listings-first (Tier 1–3 DEX → CEX)
3. Fund wallet with ≥0.2 SOL + ~8.6 SOL for initial buy
4. After launch, set in Vercel:
   - `NEXT_PUBLIC_APTC_SOLANA_MINT=<mint from Bags>`
   - `NEXT_PUBLIC_APTC_DEXSCREENER_PAIR=<pair when indexed>`
   - `BAGS_API_KEY=<from dev.bags.fm>` (optional)

## Legacy CLI script (optional)

Creates SPL mint, Metaplex metadata, mints 1B APTC, distributes supply, revokes authorities.

### Prerequisites

1. Install Solana CLI ([quick install](https://solana.com/docs/intro/installation))
2. Payer keypair with SOL on **mainnet-beta**
3. Set env (never commit the keypair file):

```bash
export SOLANA_RPC_URL="https://your-mainnet-rpc"
export APTC_LAUNCH_KEYPAIR="/path/to/payer-keypair.json"
export SOLANA_NETWORK=mainnet-beta
```

### Steps

```bash
npm run aptc:launch:dry   # dry run
npm run aptc:launch       # live (legacy)
npm run aptc:launch:resume  # resume if interrupted
```

## After launch

| Step | Notes |
|------|--------|
| Set mint env | `NEXT_PUBLIC_APTC_SOLANA_MINT` |
| DexScreener | Submit enhanced info once pair is indexed |
| Staking | `NEXT_PUBLIC_APTC_STAKING_VAULT` + enable flags |
| Graduation | Monitor bonding curve until **85 SOL** → DAMM v2 |

## Estimated cost (Bags launch)

| Item | ~Cost |
|------|--------|
| Launch tx fees | ≥0.2 SOL |
| Creator initial buy | ~$610 (~8.6 SOL) |
| **Total** | **~9 SOL + $610** |

## Reference

Example graduated Bags token: [Bynomo on Solscan](https://solscan.io/token/Faw8wwB6MnyAm9xG3qeXgN1isk9agXBoaRZX9Ma8BAGS)
