# VIONA Request Engine — Pack15C Execution Inputs Intake Template

**Document type:** Human/operator execution inputs intake template (docs-only — no execution).
**Baseline:** `origin/master @ eca97e4` — `docs(kernel): sync handoff after Pack15C readiness decision (#83)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_READINESS_DECISION_PACKET.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 1. Purpose

This document is a **docs-only intake template** for collecting human/operator execution inputs required before any Pack15C DB apply execution-only pack may be written.

It does **not** apply DB.
It does **not** run DB commands.
It does **not** run Prisma commands.
It does **not** inspect secrets.
It does **not** change schema, migration, runtime, API, or mutation.
It does **not** unlock live product features.

Current DB apply state is **blocked**. Pack15C execution readiness decision is **`B) NOT READY`**. No DB apply may run from this template. This template is **not** execution approval. This template does **not** contain secrets. Any `DATABASE_URL` or secret must be confirmed **outside repo only**. An execution-only pack may be written only after all required inputs in section 4 are complete and separately approved.

---

## 2. Current verified state

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `eca97e4` |
| Message | `docs(kernel): sync handoff after Pack15C readiness decision (#83)` |
| Pack15C decision | `B) NOT READY — missing target environment / backup / restore / operator go-no-go` |
| `pack15ExecutionReady` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |

---

## 3. Approval boundary

| Boundary | Rule |
| --- | --- |
| Pack15B approval phrase | Permits **planning only** |
| Pack15B phrase | **Not** execution approval |
| This intake template | **Not** execution approval |
| Execution approval | Must be **distinct**, **explicit**, and **target-specific** |
| DB apply | Remains **blocked** until all 15 inputs in section 4 are complete |

### Pack15B phrase (planning only — not execution approval)

```txt
APPROVED Pack15 DB apply readiness for the existing VIONA Request migration. I confirm DB apply may be planned next, but not performed in Pack15B.
```

---

## 4. Execution input form

Human/operator: fill the **Human/operator answer** and **Evidence location / confirmation method** columns outside this repo where secrets apply. Update **Status** to `Ready` only when evidence exists. Default status is `Missing` until completed.

| # | Required input | Human/operator answer | Evidence location / confirmation method | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Target environment: local / staging / production / other | | | Missing | |
| 2 | Database provider/host | | | Missing | |
| 3 | `DATABASE_URL` / secret confirmed outside repo, not committed | | | Missing | Confirm existence only — do not paste value |
| 4 | Named responsible execution operator | | | Missing | |
| 5 | Execution machine/context | | | Missing | |
| 6 | Maintenance window / user impact | | | Missing | |
| 7 | Explicit execution go/no-go | | | Missing | |
| 8 | Backup/snapshot method | | | Missing | |
| 9 | Backup owner | | | Missing | |
| 10 | Pre-apply backup timestamp evidence | | | Missing | |
| 11 | Restore procedure | | | Missing | |
| 12 | Restore test/confidence level | | | Missing | |
| 13 | Rollback limitations | | | Missing | |
| 14 | Restore/rollback operator | | | Missing | |
| 15 | Distinct execution approval phrase for actual `npx prisma migrate deploy` on named target | | | Missing | Separate from Pack15B planning phrase |

---

## 5. Secret handling rules

- Do **not** paste `DATABASE_URL` into docs
- Do **not** commit `.env`
- Do **not** print secrets in logs
- Confirm secret existence and target **outside repo only**
- Evidence should say **"confirmed outside repo"** without exposing the value
- If a secret appears in docs or logs, **stop immediately**

---

## 6. Backup / restore minimum bar

Execution remains **blocked** until all of the following are satisfied:

- Backup method is **concrete**
- Backup owner is **named**
- Backup timestamp evidence exists **before** apply
- Restore procedure is **concrete**
- Restore owner is **named**
- Restore test or confidence level is **documented**
- Rollback limitations are **documented**
- Restore/rollback operator is **named**

---

## 7. Target environment minimum bar

Execution remains **blocked** until all of the following are satisfied:

- Exact environment is **selected** (local / staging / production / other)
- Provider/host is **confirmed outside repo**
- Secret points **only** to that target
- Execution machine/context is **known**
- User impact and maintenance window are **decided**
- Operator gives **explicit go/no-go**

---

## 8. Future command boundary

Future commands are allowed **only** in a later authorized execution-only pack:

- `npx prisma migrate status`
- `npx prisma migrate deploy`

These commands must **not** be run in this intake-template pack.

---

## 9. Migration target reference

| Item | Path |
| --- | --- |
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |

### Read-only audit summary (not DB apply evidence)

| Check | Result |
| --- | --- |
| CREATE TYPE count | `1` |
| CREATE TABLE count | `6` |
| CREATE INDEX count | `12` |
| ALTER TABLE count | `5` |
| DROP count | `0` |
| DELETE/TRUNCATE count | `0` |
| Destructive SQL detected | **NO** |

This is **read-only audit evidence only**. It is **not** DB apply evidence.

---

## 10. Current flags

| Flag | Value |
| --- | --- |
| `pack15ExecutionReady` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |

---

## 11. Still blocked

The following remain **blocked**:

- DB apply
- Pack15C execution-only DB apply pack
- Pack15D DB schema verification
- Read-only persistence API
- Live read-only request inbox
- Request mutation
- Admin Debug live data
- OPERATOR Prisma/Auth
- Payment capture
- Booking confirmation
- SOS dispatch
- Wallet mutation
- Live AI protected actions
- Live merchant execution

---

## 12. Completion criteria before execution-only pack

A future execution-only pack may be **considered** only when:

- All 15 inputs in section 4 are **complete** (Status = `Ready` where applicable)
- **No** secret is exposed in docs or logs
- Operator go/no-go is **explicit**
- Backup and restore plans are **concrete**
- Target environment is **explicit**
- Execution approval phrase (row 15) is **provided**
- ChatGPT reviews the completed intake
- Cursor receives a **separate** execution-only prompt

---

## 13. Stop list

Hard stop if any of the following appear:

- Target environment remains missing
- Backup plan remains missing
- Restore plan remains missing
- Operator remains missing
- Execution approval phrase missing
- Secret appears in docs or logs
- `.env` changes appear
- Prisma schema or migration changes appear
- Runtime/API/mutation changes appear
- DB command was run without authorized execution-only pack
- Fake production claim appears
- Payment/booking/SOS/wallet/live AI changes appear
- OPERATOR Prisma/Auth changes appear

---

## Evidence

`docs/design/evidence/cursor-pack15c-execution-inputs-intake-template/README.md`
