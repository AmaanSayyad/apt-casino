# APTC launch scripts (legacy CLI)

**Primary path:** launch via [pump.fun/create](https://pump.fun/create) in **default mode** (SOL bonding curve → PumpSwap). See [docs/APTC_TOKENOMICS.md](../../docs/APTC_TOKENOMICS.md).

This folder contains a **legacy CLI script** for manual SPL mint + distribution. Use only if you need a custom mint flow outside Pump.fun.

## Pump.fun launch (recommended)

1. Open [pump.fun/create](https://pump.fun/create)
2. Configure: **default mode** (`mayhemMode: false`, `cashback: false`), **~1% creator dev buy**, **100% creator fees → @aptcasinofun** · listings-first (Tier 1–3 DEX → CEX)
3. After TGE, set env:
   - `NEXT_PUBLIC_APTC_SOLANA_MINT=<mint from Pump.fun>`
   - `NEXT_PUBLIC_APTC_DEXSCREENER_PAIR=<pair>` (optional)

## Legacy manual mint

```bash
node scripts/aptc-launch/create-aptc-single.mjs
```

## Graduation monitoring

| Milestone | Target |
|-----------|--------|
| Graduation | Monitor bonding curve until **~85 SOL** → PumpSwap canonical pool (LP burned) |

## Estimated cost (Pump.fun launch)

| Item | Approx. |
|------|---------|
| Launch tx fees | ~0.2 SOL |
| Creator dev buy (~1%) | varies with SOL price |
| User volume accumulator rent | ~0.0018 SOL (first buy/sell if new) |

Program docs: [pump-public-docs](https://github.com/pump-fun/pump-public-docs) · fees: [pump.fun/docs/fees](https://pump.fun/docs/fees)
