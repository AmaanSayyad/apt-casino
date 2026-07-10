# Security Policy

Last updated: 2026-07-10

## Supported scope

Security reports are welcome for:

- Production web app at `https://aptcasino.fun`
- Next.js API routes and admin routes
- Supabase schema / RLS for production features
- Solana/Aptos treasury, deposit, withdraw, and payout paths
- **$APTC IPO** rails (SOL collector is receive-only; APTC distributor hot key is server-only — never expose `IPO_TREASURY_SECRET_KEY` to the client)
- Promotions, referrals, KOL portal, and profile reward systems

## Reporting a vulnerability

Please report privately to:

- Email: `0xamaan.dev@gmail.com`

Include:

1. Clear impact summary
2. Steps to reproduce
3. Affected route/file/feature
4. Proof-of-concept (if safe)
5. Suggested mitigation (optional)

## Disclosure expectations

- Do not post public exploit details before a fix is deployed.
- Do not access, alter, or exfiltrate real user funds/data.
- Prefer test wallets and minimal-impact reproduction.

## Response targets

- Initial triage: within 72 hours
- Severity assessment + fix plan: as soon as possible
- Patch + deployment timing depends on severity and exploitability

## Current high-priority areas

- Treasury key handling and server-only signing routes
- **If `TREASURY_PRIVATE_KEY` was ever committed to git:** treat that Aptos account as compromised. Generate a new key, migrate funds/modules, update Vercel env, and never reuse the exposed key. Git history and forks remain public.
- Admin auth token protection and route gating
- Wallet-auth on user-scoped writes (`WALLET_AUTH_REQUIRED`) + replay table (`wallet_auth_consumed`)
- Server-side payout verification (`GAME_PAYOUT_VERIFICATION_REQUIRED`) — never trust client payout amounts
- Deposit/withdraw race conditions and replay protections (atomic balance RPCs)
- RLS on sensitive Supabase tables (balances, deposits, withdrawals, play events)
- Promotions abuse resistance (wallet, IP hash, device hash, max claims)
- KOL auth/session and password update routes
- **Move modules on Aptos mainnet:** republish after 2026-06-19 security hardening or keep disabled for play (see `move-contracts/README-DEPLOY.md`)
- **Solana Anchor program:** not deployed to mainnet; live play is custodial house balance — see `solana-programs/README-DEPLOY.md`

## Architecture (custodial play)

Production Solana/Aptos gameplay uses **custodial house balances** in Supabase. Deposits and withdrawals are verified on-chain against treasury wallets; bet outcomes are computed server-side. This is not non-custodial smart-contract escrow per bet. Marketing and litepaper copy must reflect this.
