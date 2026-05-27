/** Standalone Mermaid diagrams for litepaper featured gallery + inline sections */

export const FEATURED_DIAGRAMS = [
  {
    id: 'player-journey',
    title: 'End-to-end player journey',
    caption: 'Deposit → play → promotions/rewards → settle → optional withdraw & share proof',
    chart: `sequenceDiagram
    autonumber
    actor P as Player
    participant UI as APT-Casino
    participant API as Play API
    participant PR as Promotions API
    participant DB as Supabase
    participant CH as Chain

    P->>UI: Connect wallet / keyless login
    P->>CH: Deposit SOL or APT
    UI->>API: Credit house balance
    API->>DB: Balance + audit log
  P->>UI: Play Plinko / Mines / Wheel
    UI->>API: Bet + resolve
    API->>DB: Play event + GGR
    UI->>PR: Coupon claim or deposit deal check
    PR->>DB: Claims and deal-hit audit logs
    alt Win
        API->>DB: Credit payout
    end
    P->>UI: Withdraw or share PnL card
    API->>CH: Treasury transfer`,
  },
  {
    id: 'aptc-value-loop',
    title: 'APTC value loop',
    caption: 'GGR funds market buyback, then burn · stake · treasury',
    chart: `flowchart TB
    subgraph PLAY["Gaming layer"]
      BETS[Player wagers]
      EDGE[House edge → GGR]
    end
    subgraph TOKEN["APTC layer"]
      BB[30% GGR → market buyback]
      BURN[50% burned]
      STK[35% to stakers]
      TR[15% treasury]
    end
    BETS --> EDGE --> BB
    BB --> BURN
    BB --> STK
    BB --> TR
    BURN --> SUPPLY[↓ Circulating supply]
    STK --> BANK[Staking pools]`,
  },
  {
    id: 'web2-vs-web3',
    title: 'Web2 casino vs APT-Casino',
    caption: 'Why transparent rails matter',
    chart: `flowchart LR
    subgraph W2["Legacy Web2"]
      W2A[Opaque RNG]
      W2B[Hidden wager limits]
      W2C[Custodial balance]
    end
    subgraph W3["APT-Casino"]
      W3A[Verifiable outcomes]
      W3B[Published fees]
      W3C[Self-custody + gasless UX]
    end
    W2A -.->|replaced by| W3A
    W2B -.->|replaced by| W3B
    W2C -.->|replaced by| W3C`,
  },
];
