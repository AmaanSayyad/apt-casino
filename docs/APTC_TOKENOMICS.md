# APTC tokenomics

Last updated: 2026-07-10

Native SPL token for AptCasino.fun — **fixed-price public IPO** on Solana, then secondary trading on **Raydium** (Jupiter-routed).

## Token

| Field | Value |
|-------|--------|
| **Name** | AptCasino.fun |
| **Symbol** | APTC |
| **Chain** | Solana (SPL · Token-2022) |
| **Mint** | Published at Pump.fun TGE (`NEXT_PUBLIC_APTC_SOLANA_MINT`) |
| **Max supply** | 1,000,000,000 (6 decimals) |
| **Mint authority** | Revoked at creation |
| **Freeze authority** | Revoked at creation |

## Launch (public IPO → Raydium)

| Parameter | Value |
|-----------|--------|
| **Sale** | Fixed-price SOL → APTC swap at `/ipo` |
| **Sale supply** | **25%** (250M APTC) |
| **Raise target** | **$100,000** at **$0.0004 / APTC** |
| **Window** | LIVE now → July 13, 2026 |
| **Settlement** | Metaplex Genesis–style rails · MetaDAO-inspired architecture |
| **Affiliates** | PinkSale-style 3-level IPO referrals |
| **Oracle** | Pyth SOL/USD for settlement |
| **Auto-stake** | 30 days @ 30% APY on purchased APTC |
| **Wallets** | Not published pre-launch · Pump.fun create wallet at TGE |
| **Post-IPO** | Raydium APTC/SOL pool · Jupiter routing · DexScreener charts |

Canonical constants live in `src/lib/config/ipo.js` and `src/lib/config/tokenomics.js`.

## Listing tiers

**Tier 1** — Raydium, DexScreener, Jupiter, Birdeye, GeckoTerminal  
**Tier 2** — CoinGecko, CoinMarketCap  
**Tier 3** — MEXC, Gate.io, KuCoin, Bybit, OKX, Binance (phased)

## GGR flywheel

Casino gross gaming revenue funds open-market APTC buybacks (Jupiter / Raydium):

- **50%** burn  
- **35%** stakers  
- **15%** treasury  

See litepaper `#ggr-flywheel` and homepage `#tokenomics`.
