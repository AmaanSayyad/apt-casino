# APTC launch scripts (legacy CLI)

**Primary path:** launch via [bags.fm/launch](https://bags.fm/launch) in **SpaceX Mode** (Meteora DBC → DAMM v2). See [docs/APTC_TOKENOMICS.md](../../docs/APTC_TOKENOMICS.md).

This folder contains a **legacy CLI script** for manual SPL mint + distribution. Use only if you need a custom mint flow outside Bags.

## Bags.fm launch (recommended)

1. Open [bags.fm/launch](https://bags.fm/launch)
2. Configure: **SpaceX Mode** (4% float · 96% locked), **~$50k starting MC target**, **~$610** creator initial buy from float, **100% fee share → @aptcasinofun** · listings-first (Tier 1–3 DEX → CEX)
3. After TGE, set env:
   - `NEXT_PUBLIC_APTC_SOLANA_MINT=<mint from Bags>`
   - `NEXT_PUBLIC_APTC_DEXSCREENER_PAIR=<pair>` (optional)
   - `BAGS_API_KEY=<from dev.bags.fm>` (optional)

## Legacy manual mint

```bash
node scripts/aptc-launch/create-aptc-single.mjs
```

## Graduation monitoring

| Milestone | Target |
|-----------|--------|
| Graduation | Monitor bonding curve until **~55 SOL** → DAMM v2 (SpaceX Mode) |

## Estimated cost (Bags launch)

| Item | Approx. |
|------|---------|
| Launch tx fees | ~0.2 SOL |
| Creator initial buy | ~$610 (~8.6 SOL) |
| **Total** | **~9 SOL + $610** |

Example graduated Bags token: [Bynomo on Solscan](https://solscan.io/token/Faw8wwB6MnyAm9xG3qeXgN1isk9agXBoaRZX9Ma8BAGS)
