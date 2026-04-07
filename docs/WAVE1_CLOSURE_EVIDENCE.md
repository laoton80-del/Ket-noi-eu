# Wave 1 closure — PASS/FAIL evidence map (binary audit)

Use this table to attach **command output** or **CI logs** per item. No output ⇒ item **FAIL** for Wave 1 PASS.

**Operational runbook (commands, env, artifact, thứ tự):** `docs/WAVE1_OPERATIONS_CLOSURE_RUNBOOK.md`

**Note:** The standalone Next.js marketing site is **intentionally not** in this repo anymore (mobile + Functions focus). Historical closure runs may still reference `typecheck:web` / `apps/web` on older commits.

| ID | Requirement | Command / artifact | Expected pass signal |
|----|-------------|--------------------|----------------------|
| W1-12 | Root typecheck (Expo) | `npm run typecheck` | Exit 0 |
| W1-12 | Release smoke | `npm run smoke` | `[release-smoke] OK` |
| W1-12 | Full preflight | `npm run preflight` | All steps exit 0 |
| W1-01/02 | Functions bundle + HEAD parity (local, clean tree) | `npm run functions:verify-bundle` | `[verify-functions-bundle] OK` (after committing `functions/lib` if build changed it) |
| W1-01/02 | CI parity (GitHub) | Workflow “Release Discipline” job log | `ci:release-discipline` success; verify step runs with `CI=true` |
| W1-08 | Advisory gate (informational) | `npm run preflight:commercial` | Prints checklist + exits 0 after `preflight:release` |
| W1-08 | **Strict** commercial candidate gate | `npm run preflight:commercial:strict` | Trust stamp (or documented waiver), native strict OK, `functions:verify-bundle` with HEAD sync OK |
| W1-04 | Receipt harness — strict OFF (duplicate) | `TRUST_SMOKE_BACKEND_BASE=... TRUST_SMOKE_ID_TOKEN=... npm run verify:receipt` | JSON lines + `OK: receipt strict OFF; duplicate...` exit 0 |
| W1-04 | Receipt harness — strict ON (missing) | Same env, server has `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` | JSON `missing_receipt_denied` or auto exits 2 with 409 evidence |
| W1-04 | Receipt harness — full path (staging + Admin) | `node scripts/verify-receipt-strictness.mjs seeded-flow` with `GOOGLE_APPLICATION_CREDENTIALS`, `VERIFY_RECEIPT_FIREBASE_UID` | `OK: seeded receipt → topup → duplicate` exit 0 |
| W1-07 | Trust preflight anchors | `npm run trust:preflight` | `[trust-preflight] OK` |

## Ops-only (cannot close by code alone)

- Deployed Firebase project with real `walletOps` URL and test user token.
- Optional: `.trust-live-stamp` from `npm run trust:live` for strict commercial gate.

## Wave 1 PASS rule

**PASS** only if every **automatable** row above has evidence on the release candidate commit, and no P0 open items remain in the closure audit.
