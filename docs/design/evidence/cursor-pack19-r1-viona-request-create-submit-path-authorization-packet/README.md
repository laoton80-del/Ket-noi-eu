# Pack19 evidence — R1 VIONA request create/submit path authorization/design packet

## Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ 77ca077` |
| **Full hash** | `77ca0774a1377b361a0b375c176eac54c7ec6e28` |
| **Branch** | `docs/pack19-r1-viona-request-create-submit-path-authorization-packet` |
| **Pack** | Pack19 R1 — VIONA request create/submit path authorization/design (docs-only) |

## Purpose

Docs-only authorization/design packet selecting **Option R1** (add an approved VIONA request-create/submit path) to unblock Pack19's safe `submitted`-row precondition. **Records design/approval intent only — authorizes no implementation.**

> **Approval update (source master `443706adea6b38e8e6b09d31774b5dbd9aee9e1a` / `443706a`):** operator has **now provided** the future implementation phrase `APPROVE_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION`. This update records **approval only** — no endpoint implemented; no row created/seeded; no staging/auth/data mutation; no status POST; no DB/Prisma/Supabase/SQL; no deploy/restart; Pack29 remains blocked; execution remains blocked.

## Context

| Item | Value |
|------|--------|
| Prior remediation result | **`BLOCKED_REMEDIATION_ERROR`** |
| Reason | **No approved VIONA request-create/submit path exists** |
| Selected option | **R1) Add approved VIONA request-create/submit path** |
| This packet authorizes | **Design/approval recording only, not implementation** |
| `LocalServiceRequest` reuse | **FORBIDDEN** — `POST /api/local/requests` is a different domain and must not satisfy VIONA preconditions |
| VIONA read source-of-truth | `GET /api/viona/requests` → `VionaRequest` model only |

## Proposed future API design (not implemented)

| Field | Value |
|-------|--------|
| Endpoint | **`POST /api/viona/requests`** |
| Auth | **Required** (rejects unauthenticated creation) |
| Purpose | Create **exactly one** VIONA Request Engine row via approved application/API path |
| Initial allowed status | **`submitted`** |
| Domain/model | **`VionaRequest` only** — must not write `LocalServiceRequest` |
| Pack25 hold row | **must not be used** — `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` |
| Metadata | auth, owner/user scope, audit metadata, safety/readiness metadata |
| Validation | request type/category against existing safe allowlist |
| Rejections | production test labels; broad/bulk creation; unauthenticated creation |
| Side effects | none — no execution, booking, payment, SOS, merchant action, AI call, external effect |
| Production readiness | **not claimed**; staging-testable before broader rollout |

### Required safety labels for Pack19 test rows

`pack19-safe-submitted-row-precondition`, `staging-only`, `non-production`, `non-hold`, `non-customer-critical`, `test-remediation`.

## Future implementation phrase

| Field | Value |
|-------|--------|
| Phrase required | **YES** |
| Phrase (verbatim) | `APPROVE_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION` |
| Phrase provided | **YES** — recorded verbatim (approval update, source master `443706a`) |

## Result classification

**`R1_CREATE_SUBMIT_PATH_IMPLEMENTATION_APPROVAL_RECORDED_ONLY`**

## Guardrails (this pack)

| Check | Result |
| --- | --- |
| Docs-only | **YES** |
| Exactly the two allowed files changed | **YES** |
| Source master recorded | **YES** — `77ca077` |
| Endpoint implemented | **NO** |
| Row create/seed | **NO** |
| Staging/auth/data mutation | **NO** |
| Status POST | **NO** |
| DB/Prisma/Supabase/SQL run | **NO** |
| Deploy/restart | **NO** |
| Pack29 opened | **NO** |
| Execution wired | **NO** |
| `.env*` changed | **NO** |
| Production touched | **NO** |
| Pack25 hold row used/modified | **NO** — hard exclusion |
| `LocalServiceRequest` used as VIONA SoT | **NO** — forbidden |
| Future implementation phrase required | **YES** |
| Future implementation phrase provided | **YES** — approval only, no implementation |
| Conflict markers present | **NO** |
| Secrets/tokens/PINs/DB URLs printed | **NO** |

## Files changed (this pack)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_AUTHORIZATION_PACKET.md` |
| Created | `docs/design/evidence/cursor-pack19-r1-viona-request-create-submit-path-authorization-packet/README.md` |

## Forbidden paths (verified untouched)

`prisma/**`, `src/**`, `app/**`, `App.tsx`, `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `.env*` — **none changed**.

## Recommendation

**Safe to push branch / open PR** — docs-only approval record. Records the operator implementation phrase only; no endpoint, no rows, no Pack29, no execution wiring, no deploy. Next step: a **separate R1 implementation pack** builds `POST /api/viona/requests` per the design and reviews, staging-testable only, under the now-provided phrase `APPROVE_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION`.
