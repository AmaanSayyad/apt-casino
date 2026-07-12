/**
 * Mermaid source for the homepage Roadmap section.
 */

/** Delivery phases — Mermaid sequence (same renderer as value flywheel) */
export const ROADMAP_PHASES_SEQUENCE = `sequenceDiagram
  autonumber
  participant L as Now · Live
  participant N as Near term
  participant M as Mid term
  participant H as Long term

  Note over L: 4 games · Sol + Aptos
  Note over L: Live · GGR · referrals
  L->>N: Pump.fun TGE
  Note over N: Tier 1 DEX · Tier 2 CG/CMC
  N->>M: Tier 3 CEX · staking · farms
  Note over M: Sui · EVM · audit
  M->>H: Game SDK
  Note over H: Multichain marketplace`;

/** Standard Mermaid sequence — value flywheel */
export const ROADMAP_VALUE_SEQUENCE = `sequenceDiagram
  autonumber
  actor P as Players
  participant X as Protocol
  participant G as Games
  participant M as Jupiter + PumpSwap
  participant H as Holders

  Note over P,H: Live today
  P->>G: Play stream and bet
  G->>X: GGR and play events
  X->>P: Payouts and rewards

  Note over P,H: APTC flywheel
  X->>M: GGR buys APTC
  M-->>H: Burn stake treasury
  P->>X: Referrals OTC Volume Cup
  X-->>H: GGR buyback rewards

  Note over P,H: Scale
  X->>G: Sui EVM SDK
  H->>X: Governance votes
  X->>P: Third party games`;

export const ROADMAP_DIAGRAM_CARDS = [
  {
    id: 'phases',
    title: 'Delivery phases',
    caption: 'From Pump.fun TGE to the open GambleFi hub.',
    chart: ROADMAP_PHASES_SEQUENCE,
    layout: 'default',
  },
  {
    id: 'sequence',
    title: 'Value delivery sequence',
    caption: 'How play, GGR, Jupiter/PumpSwap, and APTC holders connect.',
    chart: ROADMAP_VALUE_SEQUENCE,
    layout: 'default',
  },
];
