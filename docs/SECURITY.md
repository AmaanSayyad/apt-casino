# Security

## `bigint-buffer` (GHSA-3gc7-fjrx-p6mg)

`bigint-buffer@1.1.5` is a transitive dependency of `@solana/spl-token` via
`@solana/buffer-layout-utils`. Upstream has no patched release.

**Mitigation:** `patch-package` applies `patches/bigint-buffer+1.1.5.patch`, which:

- Disables native bindings (where the overflow occurs)
- Uses pure-JS conversion with a max buffer size guard

Re-run `npm install` after clone so `postinstall` applies the patch.

If GitHub Dependabot still shows alert **#2**, dismiss it manually:

1. [Security → Dependabot](https://github.com/AmaanSayyad/apt-casino/security/dependabot)
2. Open **bigint-buffer** → **Dismiss alert** → **Risk accepted**
3. Comment: mitigated by `patches/bigint-buffer+1.1.5.patch` (see this file)

Dependabot cannot detect `patch-package` fixes; the lockfile still lists `1.1.5`.

## CodeQL (#6 DOM XSS, #7 SSRF)

Fixed in commit `3159eda` (`streamValidation.ts`, `live/page.js`). Alerts close after
CodeQL re-runs on `main` (`.github/workflows/codeql.yml`). If they remain open after a
green CodeQL run, use **Security → Code scanning** → open each alert → **Close as fixed**.
