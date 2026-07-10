# Liquidity & treasury

Last updated: 2026-06-20

How player funds, house edge, and payouts flow in the current APT Casino stack.

## Architecture (today)

```mermaid
flowchart TB
    PW[Player Wallet] -->|SOL or APT deposit| TR["Treasury or Vault"]
    TR -->|RPC verify| DEP["Deposit API"]
    DEP -->|credit minus platform fee| DB[(user_house_balances)]
    DB --> BET["Bet API"]
    BET --> GM["Game logic and house edge"]
    GM --> DB
    DB --> WDR["Withdraw API"]
    WDR -->|debit and fee| TR
    TR -->|on-chain payout| PW

    style DB fill:#1a1a2e,stroke:#681DDB,color:#fff
```

<details>
<summary>ASCII equivalent</summary>

```
Player wallet
    │ deposit (on-chain tx)
    ▼
Treasury / vault (Solana hot wallet or Aptos module)
    │ verified by API
    ▼
Supabase user_house_balances  ← in-app play balance
    │ bet / win via /api/chains/[chain]/bet
    ▼
Game outcome + house edge applied in app layer
    │ withdraw request
    ▼
Treasury payout (on-chain) after debit in DB
```

</details>

The web app does **not** use a purely client-side fake balance for Solana play. Balances live in Supabase (`user_house_balances`) and are updated by server handlers in `src/lib/server/play/handlers/`.

**Demo mode** is separate: local Redux + `localStorage` credits for users who enable demo without a wallet (default 100 native units; refill resets to `NEXT_PUBLIC_DEMO_START_NATIVE`).

## Revenue: house edge & platform fees

| Mechanism | Where |
|-----------|--------|
| **Natural roulette edge** | Single-zero wheel (~2.7%) |
| **Configurable BPS** | `NEXT_PUBLIC_HOUSE_EDGE_BPS_*` per game |
| **Deposit fee** | `PLATFORM_FEE_BPS_DEPOSIT` (default 10%) |
| **Withdraw fee** | `PLATFORM_FEE_BPS_WITHDRAW` (default 10%) |
| **Referrer share** | `REFERRER_FEE_SHARE_BPS_OF_DEPOSIT` (capped by deposit fee) |
| **GGR buyback** | `GGR_*` env vars → APTC burn / stakers / treasury |
| **Promotions rewards** | Coupon SOL credits + deposit-deal APTC boosts |

House edge is applied in app logic via `applyHouseEdgeToMultiplier()` (`src/lib/houseEdge.js`).

### Fee & revenue split

```mermaid
pie title Default platform fee on deposit (1000 bps = 10%)
    "House and platform treasury" : 80
    "Referrer share up to cap" : 20
```

```mermaid
flowchart LR
    DEP[Deposit 1 SOL] --> FEE{PLATFORM_FEE_BPS_DEPOSIT}
    FEE -->|900 bps net| BAL[user_house_balances]
    FEE -->|100 bps| REF[Referrer reward pool]
    DEP --> PROMO[Promotions engine]
    PROMO -->|coupon or deal bonus| BAL
    BET[Bet settled] --> EDGE[House edge BPS per game]
    EDGE --> GGR[GGR metrics]
    GGR --> BB["GGR buyback APTC burn stakers treasury"]
```

### Deposit sequence

```mermaid
sequenceDiagram
    participant U as User wallet
    participant C as Chain RPC
    participant A as Deposit API
    participant S as Supabase

    U->>C: Send SOL to treasury
    U->>A: POST tx signature
    A->>C: Confirm transaction
    A->>A: Apply deposit fee BPS
    A->>S: UPSERT user_house_balances
    A-->>U: Credited balance
```

### Withdraw sequence (with manual approval)

