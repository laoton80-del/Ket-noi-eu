# VIONA Request Engine — Pack15C Direct URL Wiring Implementation

**Document type:** Static-only direct/session path wiring implementation record (no DB commands).
**Baseline:** `origin/master @ bbf1c8f` — `docs(requests): add Pack15C direct/session path design (#128)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_DIRECT_SESSION_PATH_DESIGN.md`, `docs/product/VIONA_REQUEST_PACK15C_DB_CONNECTIVITY_CONFIG_AUDIT.md`, `prisma/schema.prisma`, `.env.example`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `bbf1c8f` |
| Message | `docs(requests): add Pack15C direct/session path design (#128)` |
| Pack15C direct/session path design | Complete and green on master (PR #128 @ `bbf1c8f`) |
| Pack15C DB connectivity config audit | Complete and green on master (PR #127 @ `9741c4c`) |
| Target | `viona-staging-eu` / `euqbfanilcssjiwwtcby` (staging only) |
| DB apply performed | **NO** |

---

## 2. Implementation summary

| Item | Value |
| --- | --- |
| Implementation performed | **YES** — static wiring only |
| Schema changed | **YES** — added `directUrl = env("DIRECT_URL")` only |
| `.env.example` changed | **YES** — added generic `DIRECT_URL` placeholder only |
| Prisma models changed | **NO** |
| Migrations changed/created | **NO** |
| `.env` / `.env.local` modified | **NO** |
| DB commands run | **NO** |
| DB connection attempted | **NO** |
| Secret values printed | **NO** |
| Real URL values printed | **NO** |
| DB reachability claimed fixed | **NO** |
| DB apply performed | **NO** |
| Retry authorized | **NO** |
| Pack15D verification executed | **NO** |
| Pack16 / Pack17 touched | **NO** |

---

## 3. Exact schema change

**File:** `prisma/schema.prisma`

Added to existing `datasource db` block:

```prisma
directUrl = env("DIRECT_URL")
```

Preserved:

```prisma
url = env("DATABASE_URL")
```

No model, enum, or migration file changes.

**Intent:** Prisma migrate status/deploy should use migration-safe direct/session path via `DIRECT_URL` when present in operator environment, while runtime continues to use `DATABASE_URL` (pooler).

---

## 4. Exact `.env.example` change

Added generic placeholder (fake template only — no real host, username, password, token, or project ref):

```dotenv
# --- Direct/session PostgreSQL URL for Prisma migrate status/deploy (not pooler) ---
# Use direct port (5432) for migration-safe CLI operations. Never commit real secrets.
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

Existing `DATABASE_URL` placeholder unchanged.

---

## 5. Status flags

| Flag | Value |
| --- | --- |
| `pack15DirectSessionPathDesignPrepared` | `true` |
| `pack15DirectSessionPathImplemented` | `true` |
| `pack15DirectUrlWiredInSchema` | `true` |
| `pack15DirectUrlPlaceholderDocumented` | `true` |
| `pack15DbApplyRetryAuthorized` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15DVerificationExecuted` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

---

## 6. Still blocked

- DB apply retry execution
- Pack15D verification execution
- Pack16 runtime/API implementation
- Pack17 runtime/UI/inbox implementation
- Restore/rollback unless separately authorized by Nong Si Buong

---

## 7. Next lane

After this implementation merges and is verified:

1. **Separately authorized** DB apply retry pack (with stop-on-error).
2. Retry must confirm `DIRECT_URL` key present by key name only and port class `5432` only.
3. Pack15D verification only after successful DB apply in a separate pack.

**Do not** run DB commands in this implementation pack.

---

## 8. Final recommendation (implementation pack)

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** if only allowed files changed and checks pass | **YES** — if gate-clean |
| Safe to retry DB apply now | **NO** |

---

**Evidence:** `docs/design/evidence/cursor-pack15c-direct-url-wiring-implementation/README.md`
