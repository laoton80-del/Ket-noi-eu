# VIONA Request Engine — Pack15C Direct URL DB Apply Retry Pack

**Document type:** Execution-only DB apply retry packet (docs-only preparation — no execution).
**Baseline:** `origin/master @ 662d743` — `feat(pack15c): wire Prisma directUrl for migration-safe path (#129)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_DIRECT_URL_WIRING_IMPLEMENTATION.md`, `docs/product/VIONA_REQUEST_PACK15C_DIRECT_SESSION_PATH_DESIGN.md`, `docs/product/VIONA_REQUEST_PACK15C_DB_CONNECTIVITY_CONFIG_AUDIT.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_RETRY_RESULT.md`, `docs/product/VIONA_REQUEST_PACK15D_POST_APPLY_VERIFICATION_PLAN.md`, `prisma/schema.prisma`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `662d743` |
| Message | `feat(pack15c): wire Prisma directUrl for migration-safe path (#129)` |
| Pack15C direct URL wiring implementation | Complete and green on master (PR #129 @ `662d743`) |
| Pack15C direct/session path design | Complete and green on master (PR #128 @ `bbf1c8f`) |
| Pack15C DB connectivity config audit | Complete and green on master (PR #127 @ `9741c4c`) |
| Stop-on-error status (prior gate) | `CONFIRMED_FINAL_INTAKE` |
| Operator GO | **`PROVIDED`** |
| Execution approval phrase | **`PROVIDED`** |
| Target | `viona-staging-eu` / `euqbfanilcssjiwwtcby` (staging only) |
| DB apply performed | **NO** |

### Direct URL wiring verified (PR #129)

| Item | State |
| --- | --- |
| `schema.prisma` — `url = env("DATABASE_URL")` | **Wired** |
| `schema.prisma` — `directUrl = env("DIRECT_URL")` | **Wired** |
| `.env.example` — generic `DIRECT_URL` placeholder | **Documented** |
| Prisma models changed in wiring pack | **NO** |
| Migrations changed in wiring pack | **NO** |

### Prior failure chain preserved

| Item | Result |
| --- | --- |
| Prior pooler pre-check (`DATABASE_URL` port `:6543`) | Hung — process stopped (PR #122, PR #126) |
| Prior unauthorized direct session retry | Failed — Prisma `P1001` (PR #122) |
| `npx prisma migrate deploy` | **NOT RUN** |
| Post-apply `npx prisma migrate status` | **NOT RUN** |
| DB apply performed | **NO** |

---

## 2. Retry pack purpose

This pack **prepares** a future execution-only DB apply **retry** packet that uses Prisma’s direct/session migration path via wired `directUrl = env("DIRECT_URL")`, while preserving stop-on-error and no-secret boundaries.

| Item | State |
| --- | --- |
| Direct URL DB apply retry packet prepared | **YES** (this docs-only prep pack) |
| Retry executed in this pack | **NO** |
| Retry authorized by this pack | **NO** |
| DB reachability claimed fixed | **NO** |
| Cursor may run DB apply automatically | **NO** |

ChatGPT GO/NO-GO review is **still required** before any future authorized retry execution. A **human/operator execution confirmation** is **required** before running commands. This preparation pack does **not** authorize retry execution.

---

## 3. Scope

| Item | Value |
| --- | --- |
| Pack | Pack15C direct URL DB apply **retry** packet |
| Environment | **Staging only** |
| Supabase project label | `viona-staging-eu` |
| Supabase project ref | `euqbfanilcssjiwwtcby` |
| Migration folder | `prisma/migrations/20260615120000_add_viona_request_models/` |
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |
| Execution context (candidate) | Local operator machine using local `.env` |

### Explicitly excluded

| Excluded target | Status |
| --- | --- |
| Production | **EXCLUDED** |
| Legacy paused project `laoton80-del's Project` | **EXCLUDED** |
| Any target other than `viona-staging-eu` / `euqbfanilcssjiwwtcby` | **EXCLUDED** |

---

## 4. Absolute boundary (this prep pack)

| Boundary | State |
| --- | --- |
| DB apply retry performed | **NO** |
| DB apply performed | **NO** |
| Prisma/Supabase/SQL/DB commands run | **NO** |
| DB connection attempted | **NO** |
| `.env*` modified | **NO** |
| `schema.prisma` modified | **NO** |
| Retry authorized | **NO** |
| Pack15D authorized | **NO** |
| Pack16 / Pack17 unlocked | **NO** |
| Secret values printed | **NO** |
| Real URL values printed | **NO** |

---

## 5. Retry preconditions (future execution only)

Before any future authorized retry execution, the operator must confirm:

- [ ] Target staging project is **`viona-staging-eu`**
- [ ] Project ref is **`euqbfanilcssjiwwtcby`**
- [ ] Legacy paused project **`laoton80-del's Project`** is **not** selected
- [ ] Operator confirms **no wrong project** selected
- [ ] Current dashboard backup visible **immediately before retry** (previously recorded: `18 Jun 2026 02:04:53 (+0000)` or newer visible backup)
- [ ] `DATABASE_URL` key present by **key name only** — do not print value
- [ ] `DIRECT_URL` key present by **key name only** — do not print value
- [ ] `DIRECT_URL` port class confirmed as **`5432` only** — no URL printed
- [ ] No URL values printed
- [ ] No host/user/password/token printed
- [ ] Operator accepts stop-on-error rule (§7)
- [ ] Operator understands Pack15D/16/17 stay blocked unless DB apply succeeds
- [ ] ChatGPT GO/NO-GO review has approved retry execution
- [ ] Human/operator execution confirmation recorded before apply

---

## 6. Future execution commands

**Label:** `FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK`

No command was run in this preparation pack. The following is the **exact** minimal command plan for operator review after ChatGPT GO/NO-GO review and separate execution authorization.

**No extra Prisma/DB/Supabase/SQL commands.** **No Pack15D commands in this retry pack.**

### Expected Prisma connection behavior

| Env key | Role |
| --- | --- |
| `DATABASE_URL` | Runtime/pooler (port class `6543` in operator env) — **not** the intended migrate CLI path after PR #129 |
| `DIRECT_URL` | Direct/session migration-safe path (port class `5432`) — Prisma migrate status/deploy should use this via `directUrl = env("DIRECT_URL")` |

**Do not print env values.** Capture only non-secret command output in future result evidence.

### Phase 1 — Pre-apply status check (future only)

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION — confirm DIRECT_URL key present; port class 5432 only; no URL printed
npx prisma migrate status
```

**Stop-on-error:** If `migrate status` fails, hangs unexpectedly, or shows unexpected pending/applied state, **stop immediately**. Do not continue to deploy.

### Phase 2 — Apply existing VIONA Request migration (future only)

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION
npx prisma migrate deploy
```

**Rules:**

- Apply **only** migration `20260615120000_add_viona_request_models` via approved deploy path.
- **No** `prisma migrate dev`, `prisma db push`, or `prisma db execute`.
- **Stop immediately** on non-zero exit.

### Phase 3 — Minimum post-apply status check (future only)

Run **only after** Phase 2 succeeds:

```bash
# FUTURE EXECUTION ONLY — NOT RUN IN THIS PACK
# NEEDS_OPERATOR_CONFIRMATION_BEFORE_EXECUTION
npx prisma migrate status
```

**Do not run Pack15D verification commands in this retry pack.** If Phase 2 succeeds, create DB apply result evidence and proceed to a **separate Pack15D verification pack**.

---

## 7. Stop-on-error rule

Copy exactly from Pack15C final stop-on-error intake (PR #111):

```text
If any DB apply, Prisma, Supabase, SQL, migration, schema verification, or Pack15D verification step fails or returns an unexpected error, stop immediately. Do not continue with extra Prisma, Supabase, SQL, DB, schema, or migration commands. Capture only non-secret output, report the failure, and wait for human review. Do not attempt restore/rollback unless separately authorized by Nong Si Buong.
```

---

## 8. Explicit non-authorization

| Item | State |
| --- | --- |
| This pack authorizes DB retry | **NO** |
| This pack runs DB commands | **NO** |
| This pack authorizes Pack15D | **NO** |
| ChatGPT GO/NO-GO review required before execution | **YES** |
| Human/operator execution confirmation required before commands | **YES** |
| DB reachability claimed fixed | **NO** |
| Retry authorized | **NO** |

---

## 9. Status flags

| Flag | Value |
| --- | --- |
| `pack15DirectSessionPathImplemented` | `true` |
| `pack15DirectUrlWiredInSchema` | `true` |
| `pack15DirectUrlPlaceholderDocumented` | `true` |
| `pack15DirectUrlDbApplyRetryPackPrepared` | `true` |
| `pack15DirectUrlDbApplyRetryAuthorized` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15DVerificationExecuted` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

---

## 10. Still blocked

- DB apply retry execution
- Pack15D verification execution
- Pack16 runtime/API implementation
- Pack17 runtime/UI/inbox implementation
- Restore/rollback unless separately authorized by Nong Si Buong

---

## 11. Final recommendation (preparation pack)

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only direct URL DB apply retry preparation | **YES** — if gate-clean |
| Safe to execute DB retry now | **NO** |
| Safe to run Pack15D now | **NO** |
| Next after merge/verify | ChatGPT GO/NO-GO review; then separate human/operator execution authorization |

---

**Evidence:** `docs/design/evidence/cursor-pack15c-direct-url-db-apply-retry-pack/README.md`
