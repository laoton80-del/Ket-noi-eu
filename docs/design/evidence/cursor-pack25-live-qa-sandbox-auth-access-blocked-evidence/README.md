# Pack25 evidence — live QA sandbox/auth access BLOCKED

## Baseline

| Field | Value |
|-------|--------|
| **Base** | `origin/master @ 6b309b7` |
| **Base commit message** | `docs(pack25): record Pack24 note input UI live operator sign-off evidence (#146)` |
| **Branch** | `viona/cursor-pack25-live-qa-sandbox-auth-access-blocked-evidence-docs-only` |
| **Pack** | Pack25 live QA blocked evidence (docs-only) |

## Summary

| Item | Value |
|------|--------|
| Operating Protocol read | **YES** |
| Docs-only | **YES** |
| Live QA status | **BLOCKED** |
| Live result | **NOT EXECUTED** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| Live operator attestation | **Pending** |
| All non-note write/actions blocked | **YES** |

## Block reasons (audit)

| # | Reason |
|---|--------|
| 1 | REST client likely unconfigured (Metro 0 env vars injected) |
| 2 | Demo OTP fallback without `EXPO_PUBLIC_REST_API_BASE` — no real JWT |
| 3 | Pilot user + operator PIN required |
| 4 | Scoped `VionaRequest` row required — no documented seed script |
| 5 | Demo sandbox must be off for real API |

## Safety

| Check | Result |
| --- | --- |
| Secrets printed/inspected | **NO** |
| `.env*` values inspected | **NO** |
| URL values printed | **NO** |
| DB commands run | **NO** |
| Code implemented | **NO** |

## Files changed

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK25_LIVE_QA_SANDBOX_AUTH_ACCESS_BLOCKED_EVIDENCE.md` |
| Created | `docs/design/evidence/cursor-pack25-live-qa-sandbox-auth-access-blocked-evidence/README.md` |

## Checks run

| Check | Result |
| --- | --- |
| `git diff --check` (`6b309b7..HEAD`) | **PASS** |
| Forbidden paths safety grep | **PASS** — docs only |
| `node scripts/viona-forbidden-claims-check.mjs` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| Conflict grep | **PASS** — none |

**HEAD:** `8dd5a6a`

## Recommendation

**A) Safe to open PR** — records BLOCKED live QA gate honestly; Pack24 not failed; complete operator setup in §4 of product doc before live sign-off.
