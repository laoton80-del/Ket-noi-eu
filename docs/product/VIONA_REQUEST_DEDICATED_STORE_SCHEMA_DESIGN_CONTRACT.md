# VIONA Request Engine — Dedicated Store Schema Design Contract

**Document type:** Schema-design contract (DB-agnostic, implementation-neutral).
**Baseline:** `origin/master @ fc1d1de` — Pack10C human SoT approval merged (PR #67).
**Related:** `docs/product/VIONA_REQUEST_SOT_HUMAN_APPROVAL_RECORD.md`, `src/domain/requests/vionaRequestDedicatedStoreSchemaDesignContract.ts`

---

## Purpose

Pack11 defines the **Dedicated VIONA Request Store Schema Design Contract** only.

Human approval was recorded in Pack10C (Nong Si Buong, 2026-06-15). The approved long-term source-of-truth direction is **Dedicated VIONA Request Store** (`dedicatedVionaRequestStore`).

This contract describes logical entities, field groups, lifecycle states, audit design, and future phase gates for a cross-universe VIONA Request Engine store. It is **not** Prisma schema, **not** a migration, and **not** a live persistence layer.

---

## Pack11 boundaries

Pack11 is **schema-design contract only**.

This pack does **not**:

- create Prisma schema — this pack does not create Prisma schema
- create migration — this pack does not create migration
- create API — this pack does not create API
- create persistence adapter — this pack does not create persistence adapter
- create request mutation — this pack does not create request mutation
- change Admin Debug data source — this pack does not change Admin Debug data source
- add OPERATOR to Prisma/Auth — this pack does not add OPERATOR to Prisma/Auth
- extend `VionaRequestRecord` — this pack does not extend VionaRequestRecord
- authorize payment, booking, SOS dispatch, wallet mutation, live AI protected action, or live merchant execution

Admin Debug remains **fixture-only**. Audit log is **not** a payment ledger.

---

## Safety acknowledgements (unchanged)

- Direct **LocalServiceRequest** reuse remains **disallowed**.
- Hybrid bridge remains future-only and requires an explicit mapping/link contract.
- Local wallet, ledger, settlement, and status fields must **not** define VIONA request completion or payment truth.
- Client-only role checks remain **insufficient** for future persistence APIs.

---

## 1. Purpose (design)

Provide a single cross-universe request store design that supports operator triage, human confirmation, tenant isolation, and append-only audit — without coupling to Local wallet or payment rails.

---

## 2. Non-goals

- No payment capture or settlement truth in request store fields
- No booking confirmation or SOS dispatch lifecycle names
- No live AI execution fields
- No merchant execution or payout fields
- No Prisma or SQL in this pack

---

## 3. Proposed logical entities (candidates only)

Logical contract candidates — **not** Prisma models, migrations, or database tables:

| Entity | Role |
| --- | --- |
| `VionaRequest` | Core request aggregate root |
| `VionaRequestParticipant` | Requester, operator, merchant, partner roles |
| `VionaRequestSourceLink` | External source bridge metadata (future hybrid) |
| `VionaRequestStatusEvent` | Lifecycle transition record |
| `VionaRequestAuditEvent` | Append-only audit trail entry |
| `VionaRequestAttachmentReference` | Opaque attachment pointer — not blob storage |

---

## 4. Field groups

See `VIONA_REQUEST_DEDICATED_STORE_FIELD_GROUPS` in the domain contract for core identity, ownership, human-readable content, lifecycle, safety, source link, audit, and attachment reference groups.

Excluded: Local wallet balance, ledger settlement, payment truth, fake booking/payment/SOS confirmation fields.

---

## 5. Tenant and ownership boundaries

- `requesterUserId` scopes B2C/requester reads
- `merchantId` scopes merchant-owned requests
- `tenantId` + `universe` enforce cross-universe isolation
- `assignedOperatorId` is explicit assignment — no global partner list leakage
- Global ops reads require `universeFilter` and server-side auth (future gate)

---

## 6. Request lifecycle states

Design lifecycle states are non-production-claiming (e.g. `draftIntake`, `triaged`, `waitingForHumanConfirmation`). They do not imply payment captured, booking confirmed, or SOS dispatched.

---

## 7. Source link / bridge policy

Hybrid bridge is future-only. `sourceSystem`, `sourceRecordId`, and `bridgePolicy` are reference metadata — not Local SoT. Direct LocalServiceRequest reuse is disallowed.

---

## 8. Audit event design

Append-only `VionaRequestAuditEvent` records actor, action type, correlation id, and metadata reference. Audit log is not a payment ledger and is not a payment ledger.

---

## 9. Access-control assumptions

Future persistence APIs require server JWT + role policy. OPERATOR is not a Prisma/Auth role yet. Interim operator access remains ADMIN-equivalent server gate + auditRead.

---

## 10. Future phase gates

| Gate | Status in Pack11 |
| --- | --- |
| Schema design contract | Active — review required |
| Schema design approved | **Not** approved |
| Prisma schema | Blocked |
| Prisma migration | Blocked |
| Read-only API | Blocked |
| Persistence adapter | Blocked |
| Request mutation | Blocked |
| Admin Debug live data | Blocked |
