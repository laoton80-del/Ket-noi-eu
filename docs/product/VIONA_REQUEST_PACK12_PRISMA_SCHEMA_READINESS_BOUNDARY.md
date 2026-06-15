# VIONA Request Engine — Pack12 Prisma Schema Readiness / Implementation Boundary

**Document type:** Planning and readiness boundary (no Prisma schema, migration, API, or runtime).
**Baseline:** `origin/master @ 442639c` — Pack11B schema-design human approval merged (PR #69).
**Related:** `docs/product/VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT.md`, `docs/product/VIONA_REQUEST_SCHEMA_DESIGN_HUMAN_APPROVAL_RECORD.md`

---

## 1. Purpose

Pack12 defines the **Prisma schema readiness / implementation boundary** for the Dedicated VIONA Request Store after Pack11B human schema-design approval.

Pack12 is **planning/readiness boundary only**. It prepares future logical-to-Prisma mapping principles, model boundary names, forbidden field families, and implementation pack gates.

Dedicated VIONA Request Store (`dedicatedVionaRequestStore`) remains the approved long-term source-of-truth direction. Schema-design human approval was recorded in Pack11B (Nong Si Buong, 2026-06-15).

---

## 2. Non-goals

Pack12 does **not**:

- create Prisma schema — this pack does not create Prisma schema
- create migration — this pack does not create migration
- create API — this pack does not create API
- create persistence adapter — this pack does not create persistence adapter
- create request mutation — this pack does not create request mutation
- change Admin Debug data source — this pack does not change Admin Debug data source
- add OPERATOR to Prisma/Auth — this pack does not add OPERATOR to Prisma/Auth
- extend VionaRequestRecord runtime type — this pack does not extend VionaRequestRecord runtime type
- authorize payment, booking, SOS dispatch, wallet mutation, live AI protected actions, or No live merchant execution

---

## 3. Preconditions for future Prisma implementation pack

Before any future Prisma implementation pack may start:

| Prerequisite | Status |
| --- | --- |
| Human SoT approval recorded (Pack10C) | Met |
| Dedicated VIONA Request Store selected | Met |
| Pack11 schema-design contract created | Met |
| Schema design human approval recorded (Pack11B) | Met |
| `schemaDesignApproved: true` | Met |
| Pack12 planning/readiness boundary active | This pack |
| Human approval for Prisma schema implementation | **Not met** |
| Human approval for migration | **Not met** |
| Human approval for API/adapter/mutation | **Not met** |

`pack12PlanningStarted: true` means planning is active. `pack12Started: false` means implementation has not started.

---

## 4. Future logical-to-Prisma mapping principles

- Logical entities from Pack11 map to **candidate** Prisma model names only — not live models in this pack.
- Each model requires explicit human approval before `prismaModelActive` may become true.
- Local wallet, ledger, settlement, and status fields must not define VIONA request completion or payment truth.
- Hybrid bridge remains future-only and requires an explicit mapping/link contract.
- Direct LocalServiceRequest reuse remains disallowed.
- client-only role checks remain insufficient for future persistence APIs.

---

## 5. Proposed model boundary names (candidates only)

Logical contract candidates — **not** Prisma models, migrations, or database tables:

| Candidate | Role |
| --- | --- |
| `VionaRequest` | Core request aggregate |
| `VionaRequestParticipant` | Requester, operator, merchant, partner participation |
| `VionaRequestSourceLink` | External source reference metadata |
| `VionaRequestStatusEvent` | Append-only lifecycle transition events |
| `VionaRequestAuditEvent` | Append-only audit events |
| `VionaRequestAttachmentReference` | Opaque attachment pointers |

---

## 6. Forbidden field families

The following field families must **not** appear in future Prisma schema as VIONA truth:

- wallet balance truth
- ledger settlement truth
- payment confirmation truth
- booking confirmation truth
- SOS dispatch truth
- live AI execution truth
- merchant payout truth
- LocalServiceRequest direct reuse truth

---

## 7. Tenant and ownership boundaries

- `tenantId` and ownership fields are required for cross-universe isolation planning.
- Merchant/partner assignment must remain explicit — no implicit Local merchant inbox reuse.
- Universe filters apply to global ops reads in future APIs.

---

## 8. Lifecycle state constraints

- No lifecycle state may imply captured payment.
- No lifecycle state may imply confirmed booking.
- No lifecycle state may imply SOS dispatch.
- No lifecycle state may imply wallet settlement.
- Closure must be human-owned or explicitly future-gated.

Pack11 lifecycle states (`draftIntake`, `triaged`, `waitingForHumanConfirmation`, etc.) remain the design baseline.

---

## 9. Audit event constraints

- `VionaRequestAuditEvent` is append-only.
- Audit log is not a payment ledger.
- Audit events record actor, action type, correlation id, and metadata reference only.

---

## 10. Source-link bridge constraints

- `sourceSystem`, `sourceRecordId`, and `bridgePolicy` are reference metadata — not Local SoT.
- Direct LocalServiceRequest reuse is disallowed.
- Hybrid bridge is future-only.

---

## 11. Future implementation pack checklist

Before a future Prisma implementation pack:

- [ ] Pack12 readiness boundary reviewed and approved by human
- [ ] `pack12ImplementationApproved: true` recorded with human sign-off
- [ ] Prisma schema draft reviewed against forbidden field families
- [ ] Migration plan reviewed separately from schema
- [ ] API/adapter/mutation remain blocked until explicit future packs
- [ ] Admin Debug remains fixture-only until explicit phase promotion
- [ ] OPERATOR Prisma/Auth role not added without explicit pack

---

## 12. Future rollback/safety gates

- `agentMayFlipSignoff` remains `false`.
- `prismaSchemaPermitted` remains `false` until human approval.
- `prismaMigrationPermitted` remains `false` until human approval.
- `requestMutationPermitted` remains `false` until human approval.
- `adminDebugUsesFixturesOnly: true` until explicit phase promotion.
- Rollback of a future Prisma pack requires human ops sign-off and runbook owner acknowledgment.

---

## Safety acknowledgements (unchanged)

- Admin Debug remains fixture-only.
- OPERATOR is not a Prisma/Auth role yet.
- No payment captured. Not booking confirmed. No SOS dispatch. No wallet mutation. No live merchant execution.
