# VIONA Request Engine — Pack15C Execution-Only DB Apply Retry Pack

**Document type:** Execution-only DB apply retry packet (docs-only preparation — no execution).
**Baseline:** `origin/master @ c994d34` — `docs(requests): record Pack15C reachability operator confirmation intake (#124)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_PACK.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_RESULT.md`, `docs/product/VIONA_REQUEST_PACK15C_DB_REACHABILITY_REMEDIATION_PLAN.md`, `docs/product/VIONA_REQUEST_PACK15C_DB_REACHABILITY_REMEDIATION_OPERATOR_CONFIRMATION_INTAKE.md`, `docs/product/VIONA_REQUEST_PACK15D_POST_APPLY_VERIFICATION_PLAN.md`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `c994d34` |
| Message | `docs(requests): record Pack15C reachability operator confirmation intake (#124)` |
| Pack15C reachability operator confirmation intake | Complete and green on master (PR #124 @ `c994d34`) |
| Pack15C DB reachability remediation plan | Complete and green on master (PR #123 @ `36923b1`) |
| Pack15C DB apply stop-on-error evidence | Complete and green on master (PR #122 @ `27e617e`) |
| Pack15C execution-only DB apply pack prep | Complete and green on master (PR #121 @ `e1eebcf`) |
| Stop-on-error status | `CONFIRMED_FINAL_INTAKE` |
| Operator GO | **`PROVIDED`** |
| Execution approval phrase | **`PROVIDED`** |
| DB reachability remediation operator checklist | **CONFIRMED** by Nong Si Buong (PR #124; dated 2026-06-19) |

### Prior chain preserved

| Item | Result |
| --- | --- |
| Prior Pack15C DB apply attempt | Did **not** complete |
| `npx prisma migrate status` (pooler URL) | Hung — process stopped |
| `npx prisma migrate status` (direct staging retry) | Failed — Prisma `P1001` |
| `npx prisma migrate deploy` | **NOT RUN** |
| Post-apply `npx prisma migrate status` | **NOT RUN** |
| DB apply performed | **NO** |
| Stop-on-error triggered | **YES** |

---

## 2. Retry pack purpose

This pack **prepares** a separate execution-only DB apply **retry** packet after Pack15C reachability remediation operator confirmation intake (PR #124) was merged and verified green.

| Item | State |
| --- | --- |
| Retry execution packet prepared | **YES** (this docs-only prep pack) |
| Retry executed in this pack | **NO** |
| Retry authorized automatically | **NO** |
| DB reachability claimed fixed | **NO** |
| Cursor may run DB apply automatically | **NO** |

ChatGPT GO/NO-GO review is the **next required gate** before any future authorized retry execution. This preparation pack does **not** authorize retry execution.

---

## 3. Scope

| Item | Value |
| --- | --- |
| Pack | Pack15C execution-only DB apply **retry** packet |
| Environment | **Staging only** |
| Supabase project label | `viona-staging-eu` |
| Supabase project ref | `euqbfanilcssjiwwtcby` |
| Migration folder | `prisma/migrations/20260615120000_add_viona_request_models/` |
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |
| Execution context (candidate) | Local operator machine using local `.env` |

### Explicitly excluded

| Excluded target | Status |
| --- | --- |
| Production | **EXCLUDED** — not in scope for this packet |
| Legacy paused project `laoton80-del's Project` | **EXCLUDED** — legacy / paused / do-not-use-yet |
| Any target other than `viona-staging-eu` / `euqbfanilcssjiwwtcby` | **EXCLUDED** |

---

## 4. Absolute boundary

This pack **prepares** the retry execution packet only. In this docs-only preparation pack:

| Boundary | State |
| --- | --- |
| DB apply retry performed | **NO** |
| DB apply performed | **NO** |
| Prisma/Supabase/SQL/DB commands run | **NO** |
| DB connection attempted | **NO** |
| `.env` values inspected or printed | **NO** |
| `.env` modified | **NO** |
| Final Restore clicked | **NO** |
| Rollback/restore run | **NO** |
| DB reachability claimed fixed | **NO** |
| Retry authorized | **NO** |
| Pack15D verification executed | **NO** |
| Pack16 / Pack17 unlocked | **NO** |

---

## 5. Retry readiness state

| Flag | Value |
| --- | --- |
| `pack15DbReachabilityRemediationOperatorConfirmed` | `true` |
| `pack15DbReachabilityClaimedFixed` | `false` |
| `pack15DbApplyRetryPackPrepared` | `true` |
| `pack15DbApplyRetryAuthorized` | `false` |
| `pack15DbApplyAttempted` | `true` (prior attempt — unchanged) |
| `pack15DbApplyCompleted` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15ExecutionStoppedOnError` | `true` (prior attempt — unchanged) |
| `pack15ExecutionStopReason` | `P1001 database unreachable / pooler status hang` (prior attempt — unchanged) |
| `pack15StopOnErrorStatus` | `CONFIRMED_FINAL_INTAKE` |
| `pack15OperatorGoProvided` | `true` |
| `pack15OperatorGoStatus` | `PROVIDED` |
| `pack15ExecutionApprovalPhraseProvided` | `true` |
| `pack15ExecutionApprovalPhraseStatus` | `PROVIDED` |
| `pack15DVerificationExecuted` | `false` |
| `pack15DSchemaVerificationPassed` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

---

## 6. Future retry command plan

**Label:** `FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK`

No command was run in this preparation pack. The following is a **minimal, stop-on-error** future retry command plan for operator review after ChatGPT GO/NO-GO review approves retry execution and a separate execution authorization step authorizes apply.

**No extra Prisma/DB/Supabase/SQL commands.** **No Pack15D command in the retry pack** unless DB apply succeeds and a separate Pack15D verification pack starts.

### Phase 1 — Pre-apply status check (future only)

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION — confirm DATABASE_URL / DIRECT_URL target is viona-staging-eu / euqbfanilcssjiwwtcby only (key names only; do not print values)
npx prisma migrate status
```

**Stop-on-error:** If `migrate status` fails, hangs unexpectedly, or shows unexpected pending/applied state, **stop immediately**. Do not continue to deploy.

### Phase 2 — Apply existing VIONA Request migration (future only)

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION — confirm DATABASE_URL target before running.
npx prisma migrate deploy
```

**Rules:**

- Apply **only** migration `20260615120000_add_viona_request_models` via the project's approved deploy path.
- **No** `prisma migrate dev`, `prisma db push`, or `prisma db execute` unless separately authorized.
- **No** new migration creation during execution.
- **Stop immediately** on non-zero exit.

### Phase 3 — Minimum post-apply status check (future only)

Run **only after** Phase 2 succeeds:

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION
npx prisma migrate status
```

**Do not run Pack15D verification commands in this retry pack.** If Phase 2 succeeds, create DB apply result evidence and proceed to a **separate Pack15D verification pack** per `docs/product/VIONA_REQUEST_PACK15D_POST_APPLY_VERIFICATION_PLAN.md`.

**Do not run extra Prisma/Supabase/SQL/DB commands after any failure.**

---

## 7. Preconditions before future retry execution

Before any future authorized retry execution, the operator must confirm:

- [ ] Operator confirms target is staging **`viona-staging-eu`**
- [ ] Operator confirms project ref is **`euqbfanilcssjiwwtcby`**
- [ ] Operator confirms legacy paused project **`laoton80-del's Project`** is **not** used
- [ ] Operator confirms current dashboard backup visible **immediately before retry** (previously recorded: `18 Jun 2026 02:04:53 (+0000)` or newer visible backup)
- [ ] Operator confirms network/VPN path stable
- [ ] Operator confirms DB secret keys by **key name only** (e.g. `DATABASE_URL`, `DIRECT_URL` present — **do not print values**)
- [ ] Operator confirms pooler/direct target without printing URLs
- [ ] Operator confirms **no production** target
- [ ] Operator accepts stop-on-error rule (§8)
- [ ] Operator understands Pack15D/16/17 stay blocked unless DB apply succeeds
- [ ] ChatGPT GO/NO-GO review has approved retry execution
- [ ] Separate retry execution authorization recorded before apply

---

## 8. No-secret policy

| Rule | Required |
| --- | --- |
| Do not print `DATABASE_URL` | **YES** |
| Do not print `DIRECT_URL` | **YES** |
| Do not print Supabase credentials | **YES** |
| Do not paste connection strings into docs or chat | **YES** |
| Redact any secret-like output in future evidence | **YES** |
| Only key names and non-secret status may be recorded | **YES** |

This preparation pack contains **no secret values**.

---

## 9. Stop-on-error rule

Copy exactly from Pack15C final stop-on-error intake (PR #111):

```text
If any DB apply, Prisma, Supabase, SQL, migration, schema verification, or Pack15D verification step fails or returns an unexpected error, stop immediately. Do not continue with extra Prisma, Supabase, SQL, DB, schema, or migration commands. Capture only non-secret output, report the failure, and wait for human review. Do not attempt restore/rollback unless separately authorized by Nong Si Buong.
```

This rule must be included verbatim in any future authorized retry execution pack before DB apply runs.

---

## 10. Backup and restore

| Item | Value |
| --- | --- |
| Dashboard backup available | **YES** — confirmed by operator in PR #124 |
| Backup type | `PHYSICAL` |
| Previously recorded backup timestamp | `18 Jun 2026 02:04:53 (+0000)` |
| Restore option visible | **YES** (prior evidence) |
| Restore tested | **NO** |
| Restore confidence | `medium, not high` |
| Final Restore submitted | **NO** |
| Restore run | **NO** |
| Restore click authority | `Nong Si Buong only` |
| Restore/rollback authorized by this pack | **NO** |
| Restore/rollback requires separate authorization | **YES** — by `Nong Si Buong` only |

**No restore action in this pack.**

---

## 11. Success/failure output plan

| Outcome | Action |
| --- | --- |
| Retry succeeds | Create DB apply **result** evidence; then proceed to **separate Pack15D verification pack** |
| Retry fails | Stop immediately; create retry **failure** evidence |
| Pack15D | **Do not proceed automatically** — separate pack only after successful DB apply |
| Pack16 / Pack17 | **Do not touch** — remain blocked |

---

## 12. Still blocked

- DB apply retry execution
- DB apply execution (prior attempt failed; not completed)
- Pack15D verification execution
- Pack15D DB schema verification
- Pack16 runtime/API implementation
- Pack17 runtime/UI/inbox implementation
- Request mutation
- Payment / booking / SOS / wallet truth changes
- Restore/rollback unless separately authorized by `Nong Si Buong`

---

## 13. Stop list

This preparation pack must **not**:

- Run DB apply or DB apply retry
- Run Prisma, Supabase, SQL, or DB commands
- Connect to DB
- Print or modify `.env` values
- Inspect secrets
- Execute restore or click final Restore
- Claim DB reachability is fixed
- Claim retry executed
- Claim DB apply performed
- Claim retry authorized
- Execute Pack15D verification
- Unlock Pack16 or Pack17

---

## 14. Final recommendation (preparation pack)

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only execution-only DB apply retry pack preparation | **YES** — if gate-clean |
| Safe to execute retry now | **NO** |
| Next after merge/verify | ChatGPT GO/NO-GO review for operator-run retry execution |

---

**Evidence:** `docs/design/evidence/cursor-pack15c-execution-only-db-apply-retry-pack/README.md`
