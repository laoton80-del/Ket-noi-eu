# VIONA Request Engine — Pack15C Supabase DB Secret Location Audit Evidence

**Document type:** No-values DB secret location audit evidence (docs-only — no implementation).
**Baseline:** `origin/master @ 5876b94` — `docs(kernel): sync handoff after Pack17 planning packet (#89)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_INPUTS_INTAKE_TEMPLATE.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 1. Purpose

This document is a **docs-only evidence packet** recording a **no-values** Supabase DB secret location audit for Pack15C execution readiness.

It does **not** modify `.env`.
It does **not** print secrets.
It does **not** run DB commands.
It does **not** run Prisma commands.
It does **not** run Supabase DB commands.
It does **not** connect to DB.
It does **not** apply DB.
It does **not** change schema, migration, runtime, API, or UI.

This audit corrects an earlier `.env.local`-only presence check that reported all DB URL keys as missing.

---

## 2. Current verified baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `5876b94` |
| Message | `docs(kernel): sync handoff after Pack17 planning packet (#89)` |
| Pack17 Kernel/Handoff sync | Complete and green (PR #89) |
| Pack17 planning packet | Complete on master (PR #88 @ `cd92428`) |
| Pack16 planning packet | Complete on master (PR #86 @ `a885425`) |
| Pack15C decision | `B) NOT READY — missing target environment / backup / restore / operator go-no-go` |
| DB apply | **Blocked** |

---

## 3. Audit source and limitation

| Item | Value |
| --- | --- |
| Audit mode | Read-only |
| Audit branch | `viona/cursor-request-pack15c-db-apply-pre-apply-planning-packet-docs-only` |
| Audit HEAD | `fe1b76a` |
| `origin/master` at audit time | `5876b94` |
| Files modified during audit | **None** |
| Commits created during audit | **None** |
| Secret values printed | **No** |
| DB connection attempted | **No** |
| Prisma command run | **No** |
| Supabase DB command run | **No** |

**Important limitation:**

This audit confirms secret **key-name presence only**. It does **not** verify that the secret values are valid, current, or able to connect to DB.

---

## 4. Local env key-name presence result

### Files

| File | Status |
| --- | --- |
| `.env.local` | `PRESENT` |
| `.env` | `PRESENT` |
| `.env.development` | `MISSING` |
| `.env.production` | `MISSING` |

### DB URL key names

| Key | `.env.local` | `.env` |
| --- | --- | --- |
| `DATABASE_URL` | `MISSING` | `PRESENT` |
| `DIRECT_URL` | `MISSING` | `PRESENT` |
| `SHADOW_DATABASE_URL` | `MISSING` | `MISSING` |
| `POSTGRES_URL` | `MISSING` | `MISSING` |
| `POSTGRES_PRISMA_URL` | `MISSING` | `MISSING` |
| `POSTGRES_URL_NON_POOLING` | `MISSING` | `MISSING` |

### Supabase / public keys

| Key | `.env.local` | `.env` |
| --- | --- | --- |
| `SUPABASE_URL` | `MISSING` | `MISSING` |
| `SUPABASE_ANON_KEY` | `MISSING` | `MISSING` |
| `SUPABASE_SERVICE_ROLE_KEY` | `MISSING` | `MISSING` |
| `EXPO_PUBLIC_SUPABASE_URL` | `MISSING` | `MISSING` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `MISSING` | `MISSING` |

### Additional notes

- No values were printed.
- No values were copied into docs.
- No `.env` file was modified.
- `.env.local` still does **not** contain checked DB URL keys.
- Server-side DB key names `DATABASE_URL` and `DIRECT_URL` are **present** in `.env`.

---

## 5. Repo reference summary

Server-side DB key names are referenced in repo, including representative paths:

| Path | Reference |
| --- | --- |
| `prisma/schema.prisma` | `env("DATABASE_URL")` |
| `src/lib/prisma.ts` | `DATABASE_URL` runtime check |
| `scripts/check-local-staging-readiness.ts` | `DATABASE_URL`, `DIRECT_URL` |
| `.env.example` | Placeholder only — no real secret |
| `docs/ai-context/SETUP.md` | `DATABASE_URL` documentation |
| `docs/product/VIONA_REQUEST_PACK15C_*` | Pack15C planning boundaries |
| `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` | Fly secret names including `DATABASE_URL`, `DIRECT_URL` |

- Public Supabase keys are **not** the only key references in repo.
- Server-side DB secret references exist.
- No secret values were recorded in this evidence packet.

---

## 6. Tooling / host secret names

| Item | Status |
| --- | --- |
| `gh` available | `YES` |
| `gh` authenticated | `NO` |
| `fly` available | `YES` |
| `supabase` CLI available | `NO` |
| Fly staging app checked | `viona-api-staging-eu` |

### Fly secret names found (names only)

| Secret name | Status |
| --- | --- |
| `DATABASE_URL` | `Deployed` |
| `DIRECT_URL` | `Deployed` |

Fly secret names and digests were visible, but **no** connection strings or passwords were printed or copied.

---

## 7. Classification

**A) LOCAL PRESENT**

Server-side DB key names `DATABASE_URL` and `DIRECT_URL` are present in local `.env`.

**B) HOST SECRET NAME PRESENT**

`DATABASE_URL` and `DIRECT_URL` are deployed as secret names on Fly staging app `viona-api-staging-eu`.

This is **not C** because only-public Supabase keys are **not** the only keys present.

---

## 8. Decision

| Item | Status |
| --- | --- |
| Pack15C DB secret presence | `PRESENT` by key name only |
| Secret value validity | `NOT VERIFIED` |
| DB connection | `NOT ATTEMPTED` |
| Pack15C execution readiness | `NO-GO` |
| DB apply remains blocked | `YES` |

**Reason:**

- DB secret key names exist locally in `.env` and on Fly staging.
- Target environment still needs explicit human confirmation.
- DB provider/host confirmation still needs explicit human confirmation.
- Backup/snapshot is not confirmed.
- Restore/rollback procedure is not confirmed.
- Named execution operator is not confirmed.
- Operator go/no-go is not confirmed.
- Distinct execution approval phrase is not provided.

---

## 9. Current blocked flags

| Flag | Value |
| --- | --- |
| `pack15ExecutionReady` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15ExecutionInputsComplete` | `false` |
| `pack16RuntimeImplementationStarted` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17RuntimeImplementationStarted` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

---

## 10. Intake update guidance

### Suggested non-secret intake update for Input 3

**From:**

`NO — DB secret not confirmed`

**To:**

`YES — DB secret key names DATABASE_URL and DIRECT_URL are present in local .env and deployed as Fly staging secret names on viona-api-staging-eu; values were not printed, copied, or verified.`

### Additional notes

- `.env.local` still has DB keys **missing**.
- Execution pack must align which env file/tooling will supply Prisma with `DATABASE_URL` and `DIRECT_URL`.
- All other intake inputs remain **NO-GO** until confirmed by human/operator.

---

## 11. Required before DB apply can proceed

DB apply remains **blocked** until **all** are true:

1. Target environment explicitly selected.
2. DB provider/host explicitly confirmed.
3. Valid server-side DB secret configured outside repo.
4. Secret value never pasted into ChatGPT/Cursor/GitHub/docs/logs/commits.
5. Backup/snapshot completed.
6. Restore/rollback procedure documented.
7. Restore owner confirmed.
8. Restore confidence confirmed.
9. Named execution operator confirmed.
10. Stop-on-error behavior confirmed.
11. Post-apply verification plan confirmed.
12. Operator go/no-go confirmed.
13. Separate execution approval phrase provided.
14. ChatGPT reviews completed intake.
15. Separate execution-only DB apply pack is authorized.

---

## 12. Still blocked

The following remain **blocked**:

- DB apply
- Pack15C execution-only DB apply pack
- Pack15D DB schema verification
- Pack16 runtime implementation
- Pack16 read-only persistence API
- Pack17 runtime implementation
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

## 13. Stop list

Hard stop if any of the following appear without authorized follow-on pack:

- `.env` values are printed
- `.env` files are modified
- DB secret is pasted into docs
- DB command is run
- Prisma migrate/status/apply command is run
- Supabase DB command is run
- DB connection is attempted
- DB apply is claimed
- Pack15C execution readiness is claimed as GO
- Pack16 runtime/API is implemented
- Pack17 runtime/UI/inbox is implemented
- API/mutation/live runtime is added
- Fake production claim appears
- Out-of-allowlist files changed

---

## 14. Next recommended action

1. Human explicitly confirms target environment, likely **staging**.
2. Human explicitly confirms DB provider/host, likely **Supabase**.
3. Human confirms whether DB apply will use local `.env`, Fly secrets, or another controlled execution context.
4. Human confirms named operator and execution machine.
5. Human takes real DB backup/snapshot and records timestamp/evidence location without secrets.
6. Human documents restore/rollback owner and procedure.
7. Human confirms stop-on-error and post-apply verification plan.
8. Human provides target-specific execution approval phrase only after all above are truly ready.
9. ChatGPT reviews GO/NO-GO.
10. Only then prepare separate execution-only DB apply pack.

---

## Evidence

`docs/design/evidence/cursor-pack15c-supabase-db-secret-location-audit-evidence/README.md`
