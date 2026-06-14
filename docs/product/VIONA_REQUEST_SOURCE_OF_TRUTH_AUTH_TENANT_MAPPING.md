# VIONA Request Source-of-Truth, Auth, and Tenant Mapping

## Why Pack8 exists

Pack7 merged the persistence and audit **readiness contract** (PR #62). It documented future gates, pure repository interface signatures, and audit event types — but explicitly deferred:

- source-of-truth decision
- auth/session source-of-truth
- tenant/merchant ownership model
- Local-to-VIONA mapping contract

Pack8 closes that gap at the **contract layer only**. No API, DB, Prisma migration, persistence adapter, mutation, or Admin Debug data-source change.

## Current baseline after PR #62

- Master baseline: `3f28073` — `docs(requests): define persistence audit readiness (#62)`
- Request Engine: types, status machine, fixtures, ReferenceLab, Admin Debug preview (fixture-only)
- Persistence flags remain **false**: `persistenceApiActive`, `prismaSchemaActive`, `auditLogActive`, `requestMutationActive`, `productionLiveOpsActive`
- Admin Debug: **fixture-only** — unchanged in Pack8

## Source-of-truth candidates

| Option | Long-term | Safe as direct source | Notes |
| --- | --- | --- | --- |
| `dedicatedVionaRequestStore` | **Recommended** | No (schema not yet) | Cross-universe store with universe/intent/risk/human-confirmation fields. New schema deferred to future pack. |
| `mappedFromLocalServiceRequest` | No | **No** | Local-only, wallet-coupled, status mismatch. Reference mapping only. |
| `hybridWithMappingContract` | Bridge candidate | **No** | Requires explicit link fields and approved mapping contract. |

**Recommended direction:** `dedicatedVionaRequestStore` — requires **founder/architect sign-off** before schema, read-only API, or Admin Debug data-source change.

**Source-of-truth decision requires founder/architect sign-off.** Pack8 documents options; it does not activate persistence.

## Why LocalServiceRequest cannot be reused directly

| Topic | Reason |
| --- | --- |
| Universe scope | Local is single-universe; VIONA is cross-universe |
| Status enums | `LocalServiceRequestStatus` (11 values) ≠ `VionaRequestStatus` (9 values) |
| Semantics | e.g. Local `CONFIRMED` ≠ VIONA `partnerResponded`; VIONA `completed` ≠ ledger settled |
| Wallet coupling | Local rows carry `walletMode`, `walletPhase`, credit fields — must not leak into VIONA reads |
| Tenant model | Local uses `businessId`; VIONA record lacks ownership IDs today |
| Live APIs | `LocalMerchantRequestInbox`, `LocalOpsAudit` API are different domains |

Local, Tourism, and Booking models are **reference-only mapping targets** until hybrid link contract is signed off.

## Auth/session source-of-truth requirements

| Layer | Current pattern | Pack8 requirement |
| --- | --- | --- |
| Client | `AuthContext` / `useAuth()`, JWT via REST login, `serverRole` in `AuthUser` | Client guard is **insufficient alone** for persistence reads |
| Server | `authMiddleware` → `req.authUserId`; `superAdminMiddleware` → `User.role === ADMIN` | Server JWT + Prisma role lookup is SoT for API reads |
| Pack6 Admin Debug | Client `serverRole === 'ADMIN'` | Must stay fixture-only until server gates pass |

## OPERATOR role gap

- Pack7 contract uses `serverRole: 'ADMIN' | 'OPERATOR'`
- Prisma `Role` enum has `ADMIN` but **no `OPERATOR`**
- Client `ServerUserRole` mirrors Prisma — no `OPERATOR`

**Interim policy (Pack8):** Until OPERATOR exists in Prisma and server middleware, treat planned OPERATOR reads as ADMIN-equivalent with mandatory `auditRead` logging. `operatorRoleResolved: false` until signed off.

## Tenant/merchant/requester/partner access matrix

See `VIONA_REQUEST_ROLE_TENANT_ACCESS_MATRIX` in `src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts`.

| Actor | Scope | Key rule |
| --- | --- | --- |
| ADMIN | `globalOps` | `universeFilter` required on lists; server gate + `auditRead` |
| OPERATOR | `globalOps` | Policy unresolved; interim same as ADMIN with audit |
| B2B / B2B_EU / B2B_VN | `merchantBusinessOwned` | `businessId IN owned businesses` via `Business.ownerId` |
| B2C / requester | `requesterOwned` | `requesterUserId === authUserId` (field not on VionaRequestRecord yet) |
| BROKER / partner | `partnerAssigned` | No default inbox access; explicit assignment only |

**No `tenantId` in schema today.** Isolation is business-scoped (Local) or booking-scoped (Tourism) — VIONA must not assume a generic tenant key exists.

## Required future access rules before read-only API

1. Founder/architect sign-off on source-of-truth option
2. Server-side auth source-of-truth (not client-only role guard)
3. ADMIN/OPERATOR role policy resolved server-side
4. Merchant tenant isolation (`businessId` ownership)
5. Requester ownership (`requesterUserId`)
6. Partner explicit assignment (no global partner lists)
7. `universeFilter` on global ops reads
8. `auditRead` event before live operator list/detail reads
9. No reuse of `LocalOpsAudit` API, `LocalMerchantRequestInbox`, or `TourismMerchantInbox`

## Required future gates before persistence/API/schema/migration

From Pack7 + Pack8 `futureGates`:

- Source-of-truth decision signed off
- Auth/session SoT implemented server-side
- Tenant access matrix approved
- Append-only audit log before mutation
- Idempotency before writes
- Human confirmation before protected transitions
- Operator runbook sign-off

**No database schema or migration in Pack8.**

## Required future gates before mutation/live ops

- All read-only API gates above
- Immutable status transition log
- Human confirmation records for protected actions
- Payment/booking/SOS/wallet/live AI readiness gates (Pack7)
- `productionLiveOpsActive` remains false

## Explicit non-goals

- No API
- No DB
- No Prisma migration
- No persistence adapter
- No request writes
- No Admin Debug preview data-source change
- No payment capture
- No booking confirmation
- No SOS dispatch
- No wallet mutation
- No merchant execution
- No live AI action

## Required safe copy

- Source-of-truth mapping contract
- Fixture-only Admin Debug preview remains unchanged
- API and persistence are future gates
- No database schema or migration in this pack
- No payment captured
- Not booking confirmed
- No SOS dispatch
- No live merchant execution
- Human confirmation required before any future protected action
- Audit log is not a ledger
- LocalServiceRequest is reference-only
- Source-of-truth decision requires founder/architect sign-off

## Files

| File | Role |
| --- | --- |
| `src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts` | Pack8 phases, SoT options, future gates |
| `src/domain/requests/vionaRequestSourceOfTruthMappingContract.ts` | SoT options, Local status reference mapping |
| `src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts` | Role/tenant access matrix, OPERATOR gap |
| `scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs` | Pack8 validation gate |

## Config reference

See `getVionaRequestSourceOfTruthAuthTenantReadiness()` and `VIONA_REQUEST_AUTH_TENANT_PHASES`.

## Import guidance

Do not wire Admin Debug preview, ReferenceLab, or merchant inboxes to persistence until source-of-truth is signed off, auth/tenant matrix is server-enforced, and `auditRead` gate is implemented in a future pack.
