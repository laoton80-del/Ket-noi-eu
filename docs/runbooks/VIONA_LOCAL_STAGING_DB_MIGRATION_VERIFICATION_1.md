# VIONA Local staging / database migration verification — 1

**Pack:** `VIONA.LOCAL.STAGING_DB_MIGRATION_VERIFICATION.1`  
**Branch:** `pack-local-staging-db-migration-verification-1`  
**Master verified:** `7340675` (`chore(local): merge safe no-charge i18n copy`)  
**Date:** 2026-05-20  
**Type:** Ops / readiness verification only (no product, schema, or migration changes)

## Summary

Read-only verification that **Local no-charge** pilot database and automation readiness align with `master` after:

- Local merchant inbox UI
- Local user request list API
- Local user request status UI
- Local no-charge E2E QA certification (`docs/qa/VIONA_LOCAL_NO_CHARGE_E2E_QA_1.md`)
- Local safe i18n copy pass

No `prisma migrate deploy` was executed. No secrets are recorded in this document.

## Verdict

**PASS_WITH_LIMITATIONS**

| Passed (automated) | Not verified in this pack |
|--------------------|---------------------------|
| `master` @ `7340675`, clean tree, `origin/master` synced | User-confirmed **staging** vs dev vs production target name |
| Prisma schema valid; client generates | Supabase dashboard manual review |
| `prisma migrate status` → **Database schema is up to date** on configured `DATABASE_URL` | Separate staging-only connection string audit |
| Local migrations present in repo + applied on connected DB | `EXPO_PUBLIC_REST_API_BASE` in local env |
| Local no-charge E2E runner (24 Local + 6 Tourism) | Manual device walkthrough |
| Safe i18n copy guard | VI `statusCopy` wired to runtime badges |

## Scope

**In scope:** migration inventory, env key presence (names only), Prisma read-only checks, Local/Tourism script regression, safety grep notes, manual operator checklist.

**Out of scope:** schema edits, new migrations, `migrate deploy`, destructive SQL, wallet/Firebase/Tourism runtime/UI changes.

## Core law (unchanged)

Local `LocalServiceRequest` pilot lane:

- `walletMode` default: `REQUEST_ONLY_NO_CHARGE`
- `walletPhase` default: `NONE`
- No wallet hold, debit, release/refund, settlement, provider payout, platform fee
- No Firebase VIP bridge, no `Booking` / `TourismBooking` bridge from Local mutations
- No fake merchant acknowledgement; no AI-driven status mutation

## Git / master state

| Check | Result |
|-------|--------|
| `master` hash | `7340675` |
| Working tree | Clean at verification start |
| `origin/master` | Synced with local `master` |

## Local migration inventory

All migrations under `prisma/migrations/` (9 total). **Local-specific:**

| Migration folder | Purpose |
|------------------|---------|
| `20260520120000_add_local_service_request` | `LocalServiceRequest` table + enums (`LocalServiceRequestStatus`, `LocalWalletMode`, `LocalWalletPhase`, …); defaults `walletMode REQUEST_ONLY_NO_CHARGE`, `walletPhase NONE` |
| `20260520140000_add_local_service_request_audit_event` | `LocalServiceRequestAuditEvent` append-only audit trail; `noWalletAction` default `true`, `requestOnlyNoChargeSnapshot` default `true` |

**Other migrations (non-Local, coexist on same DB):** tourism settlement metadata, broker escrow, charity ledger, LLM router usage log, auth refresh session, email OTP log, etc.

### Schema confirmation (`prisma/schema.prisma`)

- `model LocalServiceRequest` — `walletMode @default(REQUEST_ONLY_NO_CHARGE)`, `walletPhase @default(NONE)`
- `model LocalServiceRequestAuditEvent` — audit types for create, confirm, reject, cancel, expiry paths
- No new migration created in this pack

## Environment readiness

Checked via read-only `scripts/check-local-staging-readiness.ts` (loads `.env` / `.env.local` without printing values).

| Key | Status |
|-----|--------|
| `DATABASE_URL` | **present** |
| `DIRECT_URL` | **present** |
| `JWT_SECRET` | **present** |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | **present** |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | **present** |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | **present** |
| `EXPO_PUBLIC_REST_API_BASE` | **missing** (device/API client may not resolve REST base locally) |

**Datasource host (from `prisma migrate status`, no credentials):** PostgreSQL via Supabase pooler `aws-1-eu-west-1.pooler.supabase.com:5432`, database `postgres`, schema `public`.

> **Operator note:** Confirm in Supabase which project/environment this URL represents (staging vs dev). This verification only proves the **currently configured** URL is migrated and script-compatible.

## Prisma verification

| Command | Result |
|---------|--------|
| `npx prisma validate` | PASS |
| `npx prisma generate` | PASS |
| `npx prisma migrate status` | **9 migrations found** — **Database schema is up to date** |

**Not run:** `prisma migrate deploy` (requires explicit user confirmation of target environment).

## Local automated verification

### Composed runner

`npx tsx scripts/test-local-no-charge-e2e-qa.ts`

