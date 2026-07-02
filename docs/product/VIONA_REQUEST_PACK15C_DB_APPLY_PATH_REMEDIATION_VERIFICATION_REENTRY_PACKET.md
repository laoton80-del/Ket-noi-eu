# VIONA Request Engine — Pack15C DB Apply Path Remediation / Verification Re-entry Packet

**Document type:** Remediation and verification re-entry planning packet (docs-only — no DB commands, no diagnostics execution, no deploy, no staging mutation in this pack).
**Packet ID:** `CURSOR_PACK15C_DB_APPLY_PATH_REMEDIATION_VERIFICATION_REENTRY_PACKET_DOCS_ONLY`
**Packet name:** `VIONA_REQUEST_PACK15C_DB_APPLY_PATH_REMEDIATION_VERIFICATION_REENTRY_PACKET`
**Baseline:** `origin/master @ d472722` — `docs(pack28): sync kernel handoff after execution integration implementation (#210)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_DB_REACHABILITY_REMEDIATION_PLAN.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_ONLY_DB_APPLY_RESULT.md`, `docs/product/VIONA_REQUEST_PACK15C_FINAL_STOP_ON_ERROR_CONFIRMATION_INTAKE.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`

---

## 1. Header

| Field | Value |
| --- | --- |
| Packet name | `VIONA_REQUEST_PACK15C_DB_APPLY_PATH_REMEDIATION_VERIFICATION_REENTRY_PACKET` |
| Source master | **`origin/master @ d472722`** |
| Current status | **`remediation_verification_planning_only`** |
| DB apply authorized by this packet | **NO** |
| DB diagnostics authorized by this packet | **NO** |
| DB apply performed | **NO** |
| Pack16 opened | **NO** |
| Pack17 opened | **NO** |
| Pack29 opened | **NO** |
| Operating Protocol read | **YES** (required before any future diagnostic or apply pack) |
| Docs-only planning packet | **YES** |

---

## 2. Current chain baseline

