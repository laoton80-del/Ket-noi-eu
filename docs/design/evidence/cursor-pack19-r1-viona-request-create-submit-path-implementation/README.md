# Pack19 evidence — R1 VIONA request create/submit path implementation

## Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ 2ee33f6` |
| **Full hash** | `2ee33f6b46bdde0b91808e950909dfc94583b7c6` |
| **Branch** | `feature/pack19-r1-viona-request-create-submit-path` |
| **Implementation phrase recorded on master** | `APPROVE_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION` |

## Purpose

Implement the operator-approved bounded create-submit path: **`POST /api/viona/requests`** — creates exactly one `VionaRequest` row with initial status `submitted`. Staging-testable only; not production-ready.

## Endpoint

| Field | Value |
|-------|--------|
| Path | **`POST /api/viona/requests`** |
| Auth | Required |
| Domain | `VionaRequest` only |
| Initial status | `submitted` |
| LocalServiceRequest | **NOT used** |

## Result classification

**`R1_CREATE_SUBMIT_PATH_IMPLEMENTED`**

## Guardrails

| Check | Result |
| --- | --- |
| Endpoint implemented | **YES** — `POST /api/viona/requests` |
| VionaRequest domain only | **YES** |
| LocalServiceRequest reuse | **NO** |
| Initial status `submitted` | **YES** |
| Status transition on create | **NO** |
| Required Pack19 safety labels enforced | **YES** (all six) |
| Bulk creation rejected | **YES** |
| Side-effect keys rejected | **YES** |
| Pack29 opened | **NO** |
| Execution wired | **NO** |
| Deploy/restart performed | **NO** |
| Staging QA performed | **NO** (local/static checks only) |
| DB migration/apply run | **NO** |
| `.env*` changed | **NO** |
| Secrets printed | **NO** |
| Existing GET/note/status preserved | **YES** |

## Files changed

| Action | Path |
| --- | --- |
| Modified | `src/routes/vionaRoutes.ts` |
| Modified | `src/controllers/VionaRequestController.ts` |
| Created | `src/services/viona/vionaRequestCreateDto.ts` |
| Created | `src/services/viona/vionaRequestCreateService.ts` |
| Created | `scripts/viona-pack19-r1-create-submit-path-check.mjs` |
| Created | `docs/product/VIONA_REQUEST_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION.md` |
| Created | `docs/design/evidence/cursor-pack19-r1-viona-request-create-submit-path-implementation/README.md` |

## Forbidden paths (verified untouched)

`prisma/**`, `.env*`, `docs/ai-context/VIONA_KERNEL_HANDOFF*`, Pack29/execution wiring paths — **none changed**.

## Checks run

- `npx tsc --noEmit`
- `node scripts/viona-pack19-r1-create-submit-path-check.mjs`
- `node scripts/viona-forbidden-claims-check.mjs`
- Grep: POST route exists; no LocalServiceRequest; no Pack29/execution wiring

## Recommendation

**Safe to push branch** — bounded R1 implementation per approved design. No Pack29, no execution wiring, no deploy. Next: operator deploys to staging, then re-runs Pack19 precondition remediation via this endpoint.
