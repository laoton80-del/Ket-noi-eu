# VIONA Request Engine — Pack15C DB Reachability Remediation Plan

**Document type:** DB reachability remediation plan (docs-only — no execution, no retry).
**Baseline:** `origin/master @ 27e617e` — `docs(requests): record Pack15C DB apply stop-on-error result (#122)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_RESULT.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_PACK.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 1. Current failure summary

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `27e617e` |
| Message | `docs(requests): record Pack15C DB apply stop-on-error result (#122)` |
| Pack15C stop-on-error evidence | Complete and green on master (PR #122) |
| Target | `viona-staging-eu` / `euqbfanilcssjiwwtcby` (staging only) |

### Observed failure (PR #122 evidence)

| Item | Result |
| --- | --- |
| `npx prisma migrate status` (pooler URL, port `6543`) | **Hung** — process stopped |
| `npx prisma migrate status` (direct staging retry) | **FAILED** — Prisma `P1001` database unreachable |
| Stop-on-error triggered | **YES** — correctly |
| `npx prisma migrate deploy` | **NOT RUN** |
| Post-apply `npx prisma migrate status` | **NOT RUN** |
| DB apply performed | **NO** |
| Pack15D verification executed | **NO** |
| Pack16 / Pack17 touched | **NO** |
| Secret values printed | **NO** |
| `.env*` modified | **NO** |
| Restore/rollback attempted | **NO** |

This remediation plan does **not** claim DB reachability is fixed. It documents operator steps to confirm reachability **outside the repo** before any future authorized retry.

---

## 2. Current flags

| Flag | Value |
| --- | --- |
| `pack15DbApplyAttempted` | `true` |
| `pack15DbApplyCompleted` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15ExecutionStoppedOnError` | `true` |
| `pack15ExecutionStopReason` | `P1001 database unreachable / pooler status hang` |
| `pack15DVerificationExecuted` | `false` |
| `pack15DSchemaVerificationPassed` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

---

## 3. Remediation checklist — human/operator only

**Operator:** `Nong Si Buong` (or named delegate). Confirm each item **without printing secret values**. Record only YES/NO or key-name presence in external operator notes — **not** in committed repo docs containing secrets.

- [ ] Supabase project **`viona-staging-eu`** is **active** and **not paused**
- [ ] Project ref is **`euqbfanilcssjiwwtcby`**
- [ ] Legacy paused project **`laoton80-del's Project`** is **not** used
- [ ] Staging DB is **reachable** from the intended execution network
- [ ] VPN / network environment is **known and stable**
- [ ] Supabase IP allowlist / network restrictions, if enabled, **allow** the operator execution environment
- [ ] Pooler connection mode / port is **suitable** for Prisma `migrate status` / `migrate deploy` (or direct connection will be used for migrations per operator decision)
- [ ] Direct connection settings are **present and correct by key name only** (`DIRECT_URL`)
- [ ] Local / deployment secret keys exist **by key name only**, without values (`DATABASE_URL`, `DIRECT_URL`)
- [ ] **No production** target is selected
- [ ] A **current backup** is visible in Supabase Dashboard before any retry (prior reference: `18 Jun 2026 02:04:53 (+0000)`)
- [ ] Rollback / restore remains **not authorized** unless separately approved by **Nong Si Buong**

**Hard rule:** If any checklist item cannot be confirmed without exposing secrets, **stop** and resolve offline before any retry pack.

---

## 4. No-value secret policy

| Rule | Required |
| --- | --- |
| Do not print `DATABASE_URL` | **YES** |
| Do not print `DIRECT_URL` | **YES** |
| Do not print Supabase credentials | **YES** |
| Do not paste connection strings into docs or chat | **YES** |
| Only key names and presence may be recorded | **YES** |

Agents and operators must capture reachability outcomes as non-secret summaries only (e.g. “staging ref confirmed”, “P1001 resolved”, “allowlist updated”) — never connection string contents.

---

## 5. Retry policy

| Policy | State |
| --- | --- |
| Retry in this remediation plan | **NO** |
| Retry requires new separate execution-only retry pack | **YES** |
| Retry must use same stop-on-error rule (§7) | **YES** |
| Retry only after target/reachability confirmed without exposing secrets | **YES** |
| Retry must exclude production | **YES** |
| Retry must exclude legacy paused project | **YES** |
| Pack15D remains blocked until successful DB apply | **YES** |
| Pack16 / Pack17 remain blocked | **YES** |

This plan does **not** authorize retry. It does **not** claim DB reachability is fixed.

---

## 6. Future retry command plan

**Label:** `FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK — BLOCKED UNTIL SEPARATE RETRY PACK AUTHORIZATION`

No command is run in this remediation plan. Future authorized retry pack may use **only** this minimal sequence (same as Pack15C execution-only DB apply pack):

| # | Command | Status in this pack |
| --- | --- | --- |
| 1 | `npx prisma migrate status` | **NOT RUN** — blocked |
| 2 | `npx prisma migrate deploy` | **NOT RUN** — blocked |
| 3 | `npx prisma migrate status` (post-apply) | **NOT RUN** — blocked |

Do not run `prisma migrate dev`, `prisma db push`, `prisma db execute`, ad-hoc SQL, or Supabase DB commands.

---

## 7. Stop-on-error rule

Copy exactly from Pack15C final stop-on-error intake (PR #111):

```text
If any DB apply, Prisma, Supabase, SQL, migration, schema verification, or Pack15D verification step fails or returns an unexpected error, stop immediately. Do not continue with extra Prisma, Supabase, SQL, DB, schema, or migration commands. Capture only non-secret output, report the failure, and wait for human review. Do not attempt restore/rollback unless separately authorized by Nong Si Buong.
```

---

## 8. Absolute boundary (this pack)

| Boundary | State |
| --- | --- |
| DB apply performed | **NO** |
| DB reachability fixed / claimed | **NO** |
| Prisma/Supabase/SQL/DB commands run | **NO** |
| DB connection attempted | **NO** |
| Secret values inspected or printed | **NO** |
| `.env*` modified | **NO** |
| Restore/rollback attempted | **NO** |
| Pack15D verification executed | **NO** |
| Pack16 / Pack17 unlocked | **NO** |

---

## 9. Next sequence after this plan merges

1. Operator performs no-secret reachability remediation **outside repo** (checklist §3).
2. Separate execution-only **retry** pack may be prepared (docs-only or authorized execution) — **not** in this pack.
3. ChatGPT / human review of retry authorization before any DB commands.
4. If DB apply eventually succeeds, Pack15D verification pack — **not** before successful apply.
5. Pack16 / Pack17 remain blocked until Pack15D passes.

---

## 10. Recommendation

| Recommendation | Status |
| --- | --- |
| Safe to open PR for docs-only DB reachability remediation plan | **YES** — if gate-clean |
| Safe to retry DB apply now | **NO** |
| Next after merge/verify | Operator performs no-secret reachability remediation outside repo; then separate execution-only retry pack may be prepared |

---

**Evidence:** `docs/design/evidence/cursor-pack15c-db-reachability-remediation-plan/README.md`
