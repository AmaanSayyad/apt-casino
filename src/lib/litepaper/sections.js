import {
  APTC_TOKENOMICS,
  APTC_TRANSPARENCY,
  APTC_UTILITY,
  GGR_FLYWHEEL_STEPS,
  getAllocationSummary,
} from '@/lib/config/tokenomics';

export { PITCH_DECK_EMBED, PITCH_DECK_URL } from '@/lib/pitchDeck';
export {
  DEFAULT_LITEPAPER_URL,
  getLitepaperUrl,
  litepaperPath,
  LITEPAPER_PATH,
} from '@/lib/siteMetadata';

export const LITEPAPER_VERSION = 'v1.0.1';
export const LITEPAPER_UPDATED = '2026-06-19';
export const PROJECT_GITHUB = 'https://github.com/AmaanSayyad/apt-casino';

/**
 * Community links for the litepaper hero (client-safe: only NEXT_PUBLIC_*).
 * Set in `.env` / Vercel; omitted entries are not rendered.
 */
export function getLitepaperSocialLinks() {
  const pairs = [
    ['Telegram', process.env.NEXT_PUBLIC_TELEGRAM_URL],
    ['Discord', process.env.NEXT_PUBLIC_DISCORD_URL],
    ['X', process.env.NEXT_PUBLIC_X_URL],
    ['Linktree', process.env.NEXT_PUBLIC_LINKTREE_URL],
  ];
  return pairs
    .map(([label, href]) => ({ label, href: String(href || '').trim() }))
    .filter((x) => x.href.length > 0);
}

/** Accelerators / incubators APT-Casino has applied to (litepaper Applied For section) */
export const APPLIED_PROGRAMS = [
  {
    name: 'YZi Labs EASY Residency',
    href: 'https://www.yzilabs.com/',
    logo: '/logos/yzilabs.jpg',
  },
  {
    name: 'Alliance Accelerator',
    href: 'https://alliance.xyz/',
    logo: '/logos/alliance.jpg',
  },
  {
    name: 'Nitro Accelerator',
    href: 'https://nitroacc.xyz/',
    logo: '/logos/nitro.svg',
  },
  {
    name: 'Y Combinator',
    href: 'https://www.ycombinator.com/',
    logo: '/logos/Y-Combinator.png',
  },
];

const utilityText = APTC_UTILITY.map((u) => `${u.title}: ${u.body}`).join(' ');
const flywheelText = GGR_FLYWHEEL_STEPS.map((s) => `${s.step}. ${s.title} — ${s.desc}`).join(' ');

