# VIONA Request Engine — Pack15C Execution-Only DB Apply Pack

**Document type:** Execution-only DB apply packet (docs-only preparation — no execution).
**Baseline:** `origin/master @ 6f50c3d` — `docs(kernel): sync handoff after Pack15C operator GO provided intake (#120)`.
**Related:** `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/product/VIONA_REQUEST_PACK15C_DB_APPLY_PRE_APPLY_PLANNING_PACKET.md`, `docs/product/VIONA_REQUEST_PACK15D_POST_APPLY_VERIFICATION_PLAN.md`, `docs/product/VIONA_REQUEST_PACK15C_OPERATOR_GO_PROVIDED_INTAKE_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK15C_DISTINCT_EXECUTION_APPROVAL_PHRASE_PROVIDED_INTAKE_EVIDENCE.md`

---

## 1. Current canonical baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `6f50c3d` |
| Message | `docs(kernel): sync handoff after Pack15C operator GO provided intake (#120)` |
| Previous verified master | `5b868ce` — `docs(requests): record Pack15C operator GO provided intake (#119)` |
| Pack15C Kernel/Handoff sync after operator GO provided intake | Complete and green (PR #120 @ `6f50c3d`) |
| Stop-on-error status | `CONFIRMED_FINAL_INTAKE` |

### Both human gates complete

| Gate | Status |
| --- | --- |
| Operator GO | **`PROVIDED`** — Nong Si Buong (PR #119; synced #120) |
| Operator GO invented | **NO** |
| Execution approval phrase | **`PROVIDED`** — human/operator (PR #117; synced #118) |
| Execution approval phrase invented | **NO** |

ChatGPT GO/NO-GO review is the **next required gate** before this packet may be authorized for execution. This preparation pack does **not** authorize execution.

---

## 2. Scope

| Item | Value |
| --- | --- |
| Pack | Pack15C execution-only DB apply packet |
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

## 3. Absolute boundary

This pack **prepares** the execution packet only. In this docs-only preparation pack:

| Boundary | State |
| --- | --- |
| DB apply performed | **NO** |
| Prisma/Supabase/SQL/DB commands run | **NO** |
| DB connection attempted | **NO** |
| `.env` values inspected or printed | **NO** |
| `.env` modified | **NO** |
| Final Restore clicked | **NO** |
| Rollback/restore run | **NO** |
| Pack15D verification executed | **NO** |
| Pack16 / Pack17 unlocked | **NO** |
| Execution-only pack authorized | **NO** — preparation only |
| Cursor may run DB apply automatically | **NO** |

---

## 4. Planned execution command section

**Label:** `FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK`

No command was run in this preparation pack. The following is a **minimal, stop-on-error** future command plan for operator review after ChatGPT GO/NO-GO review approves execution and a separate execution authorization pack authorizes apply.

### Phase 0 — Pre-execution confirmations (no DB mutation)

| Step | Action | Notes |
| --- | --- | --- |
| 0.1 | Confirm clean branch and current approved master commit | Record commit SHA in execution evidence |
| 0.2 | Confirm target is **staging only** — `viona-staging-eu` / `euqbfanilcssjiwwtcby` | **Not** production; **not** legacy paused project |
| 0.3 | Confirm server-side DB secret presence by key name only | e.g. `DATABASE_URL` present in operator environment — **do not print values** |
| 0.4 | Confirm operator sees current dashboard backup before apply | Latest visible timestamp: `18 Jun 2026 02:04:53 (+0000)` |
| 0.5 | Operator accepts stop-on-error rule (§5) | Stop immediately on any failure |

### Phase 1 — Pre-apply status check (future only)

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION — confirm DATABASE_URL points to viona-staging-eu / euqbfanilcssjiwwtcby only
npx prisma migrate status
```

**Stop-on-error:** If `migrate status` fails or shows unexpected pending/applied state, **stop immediately**. Do not continue to deploy.

### Phase 2 — Apply existing VIONA Request migration (future only)

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# Approved Prisma migration deploy path for the existing Pack14C migration on named staging target only.
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION — confirm DATABASE_URL target before running.
npx prisma migrate deploy
```

**Rules:**

- Apply **only** migration `20260615120000_add_viona_request_models` via the project's approved deploy path.
- **No** `prisma migrate dev`, `prisma db push`, or `prisma db execute` unless separately authorized.
- **No** new migration creation during execution.
- **Stop immediately** on non-zero exit.

### Phase 3 — Minimum post-apply verification (Pack15D — future only)

Run **only after** Phase 2 succeeds. Minimum checks per Pack15D plan:

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION
npx prisma migrate status
```

Future Pack15D execution must additionally verify (non-secret evidence only):

- Migration `20260615120000_add_viona_request_models` recorded as applied
- Expected VIONA Request tables/enums from approved migration design reference are present
- No runtime/API/mutation unlock occurred as part of DB apply
- No secrets printed in evidence

**Do not run extra Prisma/Supabase/SQL/DB commands after any failure.**

If exact additional Pack15D verification commands beyond `migrate status` are required, mark them `NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION` until ChatGPT/operator confirms the minimal set for the named target.

---

## 5. Stop-on-error rule

Copy exactly from Pack15C final stop-on-error intake (PR #111):

```text
If any DB apply, Prisma, Supabase, SQL, migration, schema verification, or Pack15D verification step fails or returns an unexpected error, stop immediately. Do not continue with extra Prisma, Supabase, SQL, DB, schema, or migration commands. Capture only non-secret output, report the failure, and wait for human review. Do not attempt restore/rollback unless separately authorized by Nong Si Buong.
```

This rule must be included verbatim in any future authorized execution pack before DB apply runs.

---

## 6. Backup and restore

| Item | Value |
| --- | --- |
| Dashboard backup available | **YES** |
| Backup type | `PHYSICAL` |
| Latest visible backup timestamp | `18 Jun 2026 02:04:53 (+0000)` |
| Visible backup rows | `8` |
| Evidence path | Supabase Dashboard > Database > Backups > Scheduled backups |
| Restore option visible | **YES** |
| Post-click restore modal/warnings documented | **YES** (PR #102) |
| Final Restore submitted | **NO** |
| Restore run | **NO** |
| Restore tested | **NO** |
| Restore click authority | `Nong Si Buong only` |
| Restore confidence | `medium, not high` |
| Restore/rollback authorized by this pack | **NO** |
| Restore/rollback requires separate authorization | **YES** — by `Nong Si Buong` only |

**No restore action in this pack.**

---

## 7. Required operator execution checklist

Before any future authorized execution, the operator must confirm:

- [ ] Target is staging **`viona-staging-eu`**
- [ ] Project ref is **`euqbfanilcssjiwwtcby`**
- [ ] Legacy paused project **`laoton80-del's Project`** is **not** used
- [ ] Operator confirms current dashboard backup visible before execution (timestamp `18 Jun 2026 02:04:53 (+0000)` or newer visible backup)
- [ ] Operator confirms `.env`/deployment secret values are **present** without printing values
- [ ] Operator confirms **no production** target
- [ ] Operator accepts stop-on-error rule (§5)
- [ ] Operator understands Pack15D runs **only after** successful DB apply
- [ ] ChatGPT GO/NO-GO review has approved execution
- [ ] Separate execution authorization recorded before apply

---

## 8. Status flags

| Flag | Value |
| --- | --- |
| `pack15StopOnErrorStatus` | `CONFIRMED_FINAL_INTAKE` |
| `pack15OperatorGoProvided` | `true` |
| `pack15OperatorGoStatus` | `PROVIDED` |
| `pack15ExecutionApprovalPhraseProvided` | `true` |
| `pack15ExecutionApprovalPhraseStatus` | `PROVIDED` |
| `pack15ExecutionOnlyDbApplyPackPrepared` | `true` |
| `pack15ExecutionOnlyDbApplyPackAuthorized` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15DbApplyApproval` | `false` |
| `pack15DPostApplyVerificationPlanStatus` | `PLAN_ON_MASTER_NOT_EXECUTED` |
| `pack15DVerificationExecuted` | `false` |
| `pack15DSchemaVerificationPassed` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |
| `pack15ExecutionReady` | `false` |

---

## 9. Readiness decision

| Item | Value |
| --- | --- |
| Pack15C/15D readiness (this prep pack) | `PARTIAL / not GO` |
| Decision (this prep pack) | `B) NOT READY` |
| DB apply may run in this pack | **NO** |
| Cursor may run DB apply automatically | **NO** |

**After this pack merges and is verified:** next step is **ChatGPT GO/NO-GO review** of this execution-only pack. DB apply still cannot be run by Cursor automatically. A separate execution authorization step is still required before any operator-run apply.

---

## 10. Still blocked

- DB apply execution
- Pack15D verification execution
- Pack15D DB schema verification
- Pack16 runtime/API implementation
- Pack17 runtime/UI/inbox implementation
- Request mutation
- Payment / booking / SOS / wallet truth changes
- Restore/rollback unless separately authorized by `Nong Si Buong`

---

## 11. Stop list

This preparation pack must **not**:

- Perform DB apply
- Run Prisma, Supabase, SQL, or DB commands
- Connect to DB
- Print or modify `.env` values
- Inspect secrets
- Execute restore or click final Restore
- Execute Pack15D verification
- Unlock Pack16 or Pack17
- Claim execution-only pack authorization
- Claim DB apply performed

---

## 12. Final recommendation (preparation pack)

| Recommendation | Status |
| --- | --- |
| Safe to open PR for docs-only execution-only DB apply pack **preparation** | **YES** — if gate-clean |
| Safe to run DB apply now | **NO** |

---

**Evidence:** `docs/design/evidence/cursor-pack15c-execution-only-db-apply-pack/README.md`
