# APTC tokenomics

Last updated: 2026-06-29

Native SPL token for AptCasino.fun — fair launch on **Pump.fun** (default SOL-paired mode) via the **bonding curve**, graduating into the **canonical PumpSwap** pool when the curve completes.

## Token

| Field | Value |
|-------|--------|
| **Name** | AptCasino.fun |
| **Symbol** | APTC |
| **Chain** | Solana (SPL · Token-2022 · Pump.fun) |
| **Mint** | Set at TGE → `NEXT_PUBLIC_APTC_SOLANA_MINT` |
| **Max supply** | 1,000,000,000 (6 decimals) |
| **Mint authority** | Revoked at creation |
| **Freeze authority** | Revoked at creation |

## Launch (Pump.fun · default mode)

We use Pump.fun’s **default** launch path — **not** mayhem mode, **not** cashback — with a **SOL-paired** `create_v2` coin per [pump-public-docs](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COIN_CREATION.md).

| Parameter | Value |
|-----------|--------|
| **Platform** | [pump.fun/create](https://pump.fun/create) |
| **Mode** | Default (`mayhemMode: false`, `cashback: false`) |
| **Creator dev buy** | **~1%** of supply (~10M APTC) at launch |
| **Curve supply** | **~79.31%** (~793.1M APTC) on bonding curve |
| **PumpSwap LP** | **~20.69%** (~206.9M APTC) migrates on graduation; LP burned |
| **Curve trade fee** | **1.25%** total (0.3% creator + 0.95% protocol) — [fees](https://pump.fun/docs/fees) |
| **Post-grad fees** | Dynamic on PumpSwap canonical pool, down to **~0.3%** total at high MC |
| **Graduation** | Curve completes (~**85 SOL** raised, approximate) → **PumpSwap** migration (0.015 SOL) |
| **Creator fees** | 100% claimed by **@aptcasinofun** operations wallet |

### Why not Bags / “SpaceX Mode”?

Bags.fm SpaceX Mode (4% float, 96% locked, Meteora DBC) is a **different launch stack**. APTC now launches on Pump.fun’s standard bonding curve → PumpSwap path, which matches how most Solana memecoins launch in 2026 and aligns with [current Pump program docs](https://github.com/pump-fun/pump-public-docs).

The older `buy`/`sell` instructions still work; Pump’s newer unified `buy_v2` / `sell_v2` interface supports SOL and USDC quote pairs — we use **SOL default**.

## Supply allocation

| Bucket | % | Amount | Notes |
|--------|---|--------|-------|
| Bonding curve (public) | ~79.31% | 793.1M | Anyone can buy/sell until curve completes |
| PumpSwap LP (graduation) | ~20.69% | 206.9M | Seeds canonical pool; LP tokens burned |
| Creator dev buy | ~1% | 10M | Disclosed dev hold at TGE — not a team wallet |

### Creator wallet deployment (@aptcasinofun)

Largest share funds **Tier 1, 2 & 3 listings** (DEX → aggregators → CEX). No wash volume. No fake FDV. No dumps.

| Use | % of ops deployment |
|-----|---------------------|
| Tier 1, 2 & 3 listings | 50% |
| Community & player rewards | 26% |
| Staking emissions | 14% |
| Treasury & protocol ops | 10% |

**Tier 1** — Pump.fun, PumpSwap, DexScreener, Jupiter, Birdeye, GeckoTerminal  
**Tier 2** — CoinGecko, CoinMarketCap  
**Tier 3** — CEX roadmap (MEXC, Gate.io, KuCoin, Bybit, OKX, Binance)

100% of Pump.fun **creator fees** also route to @aptcasinofun for the same growth mandate.

## Fee economics

| Stage | Total fee | Behavior |
|-------|-----------|----------|
| Bonding curve | 1.25% | 0.3% creator + 0.95% protocol ([source](https://pump.fun/docs/fees)) |
| PumpSwap (canonical) | Scales with MC | Creator + protocol + LP fees per market-cap tier |
| PumpSwap (non-canonical) | 0.3% | Lower fee pools not created by Pump `migrate` |

Creator fees accrue in the bonding-curve `creator_vault` PDA and are collected via `collect_creator_fee_v2` ([docs](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COLLECT_CREATOR_FEE.md)).

## GGR flywheel

30% of gross gaming revenue funds open-market APTC buybacks on **Jupiter / PumpSwap**. Split (configurable via env):

- Burn
- Staker rewards
- Treasury runway

See `/api/ggr/buyback` and litepaper § GGR.

## On-chain programs

| Program | ID |
|---------|-----|
| Pump bonding curve | `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` |

## API & analytics

- **DexScreener:** holders, MC, volume, price changes (homepage + tokenomics via `/api/staking/aptc-stats`)
- **Pump.fun:** token page at `https://pump.fun/coin/{mint}` after TGE

## Links

- **Website:** https://aptcasino.fun/
- **Create:** https://pump.fun/create
- **Fees:** https://pump.fun/docs/fees
- **Program docs:** https://github.com/pump-fun/pump-public-docs
- **Stake:** https://aptcasino.fun/stake
- **Litepaper:** https://aptcasino.fun/litepaper
