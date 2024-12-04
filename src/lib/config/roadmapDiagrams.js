/**
 * Mermaid source for the homepage “What’s coming” section.
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
  L->>N: Bags TGE · 10% APTC
  Note over N: Staking · LP · buybacks
  N->>M: Sui · EVM · audit
  Note over M: Governance · security
  M->>H: Game SDK
  Note over H: Multichain marketplace`;

/** Standard Mermaid sequence — value flywheel */
export const ROADMAP_VALUE_SEQUENCE = `sequenceDiagram
  autonumber
  actor P as Players
  participant X as Protocol
  participant G as Games
  participant M as Markets
  participant H as Holders

  Note over P,H: Live today
  P->>G: Play stream and bet
  G->>X: GGR and play events
  X->>P: Payouts and rewards

  Note over P,H: APTC flywheel
  X->>M: GGR buys APTC
  M-->>H: Burn stake treasury
  P->>X: Referrals OTC Volume Cup
  X-->>H: Community bucket unlocks

  Note over P,H: Scale
  X->>G: Sui EVM SDK
  H->>X: Governance votes
  X->>P: Third party games`;

export const ROADMAP_DIAGRAM_CARDS = [
  {
    id: 'phases',
    title: 'Delivery phases',
    caption: 'Four eras from live product to open GambleFi hub.',
    chart: ROADMAP_PHASES_SEQUENCE,
    layout: 'default',
  },
  {
    id: 'sequence',
    title: 'Value delivery sequence',
    caption: 'How play, GGR, markets, and APTC holders connect over time.',
    chart: ROADMAP_VALUE_SEQUENCE,
    layout: 'default',
  },
];
