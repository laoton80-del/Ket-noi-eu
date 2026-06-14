# VIONA Request Source-of-Truth Sign-off and Phase Promotion Readiness

## Why Pack9 exists

Pack8 merged the source-of-truth, auth, and tenant **mapping contract** (PR #63). It documented SoT candidates, Local reference mapping, and the role/tenant access matrix — but explicitly deferred **founder/architect sign-off** and **phase promotion**.

Pack9 defines the formal **sign-off readiness checklist** and **phase promotion rules** without performing promotion.

## Current baseline after PR #63

- Master baseline: `26d6018` — `docs(requests): define source of truth tenant mapping (#63)`
- Recommended SoT: `dedicatedVionaRequestStore` (long-term candidate)
- Sign-off status pending
- `sourceOfTruthDecisionSignedOff: false`
- Admin Debug: **fixture-only** — unchanged in Pack9

## Sign-off readiness checklist

Pack9 encodes 15 checklist items in `VIONA_REQUEST_SOT_SIGNOFF_CHECKLIST`. All remain `satisfied: false` until human sign-off in a future pack or manual process.

Key items:

1. Source-of-truth option chosen by founder/architect
2. Dedicated VIONA Request Store recommended as long-term candidate
3. Direct LocalServiceRequest reuse rejected
4. Hybrid bridge requires explicit mapping/link contract
5. OPERATOR policy decided
6. Until OPERATOR exists, operator reads require ADMIN-equivalent server gate + auditRead
7. Tenant matrix approved for server enforcement
8. Server auth source-of-truth approved
9. auditRead required before live operator reads
10. Append-only audit required before writes
11. Idempotency required before writes
12. Human confirmation required before protected transitions
13. Admin Debug stays fixture-only until explicit promotion
14. No payment/booking/SOS/wallet/live AI in Request Engine pack
15. Runbook owner identified

## Why Cursor/agent cannot flip sign-off

**Cursor/agent cannot flip source-of-truth sign-off.** Sign-off requires human founder/architect approval per Operating Protocol roles. Pack9 sets `agentMayFlipSignoff: false` and `signOffStatus: 'pending'`. A future pack may record human sign-off only after explicit founder/architect action — not from an agent implementation pack.

## Phase promotion stages

See `VIONA_REQUEST_PHASE_PROMOTION_STAGES` and `VIONA_REQUEST_PHASE_PROMOTION_CONTRACT`.

| Stage | Status in Pack9 |
| --- | --- |
| fixtureOnlyAdminDebugPreview | active |
| persistenceAuditReadinessContract | active |
| sourceOfTruthAuthTenantMappingContract | active |
| sotSignoffPhasePromotionReadinessContract | active |
| futureFounderArchitectSignedSourceOfTruth | future (not active) |
| futureDedicatedStoreSchemaDesignCandidate | future (not active) |
| futureReadOnlyPersistenceApiCandidate | future (not active) |
| futureAuditReadImplementationCandidate | future (not active) |
| futureMutationCandidateBlocked | blocked (not active) |

**Chosen SoT is not activated by this pack.**

## OPERATOR role policy

- **Do not add OPERATOR to Prisma or client auth in Pack9.**
- Interim policy: operator reads = ADMIN-equivalent server gate + mandatory `auditRead` until Prisma OPERATOR exists.
- `operatorRoleAddedToAuth: false`, `operatorPolicyResolved: false`

## Dedicated store field manifest

See `VIONA_REQUEST_DEDICATED_STORE_FIELD_MANIFEST` — pure TypeScript field manifest only.

- **This is not Prisma schema**
- **No migration in this pack**
- **No DB activation**
- Fields are future design candidates only
- Local wallet/ledger fields must not imply VIONA completed/paid/settled state

## Future read-only persistence/API prerequisites

1. Founder/architect sign-off (`sourceOfTruthDecisionSignedOff: true` — human only)
2. Server JWT + Prisma role enforcement
3. Tenant access matrix approved for live API
4. auditRead before live operator reads
5. Dedicated store schema design in separate post-sign-off pack
6. Repository adapter implementing `VionaRequestRepositoryContract`
7. No LocalOpsAudit or merchant inbox API reuse

## Writes remain blocked

Until append-only audit, idempotency, human confirmation, and ops runbook sign-off pass — see Pack7/Pack8 future gates.

## Explicit non-goals

- No API
- No DB
- No Prisma migration
- No persistence adapter
- No read-only REST route
- No request writes
- No Admin Debug data-source change
- No flip of `sourceOfTruthDecisionSignedOff`
- No OPERATOR in Prisma/client auth
- No payment capture
- No booking confirmation
- No SOS dispatch
- No wallet mutation
- No merchant execution
- No live AI action

## Required safe copy

- Source-of-truth sign-off phase promotion readiness contract
- Sign-off status pending
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
- Direct LocalServiceRequest reuse is not allowed
- Client-only role checks are not sufficient for persistence APIs
- Cursor/agent cannot flip source-of-truth sign-off

## Files

| File | Role |
| --- | --- |
| `src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts` | Pack9 readiness, checklist, phase stages export |
| `src/domain/requests/vionaRequestPhasePromotionContract.ts` | Phase promotion contract, sign-off roles |
| `src/domain/requests/vionaRequestDedicatedStoreFieldManifest.ts` | Future dedicated store field manifest |
| `scripts/viona-request-sot-signoff-phase-promotion-readiness-check.mjs` | Pack9 validation gate |

## Import guidance

Do not wire Admin Debug, ReferenceLab, or merchant inboxes to persistence until founder/architect sign-off, server auth/tenant gates, auditRead, and dedicated store schema are explicitly approved in future packs.
