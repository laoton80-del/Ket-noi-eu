# VIONA Request Persistence and Audit Readiness

## Why Pack7 exists

Pack6 merged the first Admin Debug read-only operator inbox preview route (PR #61). Operators can inspect fixture-based request queues behind admin debug gates and an ADMIN role guard, but there is still no persistence, API, audit log, or mutation path for the cross-universe VIONA Request Engine.

Pack7 defines the **readiness contract** for future persistence and audit logging without activating backend behavior.

## Current baseline after PR #61

- Master baseline: `8f47574` — `feat(requests): add Admin Debug operator inbox preview route (#61)`
- Admin Debug route: `VionaAdminDebugOperatorInboxPreview` — fixture-only, read-only
- Request Engine domain: types, status machine, fixtures, selectors, safety copy (Pack2)
- ReferenceLab and Admin Debug previews: no API, no DB, no mutation

## Current state

| Capability | Status |
| --- | --- |
| Admin Debug operator preview | Active behind flags; **fixture-only** |
| Persistence/API | **Inactive** |
| DB/schema/migration | **Inactive** |
| Audit log | **Not implemented** |
| Request mutation | **Blocked** |
| Production live ops | **Blocked** |

**Fixture-only Admin Debug preview remains unchanged in Pack7.** No data-source wiring.

## Local Prisma/audit patterns are reference-only

The repository already contains live Local vertical persistence:

- `LocalServiceRequest` (Prisma)
- `LocalServiceRequestAuditEvent` (append-only audit)
- `LocalOpsAuditScreen` + REST API (live read path)

These are **reference material only** for Pack7. They are **not** the VIONA Request Engine source of truth.

### Local audit mapping risk

| Topic | Risk |
| --- | --- |
| `LocalServiceRequest` | Local universe SoT — not cross-universe VIONA Request Engine SoT |
| `LocalServiceRequestAuditEvent` | Reference model for append-only audit design — not VIONA audit SoT |
| Status enums | `LocalServiceRequestStatus` ≠ `VionaRequestStatus` — mapping contract required before convergence |
| `LocalOpsAudit` API | Different domain — must not become VIONA operator inbox source |

Do **not** map `LocalServiceRequest` directly to VIONA Request Engine without an approved mapping contract.

## VIONA Request Engine source-of-truth

**Not chosen yet.** Pack7 documents requirements and pure TypeScript contracts only. VIONA Request Engine source-of-truth is not chosen.

## No API/DB/schema/migration in Pack7

Pack7 does not add:

- API routes or controllers
- Prisma schema or migrations
- Repository implementations
- Admin Debug data-source changes
- Request writes or live operator execution

## Future required architecture

1. **Source-of-truth decision** — dedicated VIONA store vs mapped Local vs hybrid
2. **Auth/session/role SoT** — JWT/session, `serverRole`, operator read scope
3. **Tenant/merchant ownership model** — before partner/merchant views
4. **Append-only audit log** — before any mutation
5. **Immutable status transition tracking** — before status writes
6. **Idempotency for writes** — before durable mutations
7. **Human confirmation records** — before protected actions
8. **Operator runbook and audit review** — ops owner signoff
9. **Persistence/API** — later pack, after above gates
10. **DB schema/migration** — later pack, after SoT approval

## Explicit non-goals

- No API
- No DB
- No Prisma migration
- No request writes
- No Admin Debug preview data-source change
- No payment capture
- No booking confirmation
- No SOS dispatch
- No wallet mutation
- No merchant execution
- No live AI action

## Required safe copy

- Persistence and audit readiness contract
- Fixture-only Admin Debug preview remains unchanged
- API and persistence are future gates
- No database schema or migration in this pack
- No payment captured
- Not booking confirmed
- No SOS dispatch
- No live merchant execution
- Human confirmation required before any future protected action
- Audit log is not a ledger

## Files

| File | Role |
| --- | --- |
| `src/config/vionaRequestPersistenceAuditReadiness.ts` | Readiness phases, future gates, forbidden promotions |
| `src/domain/requests/vionaRequestAuditEventTypes.ts` | Pure audit event/actor types |
| `src/domain/requests/vionaRequestPersistenceContract.ts` | Pure repository interface contracts |
| `scripts/viona-request-persistence-audit-readiness-check.mjs` | Pack7 validation gate |

## Config reference

See `getVionaRequestPersistenceAuditReadiness()` and `VIONA_REQUEST_PERSISTENCE_AUDIT_PHASES`.

## Import guidance

Do not wire Admin Debug preview, ReferenceLab, or merchant inboxes to persistence until `persistenceApiActive`, audit log, and role/tenant gates are explicitly approved and implemented in a future pack.
