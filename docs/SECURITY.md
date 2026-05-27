# Security Policy

Last updated: 2026-05-27

## Supported scope

Security reports are welcome for:

- Production web app at `https://aptcasino.fun`
- Next.js API routes and admin routes
- Supabase schema / RLS for production features
- Solana/Aptos treasury, deposit, withdraw, and payout paths
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
- Admin auth token protection and route gating
- Deposit/withdraw race conditions and replay protections
- Promotions abuse resistance (wallet, IP hash, device hash, max claims)
- KOL auth/session and password update routes