/** @type {Array<{ id: string; title: string; body: string[]; mermaid?: string; chart?: string }>} */
export const LITEPAPER_SECTIONS = [
  {
    id: 'thesis',
    title: '1. Protocol Thesis',
    body: [
      'APT-Casino is a multichain GambleFi platform with transparent fee economics and auditable play logs.',
      'Live Solana play uses custodial house balances (Supabase) with server-verified outcomes and on-chain deposit/withdraw settlement to treasury wallets. Aptos Move modules exist for future on-chain expansion; production gameplay is not fully on-chain today.',
      'Live chains today: Solana and Aptos. Solana: custodial house balance + server-verified games. Aptos: same production path; Move modules on mainnet are legacy/experimental until redeployed with admin guards.',
      'Design objective: Web2-grade onboarding (keyless Google/Apple + Petra) with Web3-grade transparency — every bet, deposit, and withdrawal is auditable.',
    ],
  },
  {
    id: 'origin-story',
    title: '1A. Origin Story',
    body: [
      'APT-Casino was born after a firsthand experience with legacy online casinos: misleading bonus terms, hidden wager limits, and custodial balances that trap users.',
      'The founder deposited into a major Web2 platform, received a 200% bonus, then discovered bets were capped at $1 and withdrawals required tens of thousands in play-through — classic opaque house rules.',
      'That frustration became a product mandate: no hidden wager traps, no rigged outcomes, and published fee rules. Play balances are custodial house ledgers with on-chain deposit/withdraw rails — not non-custodial smart-contract escrow for every bet.',
      'The platform evolved from an Aptos hackathon project into a multichain product — 15× global hackathon winner with grants from Aptos Foundation and Movement Labs. Live play on Solana and Aptos, APTC economics, live streaming, and community programs (referrals, volume cups, OTC lottery).',
    ],
  },
  {
    id: 'motivation',
    title: '2. Problem & Motivation',
    body: [
      'Traditional online gambling is centralized: opaque RNG, high fees, restrictive withdrawals, misleading bonuses, and no true asset ownership.',
      'Web3 adoption friction remains high — wallet setup, gas, and transaction confirmations scare Web2 users away from decentralized alternatives.',
      'Social layers are missing on most crypto casinos: no integrated live streaming, limited chat, and no shareable proof of wins/losses for community growth.',
      'APT-Casino targets this gap with provably fair games, treasury-funded gasless play on Aptos, per-chain house balances, and transparent fee economics published in env/config.',
    ],
  },
  {
    id: 'scope',
    title: '3. Scope & Product Surface',
    body: [
      'Games (live): Plinko, Mines, Roulette, Spin Wheel — each with configurable risk, multipliers, and on-chain or server-verified outcomes depending on chain.',
      'Multichain play: Solana (server house balance) and Aptos (client balance mode + Move modules). Chain switcher in navbar follows PLAY_CHAINS registry order.',
      'Social: Livepeer-powered /live streams, Socket.IO wallet-signed chat, leaderboards, Volume Cup competitions, and ROI share links on withdrawals.',
      'DeFi surfaces: Stake (APTC staking pools), referral APTC rewards with cliff unlock, OTC lottery (SOL → APTC, lock period), and GGR-driven APTC buyback dashboard.',
      'Wallet UX: Google/Apple keyless login, Petra wallet, and gasless Aptos transactions sponsored by treasury relayer — users play without signing every micro-action.',
    ],
    mermaid: `sequenceDiagram
    autonumber
    actor U as User
    participant APP as APT-Casino
    participant CH as Solana / Aptos
    participant G as Games layer
    participant SOC as Social layer
    participant DEFI as APTC programs

    U->>APP: Wallet or keyless login
    APP->>CH: Select play chain
    U->>G: Plinko · Mines · Roulette · Wheel
    G->>CH: Bet settle via RNG or on-chain
    G-->>U: Payout + play event logged
    U->>SOC: Live stream · chat · leaderboard
    U->>DEFI: Stake APTC · referrals · OTC · Volume Cup
    DEFI-->>U: APTC rewards and unlocks`,
  },
  {
    id: 'system-architecture',
    title: '4. System Architecture',
    body: [
      'APT-Casino is a Next.js application with chain-specific API routes under /api/chains/{chainId}/, Supabase for profiles, balances, referrals, and audit logs, and Move contracts on Aptos for core game logic.',
      'Sensitive writes (deposits, withdrawals, referral unlocks, GGR estimates) run server-side with service-role Supabase and validated env economics — never trusted from the client alone.',
      'Live features (streaming, chat) sit beside the gaming core: Livepeer for video, Socket.IO for real-time messages bound to wallet identity.',
      'Price and market stats integrate via DexScreener when a public pair is published.',
    ],
    mermaid: `flowchart LR
    U[Player Wallet] --> FE[Next.js Client]
    FE --> API[Chain + Game API Routes]
    API --> DB[(Supabase)]
    API --> APT[Move Contracts Aptos]
    API --> SOL[Solana Treasury]
    FE --> LIVE[Livepeer Streams]
    FE --> CHAT[Socket.IO Chat]
    API --> GGR[GGR Buyback Engine]
    GGR --> DEX[DexScreener / DEX]`,
  },
  {
    id: 'multichain-topology',
    title: '5. Multi-Chain Topology',
    body: [
      'A single chain registry (lib/chains/registry.ts) is the source of truth for UI labels, treasury env keys, balance modes, and API paths.',
      'Each live chain has isolated treasury and platform-fee wallet addresses — reducing cross-chain blast radius.',
      'Solana uses server-side house balances (balanceMode: server); Aptos uses client balance mode with on-chain module interaction.',
      'Coming-soon chains (Sui, EVM, Starknet) are pre-wired in the registry so adapters can go live without restructuring the app.',
    ],
    mermaid: `flowchart TB
    CORE[APT-Casino Core]
    CORE --> REG[Chain Registry]

    REG --> SOL[Solana LIVE]
    REG --> APT[Aptos LIVE]
    REG --> SUI[Sui coming soon]
    REG --> EVM[EVM coming soon]
    REG --> STRK[Starknet coming soon]

    SOL --> T1[(SOL Treasury)]
    APT --> T2[(APT Treasury + Move Module)]
    SUI --> T3[(SUI Treasury planned)]
    EVM --> T4[(EVM Treasury planned)]
    STRK --> T5[(STRK Treasury planned)]`,
  },
  {
    id: 'bet-lifecycle',
    title: '6. Bet Lifecycle & Settlement',
    body: [
      'Deposit: user sends native asset to chain treasury; platform fee (default 10% = 1000 bps) is collected to the fee wallet; net amount credits house balance.',
      'Bet: game module or server handler debits balance, records play event, resolves outcome via RNG or on-chain randomness, credits payout.',
      'Withdraw: user requests withdrawal; amounts above manual USD threshold queue for review; treasury signs outbound transfer.',
      'Referral: on qualifying first deposit, referrer earns APTC (not native play token) — unlock after 14-day cliff or referee volume milestone (default $100 USD play volume).',
    ],
    mermaid: `sequenceDiagram
    participant W as Wallet
    participant UI as APT-Casino UI
    participant API as Play API
    participant DB as Supabase
    participant CH as Chain Treasury

    W->>UI: Deposit native asset
    UI->>CH: Transfer to treasury
    UI->>API: Confirm deposit
    API->>DB: Credit house balance + fee audit
    W->>UI: Place bet
    UI->>API: Bet request
    API->>DB: Debit + play event + payout
    W->>UI: Withdraw
    UI->>API: Withdraw request
    API->>CH: Treasury payout
    API->>DB: Audit + balance update`,
  },
  {
    id: 'randomness',
    title: '7. Provable Fairness & Randomness',
    body: [
      'Aptos games use aptos_framework::randomness and on-chain Move modules — outcomes are verifiable from transaction data and module events.',
      'Randomness inputs include block context, player address, and game nonces; contracts enforce reentrancy protection and input validation.',
      'Solana play paths use server-side resolution with logged play events in Supabase for volume, GGR, and competition accounting — designed for high-throughput UX.',
      'The platform publishes provably-fair messaging on-site; contract source and deployment addresses are intended for public audit (see GitHub).',
    ],
    mermaid: `sequenceDiagram
    participant P as Player
    participant SC as Smart contract
    participant R as Aptos randomness

    P->>SC: Submit bet + nonce
    SC->>R: Request verifiable random
    R-->>SC: Entropy bound to tx
    SC->>SC: Resolve outcome
    SC-->>P: Emit result event`,
  },
  {
    id: 'aptc-token',
    title: '8. APTC Token',
    body: [
      `Native ecosystem token: ${APTC_TOKENOMICS.name} (${APTC_TOKENOMICS.symbol}).`,
      `Max supply: ${APTC_TOKENOMICS.maxSupply} (${APTC_TOKENOMICS.decimals} decimals). Fixed supply design with revoked mint / freeze authorities when published.`,
      'APTC is the rewards, staking, referral, and value-accrual layer on top of core casino play.',
      'Transparency pledge: no wash volume, no fake FDV, no dumps.',
      utilityText,
      'APTC is not required to place bets in native SOL/APT — it is the rewards layer on top of core casino play.',
    ],
  },
  {
    id: 'aptc-allocation',
    title: '9. APTC Allocation',
    body: [
      `${getAllocationSummary()}`,
      'Allocation prioritizes liquidity, community rewards, staking emissions, and protocol growth — details published with the public token release.',
      APTC_TRANSPARENCY.opsWalletRule,
    ],
    chart: 'allocation-donut',
  },
  {
    id: 'ggr-flywheel',
    title: '10. GGR Buyback Flywheel',
    body: [
      flywheelText,
      'Default economics (env): 30% of GGR allocated to APTC buyback (GGR_BUYBACK_BPS_OF_GGR=3000).',
      'Buyback split: 50% burn · 35% stakers · 15% treasury (GGR_BURN/STAKER/TREASURY_BPS_OF_BUYBACK).',
      'Average house edge assumption for estimates: 2.5% (GGR_AVG_HOUSE_EDGE_BPS=250). Actual edge varies per game (~1–4%).',
      'Dashboard surfaces estimated GGR and buyback from play events — live buybacks execute on Robinhood / Uniswap when treasury ops run.',
    ],
    mermaid: `flowchart LR
    PLAY[Player Bets] --> EDGE[House Edge GGR]
    EDGE --> BUY[Uniswap / Robinhood Buy]
    BUY --> BURN[50% Burn]
    BUY --> STAKE[35% Staker Rewards]
    BUY --> TRES[15% Treasury]`,
  },
  {
    id: 'revenue-model',
    title: '11. Revenue & Fee Model',
    body: [
      'Platform fees (default): 10% on deposits and 10% on withdrawals (PLATFORM_FEE_BPS_DEPOSIT/WITHDRAW = 1000 bps).',
      'Referrer share: 20% of gross first deposit (REFERRER_FEE_SHARE_BPS_OF_DEPOSIT = 2000), paid in APTC after unlock rules.',
      'House edge on wagers is the primary GGR source; a portion funds APTC buyback rather than opaque bonus traps.',
      'Additional rails: OTC lottery spreads, staking protocol fees, future NFT/profile monetization, and partner promotions.',
      'Manual withdrawal review triggers above USD threshold (MANUAL_WITHDRAW_USD_THRESHOLD, default $50) to protect treasury continuity.',
    ],
  },
  {
    id: 'referrals',
    title: '12. Referral Program',
    body: [
      'Each user gets a referral code; referees attach on signup or first deposit.',
      'Rewards are denominated in APTC, not SOL/APT play balance — aligning growth incentives with the ecosystem token.',
      'Unlock rules: 14-day cliff (REFERRAL_APTC_CLIFF_DAYS) OR referee reaches volume unlock (default $100 USD from play events).',
      'Referral page shows pending vs unlocked rewards; on-chain APTC payout wiring activates when staking/APTC infra is fully live.',
    ],
    mermaid: `stateDiagram-v2
    [*] --> Pending: Referee deposits
    Pending --> Locked: APTC reward accrued
    Locked --> Unlocked: 14d cliff OR volume milestone
    Locked --> Locked: Still within cliff
    Unlocked --> Paid: On-chain APTC transfer
    Paid --> [*]`,
  },
  {
    id: 'stake',
    title: '13. Stake — APTC Staking',
    body: [
      'The /stake page offers fixed-term APTC staking pools with transparent APY display and vault address when configured.',
      'Staking yield combines emission schedule (12% allocation) and GGR staker share from buyback (35% of buyback by default).',
      'Env gates: APTC_STAKING_ENABLED and NEXT_PUBLIC_APTC_STAKING_ENABLED must be true once mint and vault are production-ready.',
      'Stakers participate in the same value loop as players — protocol revenue returns to long-term holders, not only active gamblers.',
    ],
    mermaid: `flowchart LR
    U[User] --> V[Stake APTC in pool]
    V --> T[Lock term]
    T --> Y[Yield from emissions + GGR share]
    Y --> U`,
  },
  {
    id: 'otc-competition',
    title: '14. OTC Lottery & Volume Cup',
    body: [
      'OTC lottery: users swap SOL for discounted APTC with a lock period — sized for power users who would otherwise move thin DEX books.',
      'Volume Cup (/competition): seasonal leaderboard competition rewarding high-volume players with APTC prizes.',
      'Both programs route distribution through the community allocation bucket rather than discretionary airdrops.',
      'Leaderboards and public stats depend on Supabase play events — no fabricated volume when DB is unconfigured.',
    ],
  },
  {
    id: 'security',
    title: '15. Security Posture',
    body: [
      'Move contracts: input validation, reentrancy guards, event logging for transparency.',
      'Server: treasury keys only in server env; never exposed to client bundles.',
      'Supabase: RLS on user tables; service role restricted to API routes.',
      'Withdrawals: manual review for large USD amounts; audit log for balance mutations.',
      'Ongoing: contract audits before major mainnet expansions; bug bounty planned as TVL grows.',
    ],
  },
  {
    id: 'roadmap',
    title: '16. Roadmap',
    body: [
      'Shipped / live: core casino games, Solana + Aptos play, gasless Aptos UX, referrals, Stake UI, GGR dashboard, live streaming shell, ecosystem partners section.',
      'Near term: staking live, buyback rails, Tier 2 aggregator listings (CoinGecko · CoinMarketCap).',
      'Mid term: Tier 3 CEX roadmap (MEXC · Gate.io · KuCoin · Bybit · OKX · Binance), Sui + EVM chain adapters, developer SDK for third-party provably-fair games on the hub.',
      'Long term: largest multichain GambleFi hub — transparent game marketplace, creator revenue share, and community governance over APTC parameters.',
      'The homepage Roadmap section lists curated milestones via /api/roadmap — editable in Supabase roadmap_items or src/lib/config/publicRoadmap.js.',
    ],
  },
];

export const SECTION_MAP = Object.fromEntries(LITEPAPER_SECTIONS.map((s) => [s.id, s]));

export const GROUPED_FLOW = [
  {
    title: 'Context & Strategic Premise',
    ids: ['thesis', 'origin-story', 'motivation', 'scope'],
  },
  {
    title: 'Architecture & Fairness',
    ids: ['system-architecture', 'multichain-topology', 'bet-lifecycle', 'randomness'],
  },
  {
    title: 'APTC Tokenomics & Economics',
    ids: ['aptc-token', 'aptc-allocation', 'ggr-flywheel', 'revenue-model'],
  },
  {
    title: 'Growth Programs',
    ids: ['referrals', 'stake', 'otc-competition'],
  },
  {
    title: 'Operations & Governance',
    ids: ['security', 'roadmap'],
  },
];