| Milestone | Status |
| --- | --- |
| Pack25 controlled status-action UI chain | **CLOSED / GREEN** through PR #188 |
| Pack25 Option C current visual-QA row | **HOLD** — no further Send to review click or status POST on row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` |
| Pack26 spine | **COMPLETE / GREEN** |
| Pack26B Action Registry | **Read-only / unwired / non-executing** |
| Pack26C audit/timeline contract | **Pure / non-persistent / non-executing** |
| Pack26D operator approval layer | **Pure / non-persistent / non-executing** |
| Pack27 execution lane layer | **CLOSED / GREEN** through PR #203–#206 — pure, non-executing, not wired |
| Pack28 execution integration layer | **CLOSED / GREEN** through PR #207–#210 — pure, non-executing, not wired |
| Pack29 | **NOT opened** |
| Pack15C DB apply path | **Unresolved** — remediation / verification re-entry planning only in this packet |

**This packet does not modify Kernel/Handoff.** It prepares re-entry planning only after Pack28 is fully **CLOSED / GREEN** on master.

---

## 3. Pack15C historical blocker summary

| Item | Recorded state |
| --- | --- |
| Previous DB apply attempts | **Stopped on error** — stop-on-error respected |
| `npx prisma migrate deploy` | **NOT RUN** in failed attempts |
| Pooler `npx prisma migrate status` | **Hung** for **>120s** — process stopped |
| Direct staging retry | **FAILED** — Prisma **P1001** / database unreachable |
| DB apply performed | **NO** |
| Production DB targeted | **NO** |
| Unauthorized direct retry | **NO** |
| Secret values printed | **NO** |
| `.env*` modified in failed attempts | **NO** |
| Restore/rollback attempted without separate authorization | **NO** |
| Target (non-secret label) | `viona-staging-eu` / `euqbfanilcssjiwwtcby` (staging only) |

This packet records historical blockers for re-entry planning. It does **not** claim DB reachability is fixed or that migrations were applied.

---

## 4. Remediation / verification purpose

This packet defines **re-entry planning only** after Pack28 closure. It is **not** execution.

| Principle | Requirement |
| --- | --- |
| Re-entry planning | **YES** — documents operator inputs, gates, and diagnostic outline |
| DB apply execution | **NO** |
| DB diagnostic command execution | **NO** |
| Deploy / Fly restart | **NO** |
| Staging data mutation | **NO** |
| Pack16 implementation | **NO** |
| Pack17 implementation | **NO** |
| Pack29 | **NO** |
| UI/backend wiring | **NO** |
| Request Engine execution enablement | **NO** |

Future diagnostic or apply activity requires **separate authorized packs** with verbatim operator phrases (§6–§7).

---

## 5. Required operator inputs before any diagnostic run

Operator must confirm each item **without printing secret values**. Record only YES/NO or key-name presence in evidence — never connection string contents.

| # | Required input | Confirmation rule |
| --- | --- | --- |
| 1 | Exact staging project name / ref | Confirm `viona-staging-eu` / `euqbfanilcssjiwwtcby` by label only — **no secrets** |
| 2 | Current DB provider / hosting path | Confirm Supabase staging path by name — **no URLs printed** |
| 3 | Pooler vs direct URL intended usage | Confirm which key is for runtime vs migration diagnostics — **no URL values** |
| 4 | Where DB credentials are stored | Key names only (`DATABASE_URL`, `DIRECT_URL`) — **not values** |
| 5 | Backup/snapshot visibility | Confirm dashboard backup visible before any future apply consideration — timestamp by label only if operator provides |
| 6 | Migration status diagnostic retry permission | Explicit operator YES required before any future `migrate status` attempt |
| 7 | Timeout limit | Agree bounded timeout (e.g. **120s**) — stop if exceeded |
| 8 | Stop-on-error rule | Confirm PR #111 `CONFIRMED_FINAL_INTAKE` rule applies to all future commands |
| 9 | No production DB target | Explicit confirmation staging-only |
| 10 | Explicit phrase before diagnostic commands | `APPROVE_PACK15C_DB_CONNECTIVITY_DIAGNOSTIC_STAGING_ONLY` required (§6) |

**Hard rule:** If any item cannot be confirmed without exposing secrets, **STOP** and resolve offline before any diagnostic pack.

---

## 6. Proposed future diagnostic run gate

| Field | Value |
| --- | --- |
| Future diagnostic phrase | `APPROVE_PACK15C_DB_CONNECTIVITY_DIAGNOSTIC_STAGING_ONLY` |
| Authorized by diagnostic phrase only | Bounded read-only connectivity diagnostic; bounded `npx prisma migrate status` on staging |
| **NOT** authorized by diagnostic phrase | `npx prisma migrate deploy`; Supabase SQL; seed/reset/rollback; staging data mutation; production access |
| Separate apply phrase required for apply | **YES** — see §7 |

This phrase authorizes **diagnostics only**, not migration apply.

---

## 7. Proposed future DB apply gate

| Field | Value |
| --- | --- |
| Future DB apply phrase | `APPROVE_PACK15C_DB_APPLY_STAGING_ONLY` |
| Must remain separate from diagnostic phrase | **YES** |
| Authorized by apply phrase only | `npx prisma migrate deploy` on staging after successful bounded pre-checks |
| Apply without apply phrase | **FORBIDDEN** |
| Apply without stop-on-error rule | **FORBIDDEN** |
| Apply without backup visibility confirmation | **FORBIDDEN** |

Diagnostic success does **not** imply apply authorization. Apply requires its own verbatim operator phrase in a separate execution-only pack.

---

## 8. Diagnostic plan outline (document only — do not run)

The following steps are **planned only**. No step in this packet may be executed.

| Step | Action | Gate |
| --- | --- | --- |
| 1 | Verify branch/master baseline matches authorized pack | Diagnostic phrase required |
| 2 | Verify target is staging only by project name/ref — no secrets | Operator confirmation |
| 3 | Check required env var **names** exist — do not print values | Key-name presence only |
| 4 | Run bounded read-only connection diagnostic | Diagnostic phrase + timeout |
| 5 | Run bounded `npx prisma migrate status` | Diagnostic phrase + timeout |
| 6 | If command hangs beyond configured timeout | **STOP** — record in evidence |
| 7 | If P1001 or unreachable | **STOP** — record in evidence |
| 8 | Do **not** run `npx prisma migrate deploy` | Unless apply phrase in separate pack |
| 9 | Do **not** retry direct URL without explicit operator instruction | Stop-on-error |
| 10 | Record non-secret result in evidence docs only | No secret values |

---

## 9. Stop-on-error rules

| Condition | Action |
| --- | --- |
| Pooler `migrate status` hangs **> configured timeout** (e.g. 120s) | **STOP** immediately |
| Prisma **P1001** / database unreachable | **STOP** immediately |
| Target ambiguity (staging vs production vs legacy paused project) | **STOP** immediately |
| Secret would need to be printed to proceed | **STOP** immediately |
| Production risk detected | **STOP** immediately |
| Migration drift or destructive warning appears | **STOP** immediately |
| Any command requires unapproved DB apply | **STOP** immediately |
| Operator stop-on-error intake (PR #111) violated | **STOP** immediately |

On stop: capture **non-secret** output only; do not continue with extra commands; wait for human review.

---

## 10. Explicit non-authorization

This packet does **NOT** authorize:

| Forbidden action | Status |
| --- | --- |
| DB diagnostic commands | **NOT authorized** |
| DB apply | **NOT authorized** |
| `npx prisma migrate deploy` | **NOT authorized** |
| `npx prisma migrate status` | **NOT authorized** |
| Supabase SQL | **NOT authorized** |
| Direct DB retry without separate pack | **NOT authorized** |
| Production DB access | **NOT authorized** |
| DB schema/migration edits | **NOT authorized** |
| Seed / reset / rollback | **NOT authorized** |
| Staging data mutation | **NOT authorized** |
| Deploy / Fly restart | **NOT authorized** |
| Live QA | **NOT authorized** |
| Status POST | **NOT authorized** |
| Pack16 | **NOT opened** |
| Pack17 | **NOT opened** |
| Pack29 | **NOT opened** |
| UI/backend wiring | **NOT authorized** |
| Request Engine execution enablement | **NOT authorized** |
| Secrets / env value printing | **FORBIDDEN** |
| Kernel/Handoff modification | **NOT in scope** (separate sync pack if needed after merge) |

---

## 11. Pack25–Pack28 preservation

| Pack | Preservation rule |
| --- | --- |
| Pack25 | Option C **HOLD** on row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` — no further click/status POST |
| Pack26B | Registry remains read-only, unwired, non-executing |
| Pack26C | Contract remains pure, non-persistent, non-executing |
| Pack26D | Operator approval remains pure, non-persistent, non-executing |
| Pack27 | Execution lane remains pure, non-executing, not wired |
| Pack28 | Execution integration remains pure, non-executing, not wired |

This packet does not wire, execute, or mutate any Pack25–Pack28 runtime layer.

---

## 12. Next lanes (after this packet merges)

| Lane | Status |
| --- | --- |
| Pack15C diagnostic pack | **Blocked** until operator provides `APPROVE_PACK15C_DB_CONNECTIVITY_DIAGNOSTIC_STAGING_ONLY` |
| Pack15C DB apply pack | **Blocked** until diagnostic path verified and operator provides `APPROVE_PACK15C_DB_APPLY_STAGING_ONLY` |
| Pack15D post-apply verification | **Blocked** until successful DB apply in authorized pack |
| Pack16 read-only API | **NOT opened** |
| Pack17 live read-only inbox | **NOT opened** |
| Pack29 | **NOT opened** |

Evidence: `docs/design/evidence/cursor-pack15c-db-apply-path-remediation-verification-reentry/README.md`
