# VIONA — FC-P0 Local Provider Eligibility Authority  
## Pack A1 — Schema and Domain Enforcement Implementation Evidence

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_DOMAIN_ENFORCEMENT`  
**Mode:** `IMPLEMENTATION_ONLY_NO_DEPLOY_NO_MIGRATION_APPLY`  
**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_SCHEMA_DOMAIN_ENFORCEMENT_PR_REVIEW`

```text
PACK_A1_SCHEMA_DOMAIN_ENFORCEMENT
STRUCTURE_ONLY_MIGRATION
ZERO_ELIGIBILITY_ROWS
ZERO_AUDIT_ROWS
NO_PROVIDER_ACTIVATION
NO_A2_ROUTES
NO_CLIENT_WIRING
NO_MIGRATION_APPLY
NO_DEPLOY
NO_LIVE_LOCAL_REQUEST
FC_P0_STILL_BLOCKED_PENDING_A2_AND_B
REQUEST_ONLY_NO_CHARGE_PRESERVED
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN
```

---

## 1. Canonical baseline

| Field | Value |
|---|---|
| Canonical root | `C:\KNG\ket-noi-eu` |
| Required baseline | `4d0e6cff083f86ef153979446be4785bdbcfb73b` (PR #418 squash on `origin/master`) |
| Branch | `feat/viona-fc-p0-local-provider-eligibility-schema-domain-enforcement` |
| Plan authority | `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION.md` |

---

## 2. Exact changed paths

| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | Enums + `LocalProviderEligibility` + `LocalProviderEligibilityAuditEvent` + Restrict graph |
| `prisma/migrations/20260722120000_add_local_provider_eligibility_authority/migration.sql` | Structure-only migration (zero data) |
| `src/services/local/localProviderEligibilityDomain.ts` | Selectability / service-type / create validation helpers |
| `src/services/local/localProviderEligibilityLifecycle.ts` | Pure lifecycle timestamp transition table |
| `src/services/local/localProviderEligibilityAuditAppendOnlyGate.ts` | Append-only source scan gate |
| `src/services/local/localRequestCreateService.ts` | In-transaction eligibility enforcement + safe P2021 mapping |
| `src/controllers/LocalRequestController.ts` | 404/400 failure mappings (no status leak) |
| `scripts/test-local-provider-eligibility-schema-domain.ts` | A1 cases 1–29 |
| `scripts/localProviderEligibilityTestSupport.ts` | NO_MIGRATION_APPLY regression fixture helper |
| `scripts/test-local-request-create-source-of-truth.ts` | Skip valid create when table unapplied |
| `scripts/test-local-user-request-list-api.ts` | Fixture helper under unapplied migration |
| `scripts/test-local-user-request-timeline-1.ts` | Fixture helper under unapplied migration |
| `scripts/test-local-user-request-cancel-api.ts` | Fixture helper under unapplied migration |
| `package.json` | `test:local-provider-eligibility-schema-domain` script |
| `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_SCHEMA_DOMAIN_ENFORCEMENT_IMPLEMENTATION_EVIDENCE.md` | This evidence |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | Kernel sync |
| `Handoff_VIONA11726.txt` | Handoff sync |

**Confirmation:** no A2 route, client provider loader, deployment config, or migration-apply path touched.

---

## 3. Prisma enums and models

**Enums**

- `LocalProviderEligibilityStatus`: `DRAFT | ACTIVE | SUSPENDED | RETIRED`
- `LocalProviderEligibilityAuditEventType`: `REGISTERED | CONFIG_UPDATED | ACTIVATED | SUSPENDED | RETIRED`
- `LocalProviderEligibilityAuditActorType`: `ROLE_ADMIN`

**`LocalProviderEligibility`**

- UUID `id`; unique `businessId` 1:1 `Business` (`onDelete: Restrict`)
- Defaults: `DRAFT`, `publicB2cVisible=false`, `supportedServiceTypes=[]`
- Lifecycle: `activatedAt` / `suspendedAt` / `retiredAt` nullable
- Index: `[status, publicB2cVisible]` — no GIN

**`LocalProviderEligibilityAuditEvent`**

- Append-only; no `updatedAt` / `metadataJson`
- `businessId` scalar snapshot (no Business FK)
- Prior: nullable status/visibility; lists `@default([])`
- Indexes: eligibility/business/actor/eventType + `createdAt`

---

## 4. Restrict relation graph

| Edge | onDelete |
|---|---|
| Eligibility → Business | Restrict |
| Audit → Eligibility | Restrict |
| Audit → actor User | Restrict |
| Audit.`businessId` | Scalar snapshot only |

No eligibility/audit deletion services in Pack A1.

---

## 5. Lifecycle timestamps

Implemented in `localProviderEligibilityLifecycle.ts` (pure; no routes):

| Transition | activatedAt | suspendedAt | retiredAt |
|---|---|---|---|
| New DRAFT | null | null | null |
| DRAFT→ACTIVE | now | null | null |
| ACTIVE→SUSPENDED | unchanged | now | null |
| SUSPENDED→ACTIVE | now | null | null |
| DRAFT→RETIRED | null | null | now |
| ACTIVE→RETIRED | unchanged | null | now |
| SUSPENDED→RETIRED | unchanged | unchanged | now |

No timestamp mutation on reads, create eligibility checks, config-only logic, failed validation, or rollback.

---

## 6. REGISTERED prior-state

`buildRegisteredPriorState()` / `isRegisteredNoPriorState()`:

- `priorStatus = null`
- `priorPublicB2cVisible = null`
- `priorSupportedServiceTypes = []`
- Discriminator: `eventType == REGISTERED` AND both priors null

No optional scalar-list syntax; no `metadataJson` / `hasPriorState`.

---

## 7. Append-only boundary

- Schema comment + `localProviderEligibilityAuditAppendOnlyGate.ts` forbids production `update` / `updateMany` / `delete` / `deleteMany` on audit model under scanned roots.
- Create path does **not** write `LocalProviderEligibilityAuditEvent`.
- No fake audit events generated in A1.

---

## 8. Migration (structure-only)

- Name: `20260722120000_add_local_provider_eligibility_authority`
- Creates enums, tables, FKs (Restrict), indexes only
- **Zero** `INSERT` / seed / backfill / Business activation
- **Not applied** to staging/production (remote Supabase `DATABASE_URL` left untouched)

---

## 9. Domain helpers

| Helper | Rule |
|---|---|
| `isLocalProviderSelectable` | Business + valid name + eligibility + ACTIVE + public + non-empty types |
| `isLocalProviderAllowedForServiceType` | selectable AND type in `supportedServiceTypes` |
| `validateLocalProviderEligibilityForCreate` | `business_not_found` / `provider_not_available` / `service_type_not_supported` |

No inference from BizType, Tourism, history, or ownership alone. Helpers do not mutate eligibility.

---

## 10. Create enforcement

Inside existing `prisma.$transaction` (READ COMMITTED):

1. Read Business  
2. Read `LocalProviderEligibility`  
3. Validate selectability + service type  
4. Create `LocalServiceRequest`  
5. Create existing Local request audit  
6. Commit atomically  

Pre-migration safety: Prisma `P2021` on missing eligibility table → `provider_not_available` (no 500).

---

## 11. Failure mappings

| Condition | HTTP |
|---|---|
| Unknown Business | 404 |
| No eligibility / DRAFT / SUSPENDED / RETIRED / private / invalid name | 404 generic “Provider not available” |
| Unsupported service type | 400 |
| No create-specific 403/409 | Confirmed |

No leakage of internal status, suspension/retirement, or audit reason.

---

## 12. READ COMMITTED (A–E)

Locked by source comment + deterministic coordinator in A1 tests:

- A/C/D: create read ACTIVE before suspension commit → may complete  
- B/E: suspension committed before eligibility read → reject  
- No row lock / SERIALIZABLE / raw SQL added  

---

## 13. A1 tests 1–29

Command: `npx tsx scripts/test-local-provider-eligibility-schema-domain.ts` → **OK**

| Cases | Coverage |
|---|---|
| 1–7 | Migration structure, zero data, schema defaults/indexes, audit model |
| 8–17 | Domain selectability + service-type |
| 18–25 | Create failure reasons + controller 404/400 wiring |
| 26–27 | Transactional create + request-audit atomicity (source) |
| 28–29 | READ COMMITTED coordinator |
| Gates | Append-only scan; no A2 `/providers` or `/ops/providers` routes |

DB valid-create path in `test-local-request-create-source-of-truth.ts` **SKIPPED** while migration unapplied (`NO_MIGRATION_APPLY`); domain + source proofs cover create enforcement.

---

## 14. Validation / regression

| Command | Result |
|---|---|
| `npx prisma validate` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run ci:expo-readiness` | PASS |
| `npm run ci:release-discipline` | PASS |
| `npm run test:local-provider-eligibility-schema-domain` | PASS (1–29) |
| `npx tsx scripts/test-local-request-create-source-of-truth.ts` | PASS (valid create skipped — unapplied) |
| `npx tsx scripts/test-local-user-request-create-client.ts` | PASS |
| `npx tsx scripts/test-local-request-eligibility-client-contract.ts` | PASS |
| `npx tsx scripts/test-local-service-request-client-contract.ts` | PASS |
| `npx tsx scripts/test-local-user-request-list-api.ts` | PASS |
| `npx tsx scripts/test-local-user-request-timeline-1.ts` | PASS |
| `npx tsx scripts/test-local-user-request-cancel-api.ts` | PASS |
| `npx tsx scripts/test-api-client-no-public-dev-jwt.ts` | PASS |
| `npx tsx scripts/check-mobile-no-prisma-client.ts` | PASS |
| `npm run functions:verify-bundle` | PASS |
| Modern Home Phase A/B/C scripts | PASS |
| SOS Phase 1 + left-rail | PASS |
| Profile/Language Phase 2 | PASS |
| `npm run smoke` | PASS |

**Pre-existing:** Functions TypeScript debt not fixed (recorded separately; not in Pack A1 scope).

---

## 15. Confirmations

1. No A2 routes or provider mutation APIs  
2. No client provider loading / no `PROVIDER_SELECTION_UNAVAILABLE` replacement  
3. No migration apply (remote DB unchanged)  
4. No provider activation / zero eligibility rows inserted by migration  
5. No deployment / no live Local request QA  
6. FC-P0 remains **blocked** pending Pack A2 + Pack B  
7. `REQUEST_ONLY_NO_CHARGE` preserved  
8. Phase C Modern Home remains closed green  
9. Pack40S remains unauthorized  
10. Apple / EAS / Phase D2 remain deferred  

---

## 16. Exactly one next operator action

Strict read-only review of this Pack A1 implementation PR.  
Do **not** merge as FC-P0 closed.  
Do **not** apply the migration.  
Do **not** auto-authorize Pack A2.

---

## 17. Final classification

`READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_SCHEMA_DOMAIN_ENFORCEMENT_PR_REVIEW`
