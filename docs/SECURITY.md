# Security

## `bigint-buffer` (GHSA-3gc7-fjrx-p6mg)

`bigint-buffer@1.1.5` is a transitive dependency of `@solana/spl-token` via
`@solana/buffer-layout-utils`. Upstream has no patched release.

**Mitigation:** `patch-package` applies `patches/bigint-buffer+1.1.5.patch`, which:

- Disables native bindings (where the overflow occurs)
- Uses pure-JS conversion with a max buffer size guard

Re-run `npm install` after clone so `postinstall` applies the patch.

If GitHub Dependabot still shows this alert, dismiss it as **Risk accepted** with
reference to this file and the patch.
