# APTC launch scripts

**Primary path:** fixed-price public IPO at [`/ipo`](https://aptcasino.fun/ipo) → Raydium post-sale. See [docs/APTC_TOKENOMICS.md](../../docs/APTC_TOKENOMICS.md).

This folder contains a **legacy CLI script** for manual SPL mint + distribution. Use only if you need a custom mint flow outside the IPO rails.

## IPO launch (recommended)

1. Open https://aptcasino.fun/ipo
2. Confirm env:
   - `NEXT_PUBLIC_APTC_SOLANA_MINT=<mint>`
   - `NEXT_PUBLIC_IPO_SOL_TREASURY=<SOL collector>`
   - `NEXT_PUBLIC_IPO_APTC_DISTRIBUTOR=<APTC distributor>`
   - `IPO_TREASURY_SECRET_KEY=<distributor secret>`
3. After sale: seed Raydium liquidity and set `NEXT_PUBLIC_APTC_DEXSCREENER_PAIR`

## Estimated cost (IPO ops)

- Distributor fee SOL for SPL transfers
- Raydium pool seeding (post-IPO)
- RPC / Vercel / Supabase as usual