| Segment | Result |
|---------|--------|
| Local scripts (18) | 24 passed, 0 failed, 0 skipped |
| Tourism regression (6) | All PASS |
| Overall | **OK** |

**P2002 phone flake:** Not observed on this run. Historical flake on `test-local-merchant-request-reject-api.ts` (`User.phoneNumber` unique constraint) — **retry once** if it occurs; document first failure + retry in QA notes.

### Targeted scripts (also run / included)

| Script | Result |
|--------|--------|
| `test-local-request-schema-defaults.ts` | PASS |
| `test-local-user-request-list-api.ts` | PASS (via E2E) |
| `test-local-user-request-status-ui-display.ts` | PASS |
| `test-local-merchant-inbox-ui-display.ts` | PASS |
| `test-local-safe-i18n-copy-pass.ts` | PASS |

## i18n / copy guard

`test-local-safe-i18n-copy-pass.ts` — PASS on `master` lineage. Local public strings remain request-only / no-charge; forbidden payment terms only in test guard arrays.

**Known limitation:** VI `statusCopy` keys exist in locale files but runtime status badges still use EN helpers until wired.

## Tourism regression

Included in composed runner — all six tourism scripts PASS. No Tourism runtime or i18n files modified in this pack.

## Safety grep (summary)

Scoped review of `src/services/local`, Local routes/controllers, Local B2B/B2C screens, Local i18n, `prisma/schema.prisma`, Local migrations, QA/runbook docs, and test scripts.

| Finding | Assessment |
|---------|------------|
| No `WalletService` / `walletOps` / `reserveAndCommitCredits` under `src/services/local` or Local controllers | OK — no Local wallet bridge |
| `providerSettledAt` in `localRequestCreateValidation.ts` | Deny-list field — blocks client setting settlement timestamp on create |
| Tourism / checkout / SOS strings with settlement, refund, dispatch | Outside Local lane; unchanged |
| Local i18n | Safe negations only (`not a paid booking`, `no payment has been captured`, `confirmed does not mean paid`) |
| Schema enum includes `HOLD_ON_SUBMIT`, `SETTLE_ON_CONFIRM` | Future finance modes — **not** default for Local pilot |

## Known flakes

- **`P2002` on `User.phoneNumber`** during rapid parallel Local API tests — intermittent; retry script or full E2E runner once.

## Known blockers

| Blocker | Owner |
|---------|--------|
| Staging environment not explicitly labeled in verification run | User / ops |
| `EXPO_PUBLIC_REST_API_BASE` missing locally | User / dev env |
| Manual Supabase migration history vs app deploy target | User |
| VI status badges not using `statusCopy` at runtime | Future copy pack |

## Manual steps required from user

1. **Confirm deploy target** — In Supabase (or hosting provider), identify which project is **staging** for Local pilot and that `DATABASE_URL` / `DIRECT_URL` in that environment point to it.
2. **Compare migration history** — In Supabase SQL / migrations UI, confirm `20260520120000_add_local_service_request` and `20260520140000_add_local_service_request_audit_event` are applied on staging.
3. **Only then, if pending:** run `npx prisma migrate deploy` against **confirmed staging** — never production without explicit approval.
4. Set **`EXPO_PUBLIC_REST_API_BASE`** on staging build env for device/API smoke.
5. Run **manual walkthrough:** Local hub → My requests; merchant dashboard → Local inbox; verify EN/VI banners and no payment/settlement copy.
6. Do **not** run destructive resets, `db push --force-reset`, or production migrate without runbook sign-off.

### Warning

> **Do not run `prisma migrate deploy` on production or staging until the operator confirms the target connection string and accepts the action.** This pack used read-only `migrate status` only.

## Validation commands (this pack)

| Check | Result |
|-------|--------|
| `git diff --check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 errors, pre-existing warnings) |
| `npm run smoke` | PASS |
| `npx prisma validate` | PASS |
| `npx prisma generate` | PASS |
| `npx prisma migrate status` | Up to date (9 migrations) |
| `npx tsx scripts/test-local-no-charge-e2e-qa.ts` | PASS |
| `npx tsx scripts/test-local-safe-i18n-copy-pass.ts` | PASS |
| `npx tsx scripts/check-local-staging-readiness.ts` | PASS (DB env present; REST base missing) |

## Recommendation

1. **A)** Merge this runbook to `master` for operator reference.
2. **B)** Manual device/staging walkthrough with confirmed staging `DATABASE_URL` and `EXPO_PUBLIC_REST_API_BASE`.
3. **C)** Wire VI `statusCopy` into runtime badges (optional follow-up copy pack).
4. Do **not** treat this automated run alone as staging sign-off without step 1–2 above.

## References

- `docs/operating/VIONA_PROJECT_KERNEL.md`
- `docs/qa/VIONA_LOCAL_NO_CHARGE_E2E_QA_1.md`
- `docs/architecture/VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md`
- `docs/architecture/VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md`
- `docs/architecture/VIONA_WALLET_FIREBASE_VIP_ISOLATION_POLICY_1.md`
- `scripts/test-local-no-charge-e2e-qa.ts`
- `scripts/check-local-staging-readiness.ts`
