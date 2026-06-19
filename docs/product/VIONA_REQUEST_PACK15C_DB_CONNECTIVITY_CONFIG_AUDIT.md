# VIONA Request Engine — Pack15C DB Connectivity Config Audit

**Document type:** No-values DB connectivity configuration audit (docs-only — no DB commands).
**Baseline:** `origin/master @ 474603d` — `docs(requests): record Pack15C DB apply retry stop-on-error result (#126)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_RETRY_RESULT.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_RETRY_PACK.md`, `docs/product/VIONA_REQUEST_PACK15C_SUPABASE_DB_SECRET_LOCATION_AUDIT_EVIDENCE.md`, `prisma/schema.prisma`, `.env.example`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `474603d` |
| Message | `docs(requests): record Pack15C DB apply retry stop-on-error result (#126)` |
| Pack15C retry failure evidence | Complete and green on master (PR #126 @ `474603d`) |
| Pack15C retry pack prep | Complete and green on master (PR #125 @ `d05a8a4`) |
| Target | `viona-staging-eu` / `euqbfanilcssjiwwtcby` (staging only) |
| DB apply performed | **NO** |

---

## 2. Failure summary (preserved)

| Item | Result |
| --- | --- |
| Authorized retry pre-check | `npx prisma migrate status` |
| Connection path used | Operator `DATABASE_URL` (pooler port `:6543`) |
| Result | **Hung** — no migration summary within 120s; process stopped |
| `npx prisma migrate deploy` | **NOT RUN** |
| Post-apply `npx prisma migrate status` | **NOT RUN** |
| Stop-on-error triggered | **YES** |
| Unauthorized direct-URL retry in retry pack | **NO** |
| DB apply performed | **NO** |

Prior first attempt (PR #122) also hung on pooler pre-check; a separate session-only direct retry failed with Prisma `P1001` — that path was **not** used in the authorized retry pack (PR #126).

---

## 3. Config audit scope

This audit inspects **repository configuration** and **key-name / port-class presence only**. It does **not** run Prisma, Supabase, SQL, or DB commands. It does **not** connect to DB. It does **not** print secret values, hosts, usernames, passwords, tokens, or full URLs.

---

## 4. Prisma datasource configuration

### `prisma/schema.prisma`

| Item | Finding |
| --- | --- |
| Datasource provider | `postgresql` |
| Primary URL env key | `env("DATABASE_URL")` |
| `directUrl` in schema | **NO** — not declared |
| `DIRECT_URL` referenced in schema | **NO** |
| Other datasource overrides | **None** |

**Conclusion:** Prisma CLI commands (`migrate status`, `migrate deploy`, `migrate dev`, etc.) use **`DATABASE_URL` only** per schema. There is no schema-level direct/session migration URL wiring.

### `prisma.config.ts` / `prisma.config.*`

| Item | Finding |
| --- | --- |
| File present | **NO** |
| Datasource override | **N/A** |

---

## 5. Which env key Prisma migrate uses

| Prisma command (authorized Pack15C retry plan) | Env key used by repo config | Notes |
| --- | --- | --- |
| `npx prisma migrate status` | **`DATABASE_URL`** | From `schema.prisma` datasource `url` |
| `npx prisma migrate deploy` | **`DATABASE_URL`** | Same datasource |
| Post-apply `npx prisma migrate status` | **`DATABASE_URL`** | Same datasource |
| `DIRECT_URL` | **Not used by schema** | Present in operator env by key name; not wired to Prisma migrate unless separately overridden at runtime |

**Conclusion:** Default Pack15C retry command plan routes Prisma migrate through **`DATABASE_URL`**, not `DIRECT_URL`.

---

## 6. Pooler vs direct routing assessment

| Question | Assessment |
| --- | --- |
| Does repo config route Prisma CLI/migrate through pooled/runtime URL? | **YES** — when operator `DATABASE_URL` is a pooler URL (port `:6543`), migrate/status/deploy use that pooler path |
| Is a direct/session migration path available in schema? | **NO** — `directUrl` absent; `DIRECT_URL` not referenced |
| Is a direct/session path available by operator env key name only? | **YES** — `DIRECT_URL` key present in operator `.env` with port class `5432`; **not** used by default Prisma migrate commands |
| Does `.env.example` document `DIRECT_URL`? | **NO** — only `DATABASE_URL` example (template port `5432`) |

**Conclusion:** Repeated pooler `:6543` hang on `migrate status` is **consistent with config wiring**: authorized commands use `DATABASE_URL`, and operator `DATABASE_URL` is classified as pooler `:6543`. A direct/session path exists only as an unused env key unless command plan or env mapping changes under separate authorization.

---

## 7. Package scripts (recorded only — not executed)

From `package.json` (Prisma-related scripts):

| Script | Command | Uses migrate status/deploy? |
| --- | --- | --- |
| `db:format` | `prisma format` | No |
| `db:generate` | `prisma generate` | No |
| `db:validate` | `prisma validate` | No |
| `db:push` | `prisma db push` | No (forbidden in Pack15C execution packs) |
| `db:migrate` | `prisma migrate dev` | No — dev workflow, not deploy/status |
| `db:studio` | `prisma studio` | No |

**Note:** There is **no** npm script for `prisma migrate status` or `prisma migrate deploy`. Pack15C execution packs use raw `npx prisma migrate status` / `npx prisma migrate deploy`, which inherit `DATABASE_URL` from schema + loaded env.

---

## 8. Key-name / port-class classification (no values)

Audit method: read local env files for key presence and port class only (`6543`, `5432`, or `UNKNOWN`). No host, username, password, token, query string, or full URL printed.

| File | Key | Present | Port class |
| --- | --- | --- | --- |
| Operator `.env` | `DATABASE_URL` | **YES** | **`6543`** (pooler) |
| Operator `.env` | `DIRECT_URL` | **YES** | **`5432`** (direct) |
| Operator `.env.local` | `DATABASE_URL` | **NO** | `UNKNOWN` |
| Operator `.env.local` | `DIRECT_URL` | **NO** | `UNKNOWN` |
| Repo `.env.example` | `DATABASE_URL` | Documented (template) | Template example `5432` (not operator value) |
| Repo `.env.example` | `DIRECT_URL` | **Not documented** | N/A |

Deployment/staging secret key names referenced in prior Pack15C docs: `DATABASE_URL`, `DIRECT_URL` (Fly deployment names recorded in kernel/handoff — values not inspected in this audit).

---

## 9. Secret safety record

| Check | Result |
| --- | --- |
| URL values printed | **NO** |
| Host printed | **NO** |
| Credentials printed | **NO** |
| Tokens printed | **NO** |
| `.env*` modified | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| DB connection attempted | **NO** |

---

## 10. Recommendation

### Likely cause category

| Category | Applies | Notes |
| --- | --- | --- |
| Pooler transaction mode used for migrate/status | **YES** | Primary config finding — `DATABASE_URL` port `:6543` is what Prisma migrate uses |
| Direct/session URL missing or not wired | **YES** | `DIRECT_URL` present by key name but **not** wired in `schema.prisma`; default migrate commands cannot use it |
| Network/VPN/IP allowlist issue | **Possible** | Prior direct session retry returned `P1001` (PR #122); not re-tested in this audit |
| Unresolved single root cause | **Partial** | Config wiring explains pooler path; network may still block direct even if wired |

### Next retry planning

| Question | Answer |
| --- | --- |
| Does config likely use pooler `:6543` for migrate/status today? | **YES** |
| Does a direct/session path appear available by key name? | **YES** (`DIRECT_URL`, port class `5432`) |
| Is it wired for Prisma migrate by default? | **NO** |
| Would a future retry require changing command plan or env mapping? | **YES** — if avoiding pooler hang without schema change, operator would need session-only `DATABASE_URL` mapping to direct path **or** schema `directUrl` wiring (schema change — out of scope for silent retry) |
| Does next retry require separate authorization? | **YES** — PR #126 explicitly requires separate authorization if connection path or command plan changes |

### Safe next lanes (human/operator — not auto-executed)

1. **Fix pooler connectivity** for staging `euqbfanilcssjiwwtcby` while keeping authorized command plan unchanged.
2. **OR** prepare a separate authorized pack to use direct/session path (env mapping override or schema `directUrl` design) — requires explicit authorization; stop-on-error preserved.
3. **OR** remediate network/VPN/IP allowlist if direct path remains unreachable.

**Do not** claim DB reachability fixed. **Do not** run another Pack15C retry automatically.

---

## 11. Blockers (unchanged)

| Blocker | State |
| --- | --- |
| DB apply performed | **NO** |
| `dbApplied` | `false` |
| Pack15D verification executed | **NO** |
| Pack16 read-only API implemented | **NO** |
| Pack17 live read-only inbox implemented | **NO** |
| Pack15D / Pack16 / Pack17 | **Blocked** until DB apply succeeds |

---

## 12. Final recommendation (this audit pack)

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only connectivity config audit | **YES** — if gate-clean |
| Safe to run DB apply or retry now | **NO** |
| Next safe lane | Human/operator DB connectivity remediation and separate authorization before any changed retry plan |

---

**Evidence:** `docs/design/evidence/cursor-pack15c-db-connectivity-config-audit/README.md`