```mermaid
sequenceDiagram
    participant U as User
    participant A as Withdraw API
    participant S as Supabase
    participant O as Ops Admin
    participant T as Treasury key

    U->>A: Request withdraw
    A->>S: Check balance + USD threshold
    alt Below MANUAL_WITHDRAW_USD_THRESHOLD
        A->>S: Debit balance
        A->>T: Sign payout tx
        T-->>U: SOL received
    else Above threshold
        A->>S: Status = pending
        O->>A: POST approve (WITHDRAW_APPROVAL_BEARER)
        A->>S: Debit balance
        A->>T: Sign payout tx
        T-->>U: SOL received
    end
```

## Solana path

- Deposits: user sends SOL to treasury address (or program vault when fully wired)
- Play: `/api/chains/solana/bet` adjusts Supabase balance
- Withdraw: `/api/chains/solana/withdraw` debits DB and sends SOL from treasury keypair
- Optional on-chain: Anchor `admin_settle` / `log_game` for audit (`solana-programs/`)

Env: `NEXT_PUBLIC_SOL_TREASURY_ADDRESS`, `SOL_TREASURY_SECRET_KEY`, `SOLANA_MIN_WITHDRAW_SOL`.

## Aptos path

- Move modules handle deposit, bet, and payout entry functions (see [deployment.md](./deployment.md))
- Registry currently marks Aptos as `coming_soon` until wallet + server path are fully live
- Treasury EOA: `TREASURY_PRIVATE_KEY` signs `admin_payout` and relayer txs

## Liquidity requirements

Maintain enough native token in treasury to cover:

1. **Open exposure** — max plausible concurrent player winnings
2. **Withdraw queue** — pending manual approvals above `MANUAL_WITHDRAW_USD_THRESHOLD`
3. **Gas / fees** — relayer and payout transaction costs

Monitor via admin dashboard and Supabase views on balances and withdrawal requests.

## Future: pooled on-chain treasury

The Move `treasury` module sketched in earlier design docs (per-game pools, dynamic edge, reserves) is a **roadmap** enhancement. Today’s production path is **treasury EOA + Supabase ledger + configurable BPS**.

Phased rollout if moving more on-chain:

```mermaid
timeline
    title On-chain treasury roadmap
    section Phase 1
        Solana admin_settle for all bets
    section Phase 2
        Aptos house_* relayer play
    section Phase 3
        Reserve ratios + circuit breakers
    section Phase 4
        APTC LP staking vault
```

1. Solana program `admin_settle` for all bet settlement
2. Aptos `house_*` entry functions for gasless play via relayer
3. On-chain reserve ratios and circuit breakers
4. Liquidity provider staking (APTC staking vault on Solana — see Bank page env)

## Risk controls

- Manual withdraw approval for large USD-equivalent amounts
- Wallet ban list (`BANNED_WALLET_ADDRESSES` + Supabase ban migration)
- Solana program pause instruction
- Platform fee wallets separate from player payout treasury where possible

## APTC on Raydium (token trading)

APTC/SOL trades on **Raydium** after the public IPO closes — separate from player SOL/APT casino treasury balances.

```mermaid
flowchart TB
    subgraph Launch["APTC launch (public IPO)"]
        IPO[Fixed-price SOL→APTC /ipo] --> DIST[APTC to buyers]
        DIST --> STAKE[30-day auto-stake]
        IPO -->|sale ends| RAY[Raydium APTC/SOL pool]
    end

    subgraph Flywheel["GGR flywheel"]
        GGR[Gross gaming revenue] --> BB[Buyback budget]
        BB --> SW[Jupiter / Raydium]
        SW --> SINK[Burn · Stakers · Treasury]
    end

    PLAY[Player bets] --> GGR
```

See [docs/APTC_TOKENOMICS.md](./docs/APTC_TOKENOMICS.md) for IPO parameters and listing-tier economics.

## Related docs

- [mainnet.md](./mainnet.md) — launch checklist
- [deployment.md](./deployment.md) — contract addresses & functions
- `.env.example` — all fee and threshold variables
