# VIONA Request Engine — Pack15D Post-Apply Verification Plan

**Document type:** Post-apply verification plan (docs-only — no execution).
**Baseline:** `origin/master @ 1fcc27d` — `docs(kernel): sync handoff after Pack15C restore risk acceptance (#108)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_DB_APPLY_PRE_APPLY_PLANNING_PACKET.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_PLANNING_PACKET.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 1. Purpose

This document is a **docs-only planning packet** defining what must be verified **after** a future successful DB apply on the approved Pack14C migration target.

This plan does **not** run verification.
This plan does **not** perform DB apply.
This plan does **not** authorize DB apply.
This plan does **not** authorize Prisma, Supabase, or any DB command.
This plan does **not** connect to a database.
This plan does **not** inspect or print secrets or `.env` values.
This plan does **not** modify `.env`.
This plan does **not** change schema, migration SQL, runtime, UI, API, routes, controllers, server, or scripts.
This plan does **not** unlock Pack16 runtime/API or Pack17 runtime/UI/inbox.

Pack15D verification execution is **future-only**. No verification has been performed in this pack.

---

## 2. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `1fcc27d` |
| Message | `docs(kernel): sync handoff after Pack15C restore risk acceptance (#108)` |
| Previous master | `2831f4d` — `docs(requests): record Pack15C not-tested restore risk acceptance (#107)` |
| Pack15C Kernel/Handoff sync after not-tested restore risk acceptance | Complete on master (PR #108 @ `1fcc27d`) |
| Pack15C not-tested restore risk acceptance human operator evidence | Complete on master (PR #107 @ `2831f4d`) |
| Pack15C Kernel/Handoff sync after restore risk intake | Complete on master (PR #106 @ `a6754d8`) |

---

## 3. Current Pack15C state (preserved — non-secret)

| Item | Value |
| --- | --- |
| Target | `viona-staging-eu` |
| Supabase project ref | `euqbfanilcssjiwwtcby` |
| Backup rollback reference | `18 Jun 2026 02:04:53 (+0000)` |
| Restore click authority | `Nong Si Buong only` |
| Risk classification | `RESTORE_NOT_TESTED_BUT_RISK_ACCEPTED_BY_HUMAN_OPERATOR` |
| Not-tested risk acceptance | **YES** (planning readiness only) |
| Final Restore submitted | `NO` |
| Restore run | `NO` |
| Restore tested | `NO` |
| Restore confidence | `medium, not high` |
| Operator go/no-go | `NO-GO for now` |
| DB apply approval | `NO` |
| Execution approval phrase | `MISSING` |
| Execution-only DB apply pack | `BLOCKED` |
| Pack15C execution readiness | `PARTIAL — not GO` |
| Decision | `B) NOT READY` |
| DB apply | **Blocked** |

Not-tested risk acceptance is **planning readiness only**. It is **not** operator GO, **not** DB apply approval, and **not** Prisma/Supabase/DB command authorization.

---

## 4. Scope boundaries

| Boundary | Status |
| --- | --- |
| Post-apply verification **plan** only | YES |
| Future-only | YES |
| Not DB apply | YES |
| Not Pack15D verification execution | YES |
| Does not run Prisma/Supabase/DB commands | YES |
| Does not connect to DB | YES |
| Does not inspect secrets | YES |
| Does not modify `.env` | YES |
| Does not unlock Pack16 or Pack17 | YES |

---

## 5. Preconditions before Pack15D verification may execute

Pack15D verification may **only** execute after **all** of the following are true:

1. This Pack15D post-apply verification plan exists and is merged on master.
2. Final stop-on-error behavior is confirmed in the authorized execution pack.
3. Separate explicit operator GO is provided by the human/operator.
4. Distinct execution approval phrase is provided.
5. ChatGPT GO/NO-GO review approves execution.
6. Separate execution-only DB apply pack is authorized.
7. DB apply completes successfully on the named target.
8. DB apply result is documented with exact migration target and non-secret output summary.
9. No secret values are printed during apply or verification.
10. No post-failure extra Prisma/DB commands are run after an apply error.

Until all preconditions are satisfied, Pack15D verification execution remains **blocked**.

---

## 6. Canonical migration target reference (planning only)

| Item | Path |
| --- | --- |
| Migration folder | `prisma/migrations/20260615120000_add_viona_request_models/` |
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |

This planning packet references the approved Pack14C migration path only. It does **not** claim the migration is applied to any live database.

---

## 7. Planned verification categories (future execution only)

The following checklist defines what **must** be verified in a future Pack15D execution pack. **None** of these items has been performed in this docs-only plan.

### A. Migration application verification

Future verification **must** confirm:

- [ ] The Pack14C migration file is applied to the target DB.
- [ ] The target environment is `viona-staging-eu`.
- [ ] The Supabase project ref is `euqbfanilcssjiwwtcby`.
- [ ] The migration target path matches the canonical Pack14C migration path above.
- [ ] No unexpected migration files are applied as part of the DB apply.
- [ ] Migration output summary is documented without secrets.
- [ ] Any failure stops the execution immediately.

### B. Schema/table verification

Future verification **must** confirm expected request persistence structures from the **approved migration** are present **only after** successful DB apply.

Use cautious verification language:

- Expected tables/fields from the approved migration **must** be present.
- **No** table/column existence is claimed by this planning packet.

**Expected structures from approved Pack14C migration (design reference — not live DB state):**

| Expected item | Design reference |
| --- | --- |
| Enum | `VionaRequestSourceLinkStatus` |
| Tables | `VionaRequest`, `VionaRequestParticipant`, `VionaRequestSourceLink`, `VionaRequestStatusEvent`, `VionaRequestAuditEvent`, `VionaRequestAttachmentReference` |
| Indexes / FK constraints | As defined in the approved migration SQL |

Future Pack15D execution must verify presence using non-secret evidence only. Actual live DB state remains **unverified** until Pack15D executes.

### C. Prisma/client consistency verification

Future verification **must** confirm the repository Prisma schema and generated client remain consistent with the applied migration after successful DB apply.

**Do not run Prisma commands in this docs-only pack.**

If documenting future commands for a separate execution pack, label them:

`FUTURE EXECUTION ONLY — DO NOT RUN IN THIS DOCS-ONLY PACK`

Example future checks (not executed now):

- `FUTURE EXECUTION ONLY — DO NOT RUN IN THIS DOCS-ONLY PACK` — migration status against named target
- `FUTURE EXECUTION ONLY — DO NOT RUN IN THIS DOCS-ONLY PACK` — client generation consistency check after apply
- `FUTURE EXECUTION ONLY — DO NOT RUN IN THIS DOCS-ONLY PACK` — schema diff review without printing connection strings

### D. Runtime safety verification

Future verification **must** confirm that DB apply did **not** unlock:

- [ ] Request mutation
- [ ] Payment capture
- [ ] Booking confirmation
- [ ] SOS dispatch
- [ ] Wallet mutation
- [ ] Live AI protected actions
- [ ] Live merchant execution
- [ ] Pack16 runtime/API
- [ ] Pack17 runtime/UI/inbox

DB apply success alone does **not** authorize runtime/API/inbox implementation.

### E. Read-only readiness evidence for Pack16

Future verification **must** define the evidence required before Pack16 read-only persistence API may begin:

- [ ] DB apply success evidence recorded (non-secret)
- [ ] Pack15D schema verification evidence recorded (non-secret)
- [ ] No mutation routes unlocked
- [ ] No live data write behavior introduced
- [ ] No fake production claims introduced
- [ ] No payment/booking/SOS/wallet truth changes

Pack16 remains **planning-only / blocked** until Pack15D verification passes.

### F. Failure handling

If DB apply or Pack15D verification fails:

1. **Stop immediately** on any DB apply or verification error.
2. **Do not** run extra Prisma/DB commands after failure.
3. Capture **non-secret** output only.
4. Report failure and **wait for human review**.
5. **Do not** attempt rollback unless separately authorized by **`Nong Si Buong`** as restore click authority.

---

## 8. Pack15D output requirements after future execution

When Pack15D actually executes later, it **must** produce an execution report including:

| Output field | Required |
| --- | --- |
| Target environment | YES |
| Operator | YES |
| DB apply commit/migration target | YES |
| DB apply success/failure | YES |
| Migration status evidence summary (non-secret) | YES |
| Schema verification evidence summary (non-secret) | YES |
| No secrets printed confirmation | YES |
| No extra commands after failure confirmation | YES |
| Pack16 readiness recommendation | YES |
| Stop/continue recommendation | YES |

This planning packet does **not** produce that execution report.

---

## 9. Current blocked state

The following remain **blocked**:

| Item | Blocked |
| --- | --- |
| DB apply | YES |
| Pack15C execution-only DB apply pack | YES |
| Pack15D verification execution | YES |
| Pack16 runtime/API | YES |
| Pack17 runtime/UI/inbox | YES |
| Operator GO | YES — missing |
| Execution approval phrase | YES — missing |
| Execution-only DB apply pack authorization | YES |

---

## 10. Required next sequence

Execute in order — do not skip:

1. Merge this Pack15D post-apply verification plan.
2. Confirm final stop-on-error behavior in the authorized execution pack.
3. Human gives separate explicit operator GO.
4. Human gives distinct execution approval phrase.
5. ChatGPT performs GO/NO-GO review.
6. Prepare separate execution-only DB apply pack.
7. If DB apply succeeds, execute Pack15D verification.
8. Only after Pack15D verification passes, start Pack16 read-only persistence API.
9. Only after Pack16 passes, start Pack17 live read-only inbox.

---

## 11. Stop list

Hard stop if any of the following appear without authorized follow-on pack:

- DB apply in this pack
- Prisma migration/apply/status command in this pack
- Supabase DB command in this pack
- DB connection in this pack
- `.env` value printing
- `.env` modification
- Secret inspection or printing
- Restore execution
- Final Restore click or run by Cursor
- Operator GO claim from this plan alone
- DB apply approval claim from this plan alone
- Pack15D verification execution claim
- Pack16 runtime/API implementation claim
- Pack17 runtime/UI/inbox implementation claim
- Payment/booking/SOS/wallet/live AI unlock claim
- Claim that tables/columns exist in live DB from this planning packet alone

---

## Evidence

`docs/design/evidence/cursor-pack15d-post-apply-verification-plan/README.md`
