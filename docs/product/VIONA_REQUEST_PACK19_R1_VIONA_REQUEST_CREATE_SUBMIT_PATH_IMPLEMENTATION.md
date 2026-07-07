# VIONA Request — Pack19 R1 create/submit path implementation

**Document type:** Product implementation record.
**Status:** `pack19_r1_viona_request_create_submit_path_implemented`
**Result classification:** `R1_CREATE_SUBMIT_PATH_IMPLEMENTED`

> Read `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` first. This pack implements the operator-approved bounded create-submit path only. No production claims, no Pack29, no execution wiring, no deploy/restart, no staging QA, no secrets printed.

---

## 1. Baseline

| Field | Value |
|-------|--------|
| **Source master** | `origin/master @ 2ee33f6` |
| **Full hash** | `2ee33f6b46bdde0b91808e950909dfc94583b7c6` |
| **Branch** | `feature/pack19-r1-viona-request-create-submit-path` |
| **Implementation phrase recorded on master** | `APPROVE_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION` |
| **Target (future staging test)** | `viona-api-staging-eu.fly.dev` (staging only) |

---

## 2. Endpoint implemented

| Field | Value |
|-------|--------|
| Method + path | **`POST /api/viona/requests`** |
| Auth | **Required** (`authMiddleware` bearer JWT — same posture as existing VIONA routes) |
| Domain/model | **`VionaRequest` only** — does not write `LocalServiceRequest` |
| Initial status | **`submitted`** (fixed; no status transition on create) |
| Readiness | **Not production-ready**; staging-testable only |

### Request body (required fields)

| Field | Required | Notes |
|-------|----------|-------|
| `tenantId` | YES | Non-empty string (max 100) |
| `sourceUniverse` | YES | Must be in `vionaRequestUniverses` allowlist |
| `requestType` | YES | Must be in safe allowlist: `generic`, `pack19-precondition-test` |
| `title` | YES | Non-empty string (max 200) |
| `safetyLabels` | YES | Must include **all six** Pack19 labels (see §3) |
| `summary` | NO | Optional (max 4000) |
| `locale` | NO | Optional (max 20) |
| `countryCode` | NO | Optional (max 8) |
| `sourceFeature` | NO | Optional (max 100) |
| `idempotencyKey` | NO | Optional (max 128) |
| `clientCorrelationId` | NO | Optional (max 128) |

### Rejections

- Unauthenticated requests → **401**
- Bulk/batch creation keys (`items`, `rows`, `batch`, `bulk`, `count`, `requests`) → **400**
- Side-effect keys (`status`, `payment`, `booking`, `sos`, `execution`, `ai`, `note`, `merchant`, etc.) → **400**
- Missing any required Pack19 safety label → **400**
- Forbidden production/hold labels (`production`, `prod`, `live`, `real`, `customer-critical`, `hold`, `pack25-hold`, etc.) → **400**
- Unsafe universe or request type → **400**
- Unsafe content (URLs, secrets patterns) in text fields → **400**

---

## 3. Required Pack19 safety labels (all six required)

| Label |
|-------|
| `pack19-safe-submitted-row-precondition` |
| `staging-only` |
| `non-production` |
| `non-hold` |
| `non-customer-critical` |
| `test-remediation` |

Labels are stored in `metadataJson.safetyLabels` and recorded in the `action.create` audit event payload.

---

## 4. Scope and boundaries honored

| Boundary | Honored |
|----------|---------|
| VionaRequest domain/model only | **YES** — `vionaRequest.create` + `vionaRequestAuditEvent.create` only |
| No LocalServiceRequest reuse | **YES** |
| Pack25 hold row not used/modified | **YES** — hard exclusion |
| Initial status `submitted` only | **YES** — no status transition logic called |
| No note/execution/payment/booking/SOS/AI/merchant/notification/external side effect | **YES** |
| No status POST on create | **YES** |
| No Pack29 opened | **YES** |
| No execution wiring | **YES** |
| No production-readiness claim | **YES** — `notProductionReady: true` in metadata + safety contract |
| No deploy/restart | **YES** |
| No `.env*` modified | **YES** |
| No DB migration/apply commands run | **YES** |
| No staging QA performed | **YES** — local/static checks only |
| No secrets printed | **YES** |
| Existing GET list/detail, note action, status action preserved | **YES** |

---

## 5. Implementation files

| File | Role |
|------|------|
| `src/routes/vionaRoutes.ts` | Wires `POST /requests` |
| `src/controllers/VionaRequestController.ts` | `postCreateVionaRequest` handler |
| `src/services/viona/vionaRequestCreateDto.ts` | Safety contract, allowlists, types |
| `src/services/viona/vionaRequestCreateService.ts` | Create logic + raw-body screening |
| `scripts/viona-pack19-r1-create-submit-path-check.mjs` | Static verification script |

---

## 6. Checks run (local/static only)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | (run at commit time) |
| `node scripts/viona-pack19-r1-create-submit-path-check.mjs` | (run at commit time) |
| `node scripts/viona-forbidden-claims-check.mjs` | (run at commit time) |
| Grep: `POST /api/viona/requests` route exists | **YES** |
| Grep: no `LocalServiceRequest` in create path | **YES** |
| Grep: no Pack29/execution wiring added | **YES** |

---

## 7. Result classification

**`R1_CREATE_SUBMIT_PATH_IMPLEMENTED`**

Assertions: endpoint `POST /api/viona/requests` implemented per approved R1 design; creates one `VionaRequest` row with status `submitted`; no LocalServiceRequest; no Pack29; no execution wiring; no deploy/restart; no staging QA; no secrets printed.

---

## 8. Recommended next step

After merge and deploy to staging (operator-controlled), re-run the Pack19 execution-only safe submitted-row precondition remediation pack to create/identify one safe `submitted` row via this endpoint, then re-run Pack19 bounded `submitted → triage` QA under `APPROVE_PACK19_SCOPED_SUBMITTED_ROW_STATUS_TRIAGE_QA`. Pack29 and execution remain blocked throughout.
