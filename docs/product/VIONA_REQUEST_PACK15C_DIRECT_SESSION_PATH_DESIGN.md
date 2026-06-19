# VIONA Request Engine — Pack15C Direct/Session Path Design

**Document type:** Direct/session migration path design packet (docs-only — no implementation, no DB commands).
**Baseline:** `origin/master @ 9741c4c` — `docs(requests): add Pack15C DB connectivity config audit (#127)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_DB_CONNECTIVITY_CONFIG_AUDIT.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_RETRY_RESULT.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_RETRY_PACK.md`, `prisma/schema.prisma`, `.env.example`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `9741c4c` |
| Message | `docs(requests): add Pack15C DB connectivity config audit (#127)` |
| Pack15C DB connectivity config audit | Complete and green on master (PR #127 @ `9741c4c`) |
| Pack15C retry failure evidence | Complete and green on master (PR #126 @ `474603d`) |
| Target | `viona-staging-eu` / `euqbfanilcssjiwwtcby` (staging only) |
| DB apply performed | **NO** |

### Audit findings summarized (PR #127)

| Finding | State |
| --- | --- |
| `schema.prisma` uses `url = env("DATABASE_URL")` only | **Confirmed** |
| `schema.prisma` has no `directUrl` | **Confirmed** |
| `prisma.config.ts` does not exist | **Confirmed** |
| Prisma migrate status/deploy uses `DATABASE_URL` | **Confirmed** |
| Operator `DATABASE_URL` present; port class `6543` (pooler) | **Confirmed** (key name / port class only) |
| Operator `DIRECT_URL` present; port class `5432`; not wired in schema | **Confirmed** (key name / port class only) |
| `.env.example` documents `DATABASE_URL` only; no `DIRECT_URL` | **Confirmed** |
| Prior Pack15C retry hung on pooler `:6543` | **Confirmed** (PR #126) |
| DB apply not performed | **Confirmed** |
| Pack15D / Pack16 / Pack17 blocked | **Confirmed** |

---

## 2. Design purpose

This pack **designs** a safe direct/session migration path for future separately authorized implementation and retry packs. It does **not** implement schema changes, modify `.env*`, or run DB commands.

| Goal | Description |
| --- | --- |
| Avoid pooler path for migrate | Do **not** use pooler `DATABASE_URL` port `:6543` for Prisma `migrate status` / `migrate deploy` |
| Use direct/session path | Route migration-safe Prisma CLI operations through `DIRECT_URL` port `:5432` by key name only |
| Preserve runtime pooler | Keep `DATABASE_URL` for runtime/pooler application usage |
| Staging only | Target `viona-staging-eu` / `euqbfanilcssjiwwtcby`; exclude production and legacy paused project |

**Critical boundary:** This design pack prepares documentation only. It does **not** authorize implementation, DB apply, or retry execution.

---

## 3. Proposed future implementation

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT EXECUTED IN THIS PACK`

The following is the proposed wiring after a **separately authorized implementation pack** merges:

### 3.1 `prisma/schema.prisma` (future — not modified in this pack)

If compatible with current Prisma version (`^6.19.0` per `package.json`):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

| Item | Future intent |
| --- | --- |
| `url` | Remains `DATABASE_URL` — runtime/pooler usage |
| `directUrl` | New — `DIRECT_URL` for migration-safe direct/session path |
| Migration SQL | **No changes** |
| New migrations | **None** |

Prisma migrate status/deploy should use the migration-safe direct/session path when `directUrl` is declared, avoiding pooler `:6543` for CLI migrate operations.

### 3.2 `.env.example` (future — not modified in this pack)

Add documented placeholder only (no real values):

```dotenv
# Direct PostgreSQL connection for Prisma migrations (session/direct port; not pooler).
# Use staging direct URL for viona-staging-eu only — never commit real secrets.
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

| Item | Future intent |
| --- | --- |
| `DATABASE_URL` | Retained — pooler/runtime example |
| `DIRECT_URL` | New placeholder — documents key name only |
| Real values | **Never** committed |

### 3.3 Target and exclusions (unchanged)

| Target | Status |
| --- | --- |
| Staging `viona-staging-eu` / `euqbfanilcssjiwwtcby` | **In scope** for future authorized retry |
| Production | **EXCLUDED** |
| Legacy paused project `laoton80-del's Project` | **EXCLUDED** |

---

## 4. Safety constraints (this design pack)

| Constraint | State |
| --- | --- |
| DB commands in this pack | **NO** |
| Schema change in this pack | **NO** |
| `.env*` modification in this pack | **NO** |
| Secret values in docs | **NO** |
| URL values in docs | **NO** (template placeholders use generic `USER:PASSWORD@HOST` pattern only in future sections) |
| Host/user/password/token in docs | **NO** (except generic placeholder tokens in future `.env.example` template) |
| Allowed key names in docs | `DATABASE_URL`, `DIRECT_URL` only |
| DB reachability claimed fixed | **NO** |
| DB apply performed | **NO** |
| Retry authorized | **NO** |

---

## 5. Future implementation pack requirements

A **separately authorized** implementation pack (after this design merges and is verified) must:

| Requirement | Rule |
| --- | --- |
| Files modified | **`prisma/schema.prisma`** and **`.env.example`** only — if authorized |
| Schema change | Add `directUrl = env("DIRECT_URL")` to datasource block |
| `.env.example` | Add `DIRECT_URL` template placeholder (no real values) |
| Migration SQL | **No changes** |
| Generated migration | **None** |
| DB apply | **NO** |
| Prisma migrate commands | **NO** (`migrate status`, `migrate deploy`, `migrate dev`, etc.) |
| DB connection | **NO** |
| Checks | Static checks only (`prisma validate`, `tsc`, smoke, forbidden-claims, etc.) |
| Kernel/handoff | Touch only if a dedicated sync pack is authorized |

**Do not** run DB apply or retry in the implementation pack.

---

## 6. Future retry pack requirements

A **later** retry pack (after implementation merges, separate authorization, and ChatGPT/operator GO) must:

### Preconditions (key name / port class only)

- [ ] Confirm `DIRECT_URL` key exists by key name only
- [ ] Confirm port class `5432` only — no URL printed
- [ ] Confirm target is staging `viona-staging-eu` / `euqbfanilcssjiwwtcby`
- [ ] Confirm production and legacy paused project are excluded
- [ ] Confirm stop-on-error rule (§7)
- [ ] Confirm separate retry authorization recorded

### Authorized commands only

Run **only** these commands, in order, after authorization:

1. `npx prisma migrate status`
2. `npx prisma migrate deploy` — only if step 1 succeeds without unexpected error
3. Post-apply `npx prisma migrate status` — only if step 2 succeeds

**Label:** `FUTURE EXECUTION ONLY — NOT RUN IN THIS DESIGN PACK`

| Rule | Requirement |
| --- | --- |
| Stop-on-error | Obey §7 exactly |
| Extra Prisma/DB commands | **Forbidden** |
| Pack15D in retry pack | **NO** — separate pack after successful DB apply |
| Result evidence | Create retry result docs on success or failure |
| Session-only env override | **Not** preferred once `directUrl` is wired — use schema wiring instead |

---

## 7. Stop-on-error rule

Copy exactly from Pack15C final stop-on-error intake (PR #111):

```text
If any DB apply, Prisma, Supabase, SQL, migration, schema verification, or Pack15D verification step fails or returns an unexpected error, stop immediately. Do not continue with extra Prisma, Supabase, SQL, DB, schema, or migration commands. Capture only non-secret output, report the failure, and wait for human review. Do not attempt restore/rollback unless separately authorized by Nong Si Buong.
```

---

## 8. Status flags

| Flag | Value |
| --- | --- |
| `pack15DirectSessionPathDesignPrepared` | `true` |
| `pack15DirectSessionPathImplemented` | `false` |
| `pack15DirectUrlWiredInSchema` | `false` |
| `pack15DbApplyRetryAuthorized` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15DVerificationExecuted` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

---

## 9. Still blocked

- Direct/session path implementation (schema + `.env.example`)
- DB apply retry execution
- Pack15D verification execution
- Pack16 runtime/API implementation
- Pack17 runtime/UI/inbox implementation
- Restore/rollback unless separately authorized by Nong Si Buong

---

## 10. Stop list

This design pack must **not**:

- Modify `prisma/schema.prisma`
- Add `directUrl` in this pack
- Modify `.env.example` in this pack
- Run Prisma, Supabase, SQL, or DB commands
- Connect to DB
- Print or inspect secret values
- Claim DB reachability fixed
- Claim DB apply performed
- Claim retry authorized
- Unlock Pack15D, Pack16, or Pack17

---

## 11. Final recommendation (design pack)

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only direct/session path design | **YES** — if gate-clean |
| Safe to implement schema change now | **NO** |
| Safe to retry DB apply now | **NO** |
| Next after merge/verify | Separately authorized **implementation pack** to wire `directUrl` in schema and document `DIRECT_URL` in `.env.example` |

---

**Evidence:** `docs/design/evidence/cursor-pack15c-direct-session-path-design/README.md`
