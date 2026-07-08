# Evidence — Pack19 Safe Submitted-Row Precondition Remediation (After Redeploy)

**Packet ID:** `CURSOR_PACK19_SAFE_SUBMITTED_ROW_PRECONDITION_REMEDIATION_AFTER_REDEPLOY`
**Product doc:** `docs/product/VIONA_REQUEST_PACK19_SAFE_SUBMITTED_ROW_PRECONDITION_REMEDIATION_AFTER_REDEPLOY.md`
**Source master:** `origin/master @ 649a9455defc7ca82db01f45f22273c5cb703845` (`649a945`).
**Authorization phrase (recorded on master):** `APPROVE_PACK19_SAFE_SUBMITTED_ROW_PRECONDITION_REMEDIATION`.

---

## Result classification

**`PRECONDITION_REMEDIATED_SAFE_SUBMITTED_ROW_CREATED`**

One safe staging-only `submitted` row was created via `POST /api/viona/requests` after read-only discovery found zero safe candidates. Post-verify GET confirmed exactly one safe candidate with status `submitted`.

---

## Execution summary

| Field | Value |
| --- | --- |
| Target | `viona-api-staging-eu` (`viona-api-staging-eu.fly.dev`) — staging only |
| Endpoint used | `POST /api/viona/requests` |
| Discovery | Authenticated `GET /api/viona/requests` — 3 rows, 0 safe `submitted` |
| Pack25 hold excluded | **YES** — `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` not used/modified |
| Create | `POST /api/viona/requests` → **201** (exactly once) |
| Candidate action | **created** (not found pre-existing) |
| Candidate reference | `5e759ca9…` (safe redacted) |
| Post-verify | GET only — exactly **1** safe candidate, status **`submitted`** |
| Status POST | **NO** |
| Pack19 QA rerun | **NO** |
| Deploy/restart | **NO** |
| DB/Prisma/Supabase/SQL | **NO** |
| Production | **NO** |
| Pack29 | **NO** |
| Execution wiring | **NO** |
| Secrets printed | **NO** |

---

## Required safety labels (all six on create payload)

`pack19-safe-submitted-row-precondition`, `staging-only`, `non-production`, `non-hold`, `non-customer-critical`, `test-remediation`.

---

## Safety attestations

| Check | Result |
| --- | --- |
| Staging only | YES |
| Approved API path only | YES |
| Exactly one mutation (create) | YES |
| Pack25 hold not touched | YES |
| No status POST | YES |
| No Pack19 QA in this pack | YES |
| No deploy/restart | YES |
| No DB migration/apply | YES |
| No `.env*` change | YES |
| No secrets printed | YES |
| Changed files limited to docs/evidence | YES |

---

## Next gate

Separate Pack19 bounded `submitted → triage` staging QA authorization on the safe candidate row.
